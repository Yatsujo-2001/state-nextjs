// KUGIRI — テキストを区切って覚える言語学習アプリの型定義

/** 文の中の「区切り」（意味のまとまり） */
export interface Chunk {
  text: string
  reading: string
  meaning: string
  note: string
}

export interface Sentence {
  original: string
  chunks: Chunk[]
  translation: string
}

export interface VocabItem {
  word: string
  lemma: string
  reading: string
  meaning: string
  pos: string
  example: string
  exampleTranslation: string
}

export interface GrammarPoint {
  pattern: string
  meaning: string
  explanation: string
  example: string
  exampleTranslation: string
}

/** 1回のAPI呼び出し（長文の1区間）で返ってくる結果 */
export interface SegmentResult {
  language: string
  languageCode: string
  sentences: Sentence[]
  vocabulary: VocabItem[]
  grammar: GrammarPoint[]
}

/** 保存される解析結果 */
export interface Analysis {
  id: string
  title: string
  createdAt: number
  sourceText: string
  language: string
  languageCode: string
  sentences: Sentence[]
  vocabulary: VocabItem[]
  grammar: GrammarPoint[]
  isSample?: boolean
}

export type CardKind = 'word' | 'phrase' | 'grammar'

/** 暗記リストのカード */
export interface StudyCard {
  id: string
  kind: CardKind
  front: string
  reading: string
  back: string
  note: string
  example: string
  exampleTranslation: string
  language: string
  languageCode: string
  source: string
  createdAt: number
  /** Leitner box 0〜6。大きいほど定着している */
  box: number
  /** 次に復習する時刻 (ms) */
  due: number
  reviews: number
  lapses: number
}

export type ModelId = 'claude-opus-5-5' | 'claude-sonnet-5-5' | 'claude-haiku-5-5'

export interface Settings {
  apiKey: string
  model: ModelId
  speechRate: number
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'claude-opus-5-5',
  speechRate: 0.9,
}

export const MODEL_OPTIONS: { id: ModelId; label: string; hint: string }[] = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', hint: '高精度（おすすめ）' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', hint: 'バランス型' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', hint: '高速・低コスト' },
]
