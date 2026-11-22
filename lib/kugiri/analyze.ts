import Anthropic from '@anthropic-ai/sdk'
import { partialParse } from '@anthropic-ai/sdk/_vendor/partial-json-parser/parser'
import type {
  Analysis,
  GrammarPoint,
  ModelId,
  SegmentResult,
  Sentence,
  VocabItem,
} from './types'

/** 1回のリクエストで送る最大文字数。長文はこれ以下の区間に分けて並列に解析する */
const SEGMENT_MAX_CHARS = 600
const CONCURRENCY = 3

const str = { type: 'string' } as const

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['language', 'languageCode', 'sentences', 'vocabulary', 'grammar'],
  properties: {
    language: str,
    languageCode: str,
    sentences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original', 'chunks', 'translation'],
        properties: {
          original: str,
          chunks: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['text', 'reading', 'meaning', 'note'],
              properties: { text: str, reading: str, meaning: str, note: str },
            },
          },
          translation: str,
        },
      },
    },
    vocabulary: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'lemma', 'reading', 'meaning', 'pos', 'example', 'exampleTranslation'],
        properties: {
          word: str,
          lemma: str,
          reading: str,
          meaning: str,
          pos: str,
          example: str,
          exampleTranslation: str,
        },
      },
    },
    grammar: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['pattern', 'meaning', 'explanation', 'example', 'exampleTranslation'],
        properties: {
          pattern: str,
          meaning: str,
          explanation: str,
          example: str,
          exampleTranslation: str,
        },
      },
    },
  },
}

const SYSTEM_PROMPT = `あなたは日本語話者のための外国語チューターです。ユーザーが貼り付けた外国語のテキストを、学習者が「区切りごと」に理解し、暗記できるように分解して返します。説明はすべて日本語で書きます。

各フィールドの書き方:

- language: テキストの言語名を日本語で（例: 韓国語）
- languageCode: 読み上げに使う BCP 47 コード（例: ko-KR, zh-CN, en-US, es-ES）
- sentences: テキストのすべての文を、原文の順番どおりに、一文も省略せずに並べる
  - original: 原文の文をそのまま（改変・要約しない）
  - chunks: 文を意味のまとまり（文節・句）ごとに区切ったもの。学習者が一度に覚えられる長さ（おおむね1〜3語）にする。すべての chunk の text を順番につなげると original になるようにし、句読点は直前の chunk に含める
    - text: その区切りの原文
    - reading: 読み方。韓国語は実際の発音（連音化・濃音化・鼻音化などを反映）をカタカナで。中国語は声調記号つきピンイン。それ以外の言語は空文字でよい（難しい語だけカタカナで発音のヒントを書いてもよい）
    - meaning: その区切りの、文脈に合った日本語の意味（短く）
    - note: 助詞・語尾・活用・慣用表現など、その区切りで押さえるべき点を1文で。特になければ空文字
  - translation: 文全体の自然な日本語訳
- vocabulary: 学習者が覚える価値のある語。助詞、固有名詞、ごく初歩的な語は除き、同じ語は1回だけ
  - word: テキストに出てきた形
  - lemma: 辞書形（韓国語の用言は「-다」の形、英語の動詞は原形）
  - reading: lemma の読み（reading と同じルール）
  - meaning: 主な日本語訳を1〜3個、「、」区切りで
  - pos: 品詞を日本語で（名詞、動詞、形容詞、副詞 など）
  - example: その語を含む、テキスト中の文
  - exampleTranslation: example の日本語訳
- grammar: テキストに出てくる、覚える価値のある文法・表現パターン。同じものは1回だけ
  - pattern: 形（例: -는데, -(으)ㄹ 수 있다, be going to）
  - meaning: 日本語での意味（例: 〜けど、〜のに）
  - explanation: 使い方を1〜2文で
  - example: その表現を含む、テキスト中の文
  - exampleTranslation: example の日本語訳`

function buildUserMessage(text: string, index: number, total: number): string {
  const position =
    total > 1 ? `これは長い文章を${total}つに分けたうちの${index + 1}番目の部分です。\n\n` : ''
  return `${position}次のテキストを解析してください。\n\n<text>\n${text}\n</text>`
}

