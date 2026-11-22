'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { KIND_LABEL, isDue, nextIntervalLabel, shuffle, type Grade } from '@/lib/kugiri/cards'
import { speak } from '@/lib/kugiri/speech'
import type { CardKind, StudyCard } from '@/lib/kugiri/types'
import { Button, FOREIGN_FONT, IconButton, SpeakerIcon } from './ui'

type Scope = 'due' | 'all' | 'weak'
type Direction = 'forward' | 'reverse'

const SESSION_LIMIT = 50

interface Session {
  queue: string[]
  pos: number
  flipped: boolean
  stats: Record<Grade, number>
}

const GRADES: { grade: Grade; label: string; className: string; key: string }[] = [
  { grade: 'again', label: 'まだ', key: '1', className: 'border-[#4a2723] text-[#e08a80] hover:bg-[#2a1715]' },
  { grade: 'hard', label: 'あやしい', key: '2', className: 'border-[#4a3a1c] text-[#d1a24a] hover:bg-[#261e0f]' },
  { grade: 'good', label: '覚えた', key: '3', className: 'border-[#1f4434] text-[#5fb38a] hover:bg-[#0f2219]' },
]

function isWeak(c: StudyCard): boolean {
  return c.reviews > 0 && (c.lapses > 0 || c.box <= 1)
}

