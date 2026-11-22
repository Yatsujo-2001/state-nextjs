'use client'

import { useMemo, useState } from 'react'
import { KIND_LABEL, MAX_BOX, cardsToCsv, isDue, statusOf } from '@/lib/kugiri/cards'
import { speak } from '@/lib/kugiri/speech'
import type { CardKind, StudyCard } from '@/lib/kugiri/types'
import { Button, DownloadIcon, FOREIGN_FONT, IconButton, SpeakerIcon, TrashIcon } from './ui'

type Filter = 'all' | CardKind

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'word', label: '単語' },
  { id: 'phrase', label: 'フレーズ' },
  { id: 'grammar', label: '文法' },
]

const STATUS_LABEL = { new: '新規', learning: '学習中', mastered: '覚えた' } as const
const STATUS_CLASS = {
  new: 'text-text-muted border-[#2a2a2a]',
  learning: 'text-[#d1a24a] border-[#4a3a1c]',
  mastered: 'text-[#5fb38a] border-[#1f4434]',
} as const

export default function ListView({
  cards,
  onDelete,
  onStudy,
  onGoAnalyze,
  speechRate,
}: {
  cards: StudyCard[]
  onDelete: (id: string) => void
  onStudy: () => void
  onGoAnalyze: () => void
  speechRate: number
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const now = Date.now()
  const dueCount = cards.filter((c) => isDue(c, now)).length
  const masteredCount = cards.filter((c) => statusOf(c) === 'mastered').length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...cards]
      .filter((c) => filter === 'all' || c.kind === filter)
      .filter(
        (c) =>
          !q ||
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q) ||
          c.reading.toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [cards, filter, query])

  const exportCsv = () => {
    const blob = new Blob(['﻿' + cardsToCsv(cards)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kugiri-cards.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (cards.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-noto text-lg font-bold text-text">暗記リストはまだ空です</p>
        <p className="mx-auto mt-3 max-w-sm font-noto text-sm leading-relaxed text-text-muted">
          テキストを解析して、気になった区切り・単語・文法の「＋」を押すとここに追加されます。
        </p>
        <Button variant="primary" onClick={onGoAnalyze} className="mt-6">
          テキストを解析する
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-16">
      <div className="mb-6 grid grid-cols-3 gap-2">
        <Stat label="カード" value={cards.length} />
        <Stat label="今日の復習" value={dueCount} highlight={dueCount > 0} />
        <Stat label="覚えた" value={masteredCount} />
      </div>

      <Button variant="primary" onClick={onStudy} className="mb-8 w-full py-3 text-base">
        {dueCount > 0 ? `今日の復習を始める（${dueCount}枚）` : 'フラッシュカードで練習する'}
      </Button>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1 font-noto text-xs transition-colors ${
              filter === f.id
                ? 'border-accent bg-[#16243a] text-[#cfe0f6]'
                : 'border-[#2a2a2a] text-text-muted hover:text-text'
            }`}
          >
            {f.label}
          </button>
        ))}
        <Button variant="ghost" onClick={exportCsv} className="ml-auto px-2 py-1 text-xs">
          <DownloadIcon className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="検索（外国語・意味・読み）"
        aria-label="暗記リストを検索"
        className="mb-4 w-full rounded-lg border border-[#232323] bg-[#111] px-4 py-2.5 font-noto text-sm text-text placeholder:text-[#55524e] focus:border-accent focus:outline-none"
      />

      {visible.length === 0 ? (
        <p className="py-8 text-center font-noto text-sm text-text-muted">該当するカードがありません</p>
      ) : (
        <ul className="divide-y divide-[#1a1a1a] rounded-xl border border-[#1e1e1e] bg-[#111]">
          {visible.map((c) => {
            const status = statusOf(c)
            return (
              <li key={c.id} className="flex items-start gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-lg text-text" style={FOREIGN_FONT}>
                      {c.front}
                    </span>
                    {c.reading && <span className="font-noto text-xs text-text-muted">{c.reading}</span>}
                  </div>
                  <p className="mt-0.5 font-noto text-sm text-[#9cc0ec]">{c.back}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-noto text-[10px]">
                    <span className="rounded border border-[#2a2a2a] px-1.5 py-px text-text-muted">
                      {KIND_LABEL[c.kind]}
                    </span>
                    <span className={`rounded border px-1.5 py-px ${STATUS_CLASS[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                    <BoxMeter box={c.box} />
                  </div>
                </div>
                <IconButton label={`${c.front} を読み上げ`} onClick={() => speak(c.front, c.languageCode, speechRate)}>
                  <SpeakerIcon />
                </IconButton>
                <IconButton
                  label={`${c.front} を削除`}
                  onClick={() => onDelete(c.id)}
                  className="hover:text-[#e08a80]"
                >
                  <TrashIcon />
                </IconButton>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1e1e1e] bg-[#111] px-3 py-3 text-center">
      <p className={`font-bebas text-3xl leading-none ${highlight ? 'text-accent' : 'text-text'}`}>{value}</p>
      <p className="mt-1 font-noto text-[11px] text-text-muted">{label}</p>
    </div>
  )
}

function BoxMeter({ box }: { box: number }) {
  return (
    <span className="ml-1 inline-flex gap-0.5" aria-label={`定着度 ${box} / ${MAX_BOX}`}>
      {Array.from({ length: MAX_BOX }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < box ? 'bg-[#5fb38a]' : 'bg-[#2a2a2a]'}`} />
      ))}
    </span>
  )
}