/** 長文を文・段落の切れ目で SEGMENT_MAX_CHARS 以下の区間に分ける */
export function splitIntoSegments(input: string): string[] {
  const text = input.replace(/\r\n?/g, '\n').trim()
  if (!text) return []
  if (text.length <= SEGMENT_MAX_CHARS) return [text]

  const pieces: string[] = []
  for (const paragraph of text.split(/\n+/)) {
    const p = paragraph.trim()
    if (!p) continue
    if (p.length <= SEGMENT_MAX_CHARS) {
      pieces.push(p)
      continue
    }
    // 文末記号のあとで区切る
    const sentences = p.match(/[^.!?。！？…]+(?:[.!?。！？…]+["'”’」』)]*\s*|$)/g) ?? [p]
    pieces.push(...sentences.map((s) => s.trim()).filter(Boolean))
  }

  const segments: string[] = []
  let current = ''
  for (const piece of pieces) {
    const joiner = current ? '\n' : ''
    if (current && current.length + joiner.length + piece.length > SEGMENT_MAX_CHARS) {
      segments.push(current)
      current = piece
    } else {
      current += joiner + piece
    }
  }
  if (current) segments.push(current)
  return segments
}

export class AnalyzeError extends Error {
  /** true のとき、残りの区間も同じ理由で失敗するので解析全体を止める（APIキー不正など） */
  constructor(
    message: string,
    readonly stopsAll: boolean = false,
  ) {
    super(message)
    this.name = 'AnalyzeError'
  }
}

function toAnalyzeError(err: unknown): AnalyzeError {
  if (err instanceof AnalyzeError) return err
  if (err instanceof Anthropic.APIUserAbortError) return new AnalyzeError('中止しました。')
  if (err instanceof Anthropic.AuthenticationError)
    return new AnalyzeError('APIキーが正しくありません。設定画面でキーを確認してください。', true)
  if (err instanceof Anthropic.PermissionDeniedError)
    return new AnalyzeError('このAPIキーでは選択中のモデルを利用できません。', true)
  if (err instanceof Anthropic.NotFoundError)
    return new AnalyzeError('モデルが見つかりませんでした。設定でモデルを変更してください。', true)
  if (err instanceof Anthropic.RateLimitError)
    return new AnalyzeError('利用上限（レート制限）に達しました。少し待ってから再試行してください。')
  if (err instanceof Anthropic.BadRequestError)
    return new AnalyzeError(`リクエストが受け付けられませんでした: ${err.message}`, true)
  if (err instanceof Anthropic.InternalServerError)
    return new AnalyzeError('APIサーバーが混み合っています。少し待ってから再試行してください。')
  if (err instanceof Anthropic.APIConnectionError)
    return new AnalyzeError('ネットワークに接続できませんでした。通信環境を確認してください。')
  if (err instanceof Anthropic.APIError)
    return new AnalyzeError(`APIエラー (${err.status ?? '不明'}): ${err.message}`)
  return new AnalyzeError(err instanceof Error ? err.message : String(err))
}

export type SegmentPhase = 'thinking' | 'sentences' | 'vocabulary' | 'grammar'

export interface SegmentProgress {
  phase: SegmentPhase
  partial: Partial<SegmentResult>
}

function safePartialParse(text: string): Partial<SegmentResult> {
  try {
    const value = partialParse(text)
    return value && typeof value === 'object' ? (value as Partial<SegmentResult>) : {}
  } catch {
    return {}
  }
}

function phaseOf(text: string): SegmentPhase {
  if (!text) return 'thinking'
  if (text.includes('"grammar"')) return 'grammar'
  if (text.includes('"vocabulary"')) return 'vocabulary'
  return 'sentences'
}

function normalizeResult(raw: Partial<SegmentResult>): SegmentResult {
  return {
    language: raw.language ?? '',
    languageCode: raw.languageCode ?? '',
    sentences: (raw.sentences ?? []).filter((s) => s && typeof s.original === 'string'),
    vocabulary: (raw.vocabulary ?? []).filter((v) => v && typeof v.meaning === 'string'),
    grammar: (raw.grammar ?? []).filter((g) => g && typeof g.meaning === 'string'),
  }
}

export interface AnalyzeSegmentOptions {
  apiKey: string
  model: ModelId
  text: string
  index: number
  total: number
  signal?: AbortSignal
  onProgress?: (progress: SegmentProgress) => void
}

/** 1区間を Claude に送り、ストリーミングで途中経過を返しながら解析する */
export async function analyzeSegment(
  opts: AnalyzeSegmentOptions,
): Promise<{ result: SegmentResult; truncated: boolean }> {
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true })

  let accumulated = ''
  let lastEmit = 0
  const emit = (force = false) => {
    const now = Date.now()
    if (!force && now - lastEmit < 250) return
    lastEmit = now
    opts.onProgress?.({ phase: phaseOf(accumulated), partial: safePartialParse(accumulated) })
  }

  try {
    opts.onProgress?.({ phase: 'thinking', partial: {} })
    const stream = client.beta.messages.stream(
      {
        model: opts.model,
        max_tokens: 32000,
        // 安全分類器が誤って拒否したときに、サーバー側で代替モデルに切り替える
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: 'medium',
          format: { type: 'json_schema', schema: SCHEMA },
        },
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserMessage(opts.text, opts.index, opts.total) },
        ],
      },
      { signal: opts.signal },
    )

    stream.on('text', (delta) => {
      accumulated += delta
      emit()
    })

    const message = await stream.finalMessage()

    if (message.stop_reason === 'refusal') {
      throw new AnalyzeError('この区間は安全上の理由で解析できませんでした。')
    }

    // 途中で代替モデルに切り替わった場合も、テキストブロックをつなげると1つのJSONになる
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    if (message.stop_reason === 'max_tokens') {
      const partial = normalizeResult(safePartialParse(text))
      if (partial.sentences.length === 0) {
        throw new AnalyzeError('出力が長すぎて途中で切れました。文章を短くして再試行してください。')
      }
      return { result: partial, truncated: true }
    }

    let parsed: Partial<SegmentResult>
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new AnalyzeError('解析結果を読み取れませんでした。もう一度お試しください。')
    }
    const result = normalizeResult(parsed)
    if (result.sentences.length === 0) {
      throw new AnalyzeError('文が見つかりませんでした。別のテキストでお試しください。')
    }
    return { result, truncated: false }
  } catch (err) {
    throw toAnalyzeError(err)
  }
}