export default function StudyView({
  cards,
  onGrade,
  onGoList,
  speechRate,
}: {
  cards: StudyCard[]
  onGrade: (id: string, grade: Grade) => void
  onGoList: () => void
  speechRate: number
}) {
  const now = Date.now()
  const dueCount = cards.filter((c) => isDue(c, now)).length
  const [scope, setScope] = useState<Scope>(dueCount > 0 ? 'due' : 'all')
  const [direction, setDirection] = useState<Direction>('forward')
  const [kind, setKind] = useState<'all' | CardKind>('all')
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  const pool = useMemo(() => {
    const t = Date.now()
    const byKind = cards.filter((c) => kind === 'all' || c.kind === kind)
    if (scope === 'due') return byKind.filter((c) => isDue(c, t)).sort((a, b) => a.due - b.due)
    if (scope === 'weak') return shuffle(byKind.filter(isWeak))
    return shuffle(byKind)
  }, [cards, scope, kind])

  const counts = useMemo(
    () => ({
      due: cards.filter((c) => isDue(c, now)).length,
      all: cards.length,
      weak: cards.filter(isWeak).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards],
  )

  const start = () => {
    const queue = pool.slice(0, SESSION_LIMIT).map((c) => c.id)
    if (queue.length === 0) return
    setSession({ queue, pos: 0, flipped: false, stats: { again: 0, hard: 0, good: 0 } })
  }

  const currentId = session && session.pos < session.queue.length ? session.queue[session.pos] : null
  const current = currentId ? cards.find((c) => c.id === currentId) ?? null : null

  // 途中で削除されたカードは飛ばす
  useEffect(() => {
    if (session && currentId && !current) {
      setSession((s) => (s ? { ...s, pos: s.pos + 1, flipped: false } : s))
    }
  }, [session, currentId, current])

  // 表面が出たら自動で読み上げ（外国語→日本語のときのみ）
  useEffect(() => {
    if (autoSpeak && current && direction === 'forward' && session && !session.flipped) {
      speak(current.front, current.languageCode, speechRate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, session?.pos])

  const flip = useCallback(() => {
    setSession((s) => (s && !s.flipped ? { ...s, flipped: true } : s))
    if (autoSpeak && current && direction === 'reverse') {
      speak(current.front, current.languageCode, speechRate)
    }
  }, [autoSpeak, current, direction, speechRate])

  const grade = useCallback(
    (g: Grade) => {
      if (!current || !session?.flipped) return
      onGrade(current.id, g)
      setSession((s) => {
        if (!s) return s
        const queue = g === 'again' ? [...s.queue, current.id] : s.queue
        return { queue, pos: s.pos + 1, flipped: false, stats: { ...s.stats, [g]: s.stats[g] + 1 } }
      })
    },
    [current, session?.flipped, onGrade],
  )

  useEffect(() => {
    if (!session) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if ((e.key === ' ' || e.key === 'Enter') && !session.flipped) {
        e.preventDefault()
        flip()
      } else if (session.flipped) {
        const hit = GRADES.find((g) => g.key === e.key)
        if (hit) {
          e.preventDefault()
          grade(hit.grade)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session, flip, grade])

  if (cards.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-noto text-lg font-bold text-text">カードがありません</p>
        <p className="mt-3 font-noto text-sm text-text-muted">まずはテキストを解析して、暗記リストに追加しましょう。</p>
        <Button variant="secondary" onClick={onGoList} className="mt-6">
          暗記リストへ
        </Button>
      </div>
    )
  }

  // 終了画面
  if (session && session.pos >= session.queue.length) {
    const total = session.stats.again + session.stats.hard + session.stats.good
    return (
      <div className="py-12 text-center">
        <p className="font-bebas text-5xl tracking-widest text-accent">DONE</p>
        <p className="mt-2 font-noto text-lg font-bold text-text">おつかれさまでした</p>
        <p className="mt-1 font-noto text-sm text-text-muted">{total}回 回答しました</p>
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-3 gap-2">
          {GRADES.map((g) => (
            <div key={g.grade} className={`rounded-xl border bg-[#111] px-3 py-3 ${g.className}`}>
              <p className="font-bebas text-3xl leading-none">{session.stats[g.grade]}</p>
              <p className="mt-1 font-noto text-xs">{g.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => setSession(null)}>
            もう一度
          </Button>
          <Button variant="primary" onClick={onGoList}>
            暗記リストへ
          </Button>
        </div>
      </div>
    )
  }

  // セッション中
  if (session && current) {
    const front = direction === 'forward' ? current.front : current.back
    const progress = session.pos / session.queue.length
    return (
      <div className="pb-28 sm:pb-16">
        <div className="mb-4 flex items-center justify-between font-noto text-xs text-text-muted">
          <span>
            {session.pos + 1} / {session.queue.length}
          </span>
          <button type="button" onClick={() => setSession({ ...session, pos: session.queue.length })} className="hover:text-text">
            終了する
          </button>
        </div>
        <div className="mb-6 h-1 overflow-hidden rounded-full bg-[#1e1e1e]">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={flip}
          aria-label={session.flipped ? 'カード' : 'タップして答えを見る'}
          className={`flex min-h-[320px] cursor-pointer flex-col rounded-2xl border bg-[#111] p-6 transition-colors sm:p-8 ${
            session.flipped ? 'border-[#2a3a50]' : 'border-[#232323] hover:border-[#3a4a60]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded border border-[#2a2a2a] px-1.5 py-px font-noto text-[10px] text-text-muted">
              {KIND_LABEL[current.kind]}
            </span>
            <IconButton
              label="読み上げ"
              onClick={(e) => {
                e.stopPropagation()
                speak(current.front, current.languageCode, speechRate)
              }}
            >
              <SpeakerIcon />
            </IconButton>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
            <p
              className={`leading-snug text-white ${direction === 'forward' ? 'text-3xl sm:text-4xl' : 'font-noto text-2xl sm:text-3xl'}`}
              style={direction === 'forward' ? FOREIGN_FONT : undefined}
            >
              {front}
            </p>

            {session.flipped ? (
              <div className="mt-6 w-full border-t border-[#1e1e1e] pt-6">
                {direction === 'forward' ? (
                  <>
                    {current.reading && <p className="font-noto text-sm text-text-muted">{current.reading}</p>}
                    <p className="mt-1 font-noto text-xl text-[#cfe0f6]">{current.back}</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl text-white" style={FOREIGN_FONT}>
                      {current.front}
                    </p>
                    {current.reading && <p className="mt-1 font-noto text-sm text-text-muted">{current.reading}</p>}
                  </>
                )}
                {current.note && (
                  <p className="mx-auto mt-4 max-w-md font-noto text-sm leading-relaxed text-[#b9b4ae]">{current.note}</p>
                )}
                {current.example && (
                  <div className="mx-auto mt-4 max-w-md rounded-lg bg-[#0d0d0d] px-4 py-3 text-left">
                    <p className="text-sm leading-relaxed text-text" style={FOREIGN_FONT}>
                      {current.example}
                    </p>
                    {current.exampleTranslation && (
                      <p className="mt-1 font-noto text-xs leading-relaxed text-text-muted">{current.exampleTranslation}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-8 font-noto text-xs text-[#55524e]">タップして答えを見る</p>
            )}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#1a1a1a] bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mt-4 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          {session.flipped ? (
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => grade(g.grade)}
                  className={`rounded-xl border bg-[#111] px-2 py-3 font-noto transition-colors ${g.className}`}
                >
                  <span className="block text-sm font-bold">{g.label}</span>
                  <span className="mt-0.5 block text-[10px] opacity-80">{nextIntervalLabel(current, g.grade)}</span>
                </button>
              ))}
            </div>
          ) : (
            <Button variant="primary" onClick={flip} className="w-full py-3 text-base">
              答えを見る
            </Button>
          )}
        </div>
        <p className="mt-3 hidden text-center font-noto text-[11px] text-[#55524e] sm:block">
          キーボード：スペースで答え、1・2・3 で回答
        </p>
      </div>
    )
  }

  // セットアップ画面
  const scopes: { id: Scope; label: string; count: number }[] = [
    { id: 'due', label: '今日の復習', count: counts.due },
    { id: 'all', label: 'すべて', count: counts.all },
    { id: 'weak', label: '苦手だけ', count: counts.weak },
  ]
  const available = Math.min(pool.length, SESSION_LIMIT)

  return (
    <div className="pb-16">
      <h1 className="font-noto text-xl font-bold text-text">フラッシュカード</h1>
      <p className="mt-2 font-noto text-sm text-text-muted">
        「覚えた」を押したカードは、1日後・2日後・4日後…と間隔をあけて出題されます。
      </p>

      <Field label="出題">
        <div className="grid grid-cols-3 gap-2">
          {scopes.map((s) => (
            <Choice key={s.id} active={scope === s.id} onClick={() => setScope(s.id)}>
              <span className="block text-sm">{s.label}</span>
              <span className="block font-bebas text-2xl leading-none">{s.count}</span>
            </Choice>
          ))}
        </div>
      </Field>

      <Field label="向き">
        <div className="grid grid-cols-2 gap-2">
          <Choice active={direction === 'forward'} onClick={() => setDirection('forward')}>
            外国語 → 日本語
          </Choice>
          <Choice active={direction === 'reverse'} onClick={() => setDirection('reverse')}>
            日本語 → 外国語
          </Choice>
        </div>
      </Field>

      <Field label="種類">
        <div className="grid grid-cols-4 gap-2">
          {(['all', 'word', 'phrase', 'grammar'] as const).map((k) => (
            <Choice key={k} active={kind === k} onClick={() => setKind(k)}>
              {k === 'all' ? 'すべて' : KIND_LABEL[k]}
            </Choice>
          ))}
        </div>
      </Field>

      <label className="mt-6 flex cursor-pointer items-center gap-2 font-noto text-sm text-text-muted">
        <input
          type="checkbox"
          checked={autoSpeak}
          onChange={(e) => setAutoSpeak(e.target.checked)}
          className="h-4 w-4 accent-[#4a7fc1]"
        />
        自動で読み上げる
      </label>

      <Button variant="primary" onClick={start} disabled={available === 0} className="mt-8 w-full py-3 text-base">
        {available > 0 ? `スタート（${available}枚）` : 'この条件のカードはありません'}
      </Button>
      {scope === 'due' && counts.due === 0 && (
        <p className="mt-3 text-center font-noto text-xs text-text-muted">
          今日の復習はすべて終わっています。「すべて」で練習もできます。
        </p>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-2 font-noto text-xs font-bold text-text-muted">{label}</p>
      {children}
    </div>
  )
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-2 py-3 text-center font-noto text-sm transition-colors ${
        active ? 'border-accent bg-[#14202f] text-[#cfe0f6]' : 'border-[#232323] bg-[#111] text-text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}
