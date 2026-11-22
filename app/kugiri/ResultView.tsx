'use client'

import { useState } from 'react'
import type { SegmentPhase } from '@/lib/kugiri/analyze'
import { cardFromChunk, cardFromGrammar, cardFromVocab, cardKey } from '@/lib/kugiri/cards'
import { speak } from '@/lib/kugiri/speech'
import type { Chunk, GrammarPoint, Sentence, StudyCard, VocabItem } from '@/lib/kugiri/types'
import {
  AddButton,
  ArrowLeftIcon,
  Button,
  FOREIGN_FONT,
  IconButton,
  PlusIcon,
  SectionTitle,
  SpeakerIcon,
  Toggle,
} from './ui'

export type ResultBlock =
  | { kind: 'sentences'; sentences: Sentence[] }
  | { kind: 'running'; sentences: Partial<Sentence>[]; phase: SegmentPhase; text: string }
  | { kind: 'pending'; text: string }
  | { kind: 'error'; text: string; message: string; segmentIndex: number }

const PHASE_LABEL: Record<SegmentPhase, string> = {
  thinking: '文の構造を読み解いています',
  sentences: '区切っています',
  vocabulary: '単語を抜き出しています',
  grammar: '文法をまとめています',
}

interface CardContext {
  language: string
  languageCode: string
  source: string
}

interface DisplayOptions {
  showReading: boolean
  hideMeaning: boolean
  showTranslation: boolean
}

interface ResultViewProps {
  title: string
  language: string
  languageCode: string
  blocks: ResultBlock[]
  vocabulary: VocabItem[]
  grammar: GrammarPoint[]
  isSample?: boolean
  live?: { done: number; total: number }
  hasErrors?: boolean
  cardKeys: Set<string>
  speechRate: number
  onAddCards: (cards: StudyCard[]) => void
  onBack: () => void
  onStudy: () => void
  onRetry?: (segmentIndex: number) => void
  onRetryAll?: () => void
  onCancel?: () => void
  onSavePartial?: () => void
}

