import type { Chunk, GrammarPoint, Sentence, StudyCard, VocabItem, CardKind } from './types'

const DAY = 24 * 60 * 60 * 1000

/** Leitner box ごとの復習間隔（日） */
const INTERVAL_DAYS = [0, 1, 2, 4, 7, 15, 30]
export const MAX_BOX = INTERVAL_DAYS.length - 1
/** この box 以上を「覚えた」とみなす */
export const MASTERED_BOX = 4

export type Grade = 'again' | 'hard' | 'good'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function cardKey(kind: CardKind, front: string): string {
  return `${kind}:${front.trim().toLowerCase()}`
}

const TRAILING_PUNCT = /[\s.,!?;:。、，！？…"'”’」』)\]]+$/u

interface CardContext {
  language: string
  languageCode: string
  source: string
}

function baseCard(ctx: CardContext): Omit<StudyCard, 'kind' | 'front' | 'reading' | 'back' | 'note' | 'example' | 'exampleTranslation'> {
  const now = Date.now()
  return {
    id: newId(),
    language: ctx.language,
    languageCode: ctx.languageCode,
    source: ctx.source,
    createdAt: now,
    box: 0,
    due: now,
    reviews: 0,
    lapses: 0,
  }
}

export function cardFromChunk(chunk: Chunk, sentence: Sentence, ctx: CardContext): StudyCard {
  return {
    ...baseCard(ctx),
    kind: 'phrase',
    front: chunk.text.replace(TRAILING_PUNCT, '') || chunk.text,
    reading: chunk.reading,
    back: chunk.meaning,
    note: chunk.note,
    example: sentence.original,
    exampleTranslation: sentence.translation,
  }
}

export function cardFromVocab(v: VocabItem, ctx: CardContext): StudyCard {
  const lemma = v.lemma || v.word
  const formNote = v.word && v.word !== lemma ? `本文では「${v.word}」` : ''
  return {
    ...baseCard(ctx),
    kind: 'word',
    front: lemma,
    reading: v.reading,
    back: v.meaning,
    note: [v.pos, formNote].filter(Boolean).join(' ・ '),
    example: v.example,
    exampleTranslation: v.exampleTranslation,
  }
}

export function cardFromGrammar(g: GrammarPoint, ctx: CardContext): StudyCard {
  return {
    ...baseCard(ctx),
    kind: 'grammar',
    front: g.pattern,
    reading: '',
    back: g.meaning,
    note: g.explanation,
    example: g.example,
    exampleTranslation: g.exampleTranslation,
  }
}

/** 採点後のカードを返す */
export function gradeCard(card: StudyCard, grade: Grade, now = Date.now()): StudyCard {
  const reviews = card.reviews + 1
  if (grade === 'again') {
    return { ...card, box: 0, due: now, reviews, lapses: card.lapses + 1 }
  }
  if (grade === 'hard') {
    // 段階は上げず、「覚えた」の半分の間隔で出し直す
    const box = Math.max(1, card.box)
    const days = Math.max(0.5, INTERVAL_DAYS[box] / 2)
    return { ...card, box, due: now + days * DAY, reviews }
  }
  const box = Math.min(MAX_BOX, card.box + 1)
  return { ...card, box, due: now + INTERVAL_DAYS[box] * DAY, reviews }
}

/** 採点ボタンに表示する「次はいつ」 */
export function nextIntervalLabel(card: StudyCard, grade: Grade): string {
  if (grade === 'again') return 'もう一度'
  const ms = gradeCard(card, grade, 0).due
  if (ms < DAY) return `${Math.round(ms / (60 * 60 * 1000))}時間後`
  return `${Math.round(ms / DAY)}日後`
}

export function isDue(card: StudyCard, now = Date.now()): boolean {
  return card.due <= now
}

export function statusOf(card: StudyCard): 'new' | 'learning' | 'mastered' {
  if (card.reviews === 0) return 'new'
  return card.box >= MASTERED_BOX ? 'mastered' : 'learning'
}

export const KIND_LABEL: Record<CardKind, string> = {
  word: '単語',
  phrase: 'フレーズ',
  grammar: '文法',
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Anki などに取り込める CSV（表面, 裏面, 読み, メモ, 例文, 例文訳, 種類） */
export function cardsToCsv(cards: StudyCard[]): string {
  const header = ['front', 'back', 'reading', 'note', 'example', 'example_translation', 'kind']
  const rows = cards.map((c) =>
    [c.front, c.back, c.reading, c.note, c.example, c.exampleTranslation, KIND_LABEL[c.kind]]
      .map(csvCell)
      .join(','),
  )
  return [header.join(','), ...rows].join('\n')
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
