import Anthropic from '@anthropic-ai/sdk'
import {
  AnalyzeError,
  SCHEMA,
  SYSTEM_PROMPT,
  buildUserMessage,
  normalizeResult,
  phaseOf,
  safePartialParse,
  type AnalyzeSegmentOptions,
} from './core'
import type { SegmentResult } from './types'

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