export default function ResultView(props: ResultViewProps) {
  const {
    title,
    language,
    languageCode,
    blocks,
    vocabulary,
    grammar,
    isSample,
    live,
    hasErrors,
    cardKeys,
    speechRate,
    onAddCards,
  } = props
  const [display, setDisplay] = useState<DisplayOptions>({
    showReading: true,
    hideMeaning: false,
    showTranslation: true,
  })
  const ctx: CardContext = { language, languageCode, source: title }
  const say = (text: string) => speak(text, languageCode, speechRate)

  const sentenceCount = blocks.reduce(
    (n, b) => n + (b.kind === 'sentences' || b.kind === 'running' ? b.sentences.length : 0),
    0,
  )

  const newVocab = vocabulary.filter((v) => !cardKeys.has(cardKey('word', v.lemma || v.word)))
  const newGrammar = grammar.filter((g) => !cardKeys.has(cardKey('grammar', g.pattern)))

  let sentenceNo = 0

  return (
    <div className="pb-24">
      <div className="mb-5 flex items-center gap-2">
        <Button variant="ghost" onClick={props.onBack} className="-ml-3 px-3">
          <ArrowLeftIcon /> 戻る
        </Button>
      </div>

      <header className="mb-5">
        <h1 className="font-noto text-xl font-bold leading-snug text-text sm:text-2xl">{title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-noto text-xs text-text-muted">
          {language && (
            <span className="rounded-full border border-accent/50 px-2 py-0.5 text-[#cfe0f6]">{language}</span>
          )}
          <span>{sentenceCount}文</span>
          <span>単語 {vocabulary.length}</span>
          <span>文法 {grammar.length}</span>
        </p>
      </header>

      {isSample && (
        <div className="mb-5 rounded-lg border border-[#2a3a50] bg-[#0f1824] px-4 py-3 font-noto text-xs leading-relaxed text-[#cfe0f6]">
          これはサンプルです。区切りをタップすると解説が出て、暗記リストに追加できます。自分のテキストを解析するには、右上の設定から APIキーを登録してください。
        </div>
      )}

      {live && (
        <div className="mb-5 rounded-lg border border-[#1e1e1e] bg-[#111] px-4 py-3">
          <div className="flex items-center justify-between gap-3 font-noto text-xs text-text-muted">
            <span>
              解析中… {live.done} / {live.total} 区間
            </span>
            {props.onCancel && (
              <button type="button" onClick={props.onCancel} className="text-[#e08a80] hover:underline">
                中止
              </button>
            )}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#1e1e1e]">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.max(6, (live.done / live.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {hasErrors && !live && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-[#4a2723] bg-[#1a0f0e] px-4 py-3 font-noto text-xs text-[#e08a80]">
          <span className="mr-auto">一部の区間を解析できませんでした。</span>
          {props.onRetryAll && (
            <Button variant="secondary" onClick={props.onRetryAll} className="px-3 py-1.5 text-xs">
              エラー区間を再試行
            </Button>
          )}
          {props.onSavePartial && (
            <Button variant="ghost" onClick={props.onSavePartial} className="px-3 py-1.5 text-xs">
              完了分だけ保存
            </Button>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2 border-t border-[#1a1a1a] bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Toggle
          label="読み"
          checked={display.showReading}
          onChange={(v) => setDisplay((d) => ({ ...d, showReading: v }))}
        />
        <Toggle
          label="意味を隠す"
          checked={display.hideMeaning}
          onChange={(v) => setDisplay((d) => ({ ...d, hideMeaning: v }))}
        />
        <Toggle
          label="全文訳"
          checked={display.showTranslation}
          onChange={(v) => setDisplay((d) => ({ ...d, showTranslation: v }))}
        />
      </div>

      <div className="space-y-3">
        {blocks.map((block, i) => {
          if (block.kind === 'pending') {
            return (
              <div key={i} className="rounded-xl border border-dashed border-[#232323] p-4">
                <p className="mb-2 font-noto text-[11px] text-text-muted">待機中</p>
                <p className="line-clamp-3 text-sm leading-relaxed text-[#5a5652]" style={FOREIGN_FONT}>
                  {block.text}
                </p>
              </div>
            )
          }
          if (block.kind === 'error') {
            return (
              <div key={i} className="rounded-xl border border-[#4a2723] bg-[#140c0b] p-4">
                <p className="mb-2 font-noto text-xs text-[#e08a80]">{block.message}</p>
                <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-[#6a6662]" style={FOREIGN_FONT}>
                  {block.text}
                </p>
                {props.onRetry && (
                  <Button
                    variant="secondary"
                    onClick={() => props.onRetry?.(block.segmentIndex)}
                    className="px-3 py-1.5 text-xs"
                  >
                    この区間を再試行
                  </Button>
                )}
              </div>
            )
          }
          const items = block.sentences.map((s, k) => {
            sentenceNo += 1
            return (
              <SentenceCard
                key={`${i}-${k}`}
                number={sentenceNo}
                sentence={s}
                display={display}
                cardKeys={cardKeys}
                ctx={ctx}
                onSpeak={say}
                onAddCards={onAddCards}
              />
            )
          })
          if (block.kind === 'running') {
            return (
              <div key={i} className="space-y-3">
                {items}
                <div className="rounded-xl border border-[#1e2a3a] bg-[#0d131b] p-4">
                  <p className="flex items-center gap-2 font-noto text-xs text-[#9cc0ec]">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                    {PHASE_LABEL[block.phase]}…
                  </p>
                  {block.sentences.length === 0 && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#5a5652]" style={FOREIGN_FONT}>
                      {block.text}
                    </p>
                  )}
                </div>
              </div>
            )
          }
          return items
        })}
      </div>

      {vocabulary.length > 0 && (
        <section className="mt-10">
          <SectionTitle
            right={
              newVocab.length > 0 && (
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => onAddCards(newVocab.map((v) => cardFromVocab(v, ctx)))}
                >
                  <PlusIcon className="h-3.5 w-3.5" /> すべて追加（{newVocab.length}）
                </Button>
              )
            }
          >
            単語
          </SectionTitle>
          <ul className="divide-y divide-[#1a1a1a] rounded-xl border border-[#1e1e1e] bg-[#111]">
            {vocabulary.map((v, i) => (
              <VocabRow
                key={i}
                item={v}
                added={cardKeys.has(cardKey('word', v.lemma || v.word))}
                hideMeaning={display.hideMeaning}
                onSpeak={say}
                onAdd={() => onAddCards([cardFromVocab(v, ctx)])}
              />
            ))}
          </ul>
        </section>
      )}

      {grammar.length > 0 && (
        <section className="mt-10">
          <SectionTitle
            right={
              newGrammar.length > 0 && (
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => onAddCards(newGrammar.map((g) => cardFromGrammar(g, ctx)))}
                >
                  <PlusIcon className="h-3.5 w-3.5" /> すべて追加（{newGrammar.length}）
                </Button>
              )
            }
          >
            文法・表現
          </SectionTitle>
          <ul className="space-y-2">
            {grammar.map((g, i) => (
              <GrammarRow
                key={i}
                item={g}
                added={cardKeys.has(cardKey('grammar', g.pattern))}
                hideMeaning={display.hideMeaning}
                onAdd={() => onAddCards([cardFromGrammar(g, ctx)])}
              />
            ))}
          </ul>
        </section>
      )}

      {!live && sentenceCount > 0 && (
        <div className="mt-10 flex flex-col gap-2 rounded-xl border border-[#1e1e1e] bg-[#111] p-5 sm:flex-row sm:items-center">
          <p className="font-noto text-sm text-text-muted sm:mr-auto">
            追加したカードはフラッシュカードで復習できます。
          </p>
          {newVocab.length + newGrammar.length > 0 && (
            <Button
              variant="secondary"
              onClick={() =>
                onAddCards([
                  ...newVocab.map((v) => cardFromVocab(v, ctx)),
                  ...newGrammar.map((g) => cardFromGrammar(g, ctx)),
                ])
              }
            >
              <PlusIcon /> 単語と文法をまとめて追加
            </Button>
          )}
          <Button variant="primary" onClick={props.onStudy}>
            復習する →
          </Button>
        </div>
      )}
    </div>
  )
}

function SentenceCard({
  number,
  sentence,
  display,
  cardKeys,
  ctx,
  onSpeak,
  onAddCards,
}: {
  number: number
  sentence: Partial<Sentence>
  display: DisplayOptions
  cardKeys: Set<string>
  ctx: CardContext
  onSpeak: (text: string) => void
  onAddCards: (cards: StudyCard[]) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealTranslation, setRevealTranslation] = useState(false)
  const chunks = (sentence.chunks ?? []).filter((c): c is Chunk => !!c && typeof c.text === 'string')
  const complete = typeof sentence.translation === 'string'
  const full: Sentence = {
    original: sentence.original ?? chunks.map((c) => c.text).join(' '),
    chunks,
    translation: sentence.translation ?? '',
  }
  const isAdded = (c: Chunk) =>
    cardKeys.has(cardKey('phrase', cardFromChunk(c, full, ctx).front))
  const notAdded = complete ? chunks.filter((c) => c.meaning && !isAdded(c)) : []
  const current = selected !== null ? chunks[selected] : null

  return (
    <article className="rounded-xl border border-[#1e1e1e] bg-[#111] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-bebas text-lg tracking-widest text-accent">
          {String(number).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-0.5">
          {notAdded.length > 0 && (
            <button
              type="button"
              onClick={() => onAddCards(notAdded.map((c) => cardFromChunk(c, full, ctx)))}
              className="mr-1 rounded-md px-2 py-1 font-noto text-[11px] text-text-muted hover:bg-[#1a1a1a] hover:text-text"
            >
              ＋ 区切りを全部追加
            </button>
          )}
          <IconButton label="文を読み上げ" onClick={() => onSpeak(full.original)} disabled={!full.original}>
            <SpeakerIcon />
          </IconButton>
        </div>
      </div>

      {chunks.length === 0 && full.original && (
        <p className="text-lg leading-relaxed text-[#6f6b66]" style={FOREIGN_FONT}>
          {full.original}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {chunks.map((c, i) => {
          const active = selected === i
          const added = complete && isAdded(c)
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(active ? null : i)}
              aria-pressed={active}
              className={`relative flex min-w-[3rem] flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-accent bg-[#14202f]'
                  : 'border-[#262626] bg-[#151515] hover:border-[#3a4a60]'
              }`}
            >
              {added && (
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#5fb38a]"
                  aria-label="追加済み"
                />
              )}
              <span className="text-lg leading-tight text-text sm:text-xl" style={FOREIGN_FONT}>
                {c.text}
              </span>
              {display.showReading && c.reading && (
                <span className="mt-0.5 font-noto text-[11px] leading-tight text-text-muted">{c.reading}</span>
              )}
              <span
                className={`mt-1 font-noto text-xs leading-snug text-[#9cc0ec] ${
                  display.hideMeaning && !active ? 'select-none blur-[5px]' : ''
                }`}
              >
                {c.meaning ?? '…'}
              </span>
            </button>
          )
        })}
      </div>

      {current && (
        <div className="mt-3 rounded-lg border border-[#22344d] bg-[#0e1621] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl text-white" style={FOREIGN_FONT}>
                {current.text}
              </p>
              {current.reading && (
                <p className="mt-0.5 font-noto text-xs text-text-muted">{current.reading}</p>
              )}
            </div>
            <IconButton label="区切りを読み上げ" onClick={() => onSpeak(current.text)}>
              <SpeakerIcon />
            </IconButton>
          </div>
          <p className="mt-2 font-noto text-base text-[#cfe0f6]">{current.meaning}</p>
          {current.note && (
            <p className="mt-2 font-noto text-sm leading-relaxed text-[#b9b4ae]">
              <span className="mr-1.5 rounded bg-[#1d2a3b] px-1.5 py-0.5 text-[10px] text-[#9cc0ec]">ポイント</span>
              {current.note}
            </p>
          )}
          {complete && current.meaning && (
            <div className="mt-3">
              <AddButton
                added={isAdded(current)}
                onAdd={() => onAddCards([cardFromChunk(current, full, ctx)])}
              />
            </div>
          )}
        </div>
      )}

      {display.showTranslation && (
        <div className="mt-3 border-t border-[#1c1c1c] pt-3">
          {complete ? (
            <button
              type="button"
              onClick={() => setRevealTranslation((v) => !v)}
              className={`text-left font-noto text-sm leading-relaxed text-[#b9b4ae] ${
                display.hideMeaning && !revealTranslation ? 'select-none blur-[5px]' : ''
              }`}
            >
              {full.translation}
            </button>
          ) : (
            <p className="font-noto text-sm text-[#5a5652]">訳を作成中…</p>
          )}
        </div>
      )}
    </article>
  )
}

function VocabRow({
  item,
  added,
  hideMeaning,
  onSpeak,
  onAdd,
}: {
  item: VocabItem
  added: boolean
  hideMeaning: boolean
  onSpeak: (text: string) => void
  onAdd: () => void
}) {
  const [reveal, setReveal] = useState(false)
  const lemma = item.lemma || item.word
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg text-text" style={FOREIGN_FONT}>
            {lemma}
          </span>
          {item.reading && <span className="font-noto text-xs text-text-muted">{item.reading}</span>}
          {item.pos && (
            <span className="rounded border border-[#2a2a2a] px-1.5 py-px font-noto text-[10px] text-text-muted">
              {item.pos}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          className={`mt-0.5 text-left font-noto text-sm text-[#9cc0ec] ${
            hideMeaning && !reveal ? 'select-none blur-[5px]' : ''
          }`}
        >
          {item.meaning}
        </button>
        {item.example && (
          <p className="mt-1.5 text-xs leading-relaxed text-[#6f6b66]" style={FOREIGN_FONT}>
            {item.example}
          </p>
        )}
      </div>
      <div className="flex items-center">
        <IconButton label={`${lemma} を読み上げ`} onClick={() => onSpeak(lemma)}>
          <SpeakerIcon />
        </IconButton>
        <AddButton compact added={added} onAdd={onAdd} />
      </div>
    </li>
  )
}

function GrammarRow({
  item,
  added,
  hideMeaning,
  onAdd,
}: {
  item: GrammarPoint
  added: boolean
  hideMeaning: boolean
  onAdd: () => void
}) {
  const [reveal, setReveal] = useState(false)
  return (
    <li className="rounded-xl border border-[#1e1e1e] bg-[#111] p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg text-text" style={FOREIGN_FONT}>
            {item.pattern}
          </p>
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className={`text-left font-noto text-sm text-[#9cc0ec] ${
              hideMeaning && !reveal ? 'select-none blur-[5px]' : ''
            }`}
          >
            {item.meaning}
          </button>
          {item.explanation && (
            <p className="mt-2 font-noto text-sm leading-relaxed text-[#b9b4ae]">{item.explanation}</p>
          )}
          {item.example && (
            <p className="mt-2 text-xs leading-relaxed text-[#6f6b66]" style={FOREIGN_FONT}>
              {item.example}
            </p>
          )}
        </div>
        <AddButton compact added={added} onAdd={onAdd} />
      </div>
    </li>
  )
}