/** 複数のタスクを同時実行数を制限して実行する */
export async function runWithConcurrency(
  count: number,
  task: (index: number) => Promise<void>,
  limit = CONCURRENCY,
): Promise<void> {
  let next = 0
  const workers = Array.from({ length: Math.min(limit, count) }, async () => {
    while (next < count) {
      const i = next++
      await task(i)
    }
  })
  await Promise.all(workers)
}

const keyOf = (s: string) => s.trim().toLowerCase()

/** 区間ごとの結果を1つにまとめる（単語・文法は重複を除く） */
export function mergeResults(results: Partial<SegmentResult>[]): SegmentResult {
  const sentences: Sentence[] = []
  const vocabulary: VocabItem[] = []
  const grammar: GrammarPoint[] = []
  const seenVocab = new Set<string>()
  const seenGrammar = new Set<string>()
  let language = ''
  let languageCode = ''

  for (const r of results) {
    if (!language && r.language) language = r.language
    if (!languageCode && r.languageCode) languageCode = r.languageCode
    sentences.push(...(r.sentences ?? []))
    for (const v of r.vocabulary ?? []) {
      const k = keyOf(v.lemma || v.word || '')
      if (!k || seenVocab.has(k)) continue
      seenVocab.add(k)
      vocabulary.push(v)
    }
    for (const g of r.grammar ?? []) {
      const k = keyOf(g.pattern || '')
      if (!k || seenGrammar.has(k)) continue
      seenGrammar.add(k)
      grammar.push(g)
    }
  }
  return { language, languageCode, sentences, vocabulary, grammar }
}

export function makeTitle(text: string): string {
  const firstLine = text.trim().split(/\n/)[0] ?? ''
  return firstLine.length > 28 ? `${firstLine.slice(0, 28)}…` : firstLine || '無題のテキスト'
}

export function buildAnalysis(
  id: string,
  sourceText: string,
  results: Partial<SegmentResult>[],
): Analysis {
  const merged = mergeResults(results)
  return {
    id,
    title: makeTitle(sourceText),
    createdAt: Date.now(),
    sourceText,
    ...merged,
  }
}
