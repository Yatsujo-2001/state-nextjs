'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnalyzeError,
  buildAnalysis,
  makeTitle,
  mergeResults,
  runWithConcurrency,
  splitIntoSegments,
  type SegmentPhase,
} from '@/lib/kugiri/core'
import { INITIAL_DRAFT, REQUIRES_API_KEY, SEGMENT_CHARS, analyzeSegment } from '@/lib/kugiri/platform'
import { cardKey, gradeCard, isDue, newId, type Grade } from '@/lib/kugiri/cards'
import { SAMPLE_ANALYSIS } from '@/lib/kugiri/sample'
import { clearStorage, usePersistentState } from '@/lib/kugiri/storage'
import {
  DEFAULT_SETTINGS,
  type Analysis,
  type SegmentResult,
  type Settings,
  type StudyCard,
} from '@/lib/kugiri/types'
import InputPanel from './InputPanel'
import ListView from './ListView'
import ResultView, { type ResultBlock } from './ResultView'
import SettingsDialog from './SettingsDialog'
import StudyView from './StudyView'
import { GearIcon, IconButton } from './ui'

type Tab = 'analyze' | 'list' | 'study'

const HISTORY_LIMIT = 30

interface SegmentState {
  text: string
  status: 'pending' | 'running' | 'done' | 'error'
  phase: SegmentPhase
  partial?: Partial<SegmentResult>
  result?: SegmentResult
  error?: string
  truncated?: boolean
}

interface Job {
  id: string
  title: string
  sourceText: string
  segments: SegmentState[]
}

/** ストリーミング途中の結果から、書き終わった単語・文法だけを取り出す */
function completedPartial(partial?: Partial<SegmentResult>): Partial<SegmentResult> {
  if (!partial) return {}
  return {
    ...partial,
    sentences: [],
    vocabulary: (partial.vocabulary ?? []).filter((v) => typeof v?.exampleTranslation === 'string'),
    grammar: (partial.grammar ?? []).filter((g) => typeof g?.exampleTranslation === 'string'),
  }
}

export default function KugiriApp() {
  const [storedSettings, setSettings] = usePersistentState<Settings>('settings', DEFAULT_SETTINGS)
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...storedSettings }), [storedSettings])
  const [cards, setCards] = usePersistentState<StudyCard[]>('cards', [])
  const [history, setHistory] = usePersistentState<Analysis[]>('history', [])
  const [draft, setDraft] = usePersistentState<string>('draft', INITIAL_DRAFT)

  const [tab, setTab] = useState<Tab>('analyze')
  const [openId, setOpenId] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const controllers = useRef(new Set<AbortController>())
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const cardKeys = useMemo(() => new Set(cards.map((c) => cardKey(c.kind, c.front))), [cards])
  const dueCount = cards.filter((c) => isDue(c)).length

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const goto = (next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  // ---- 暗記リスト ----

  const addCards = useCallback(
    (incoming: StudyCard[]) => {
      const seen = new Set(cardKeys)
      const fresh = incoming.filter((c) => {
        const k = cardKey(c.kind, c.front)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      if (fresh.length === 0) {
        setToast('すでに暗記リストにあります')
        return
      }
      setCards((prev) => [...prev, ...fresh])
      setToast(fresh.length === 1 ? `「${fresh[0].front}」を追加しました` : `${fresh.length}枚を暗記リストに追加しました`)
    },
    [cardKeys, setCards],
  )

  const onGrade = useCallback(
    (id: string, grade: Grade) => setCards((prev) => prev.map((c) => (c.id === id ? gradeCard(c, grade) : c))),
    [setCards],
  )

  // ---- 解析ジョブ ----

  const updateSegment = useCallback((jobId: string, index: number, patch: Partial<SegmentState>) => {
    setJob((j) =>
      j && j.id === jobId
        ? { ...j, segments: j.segments.map((s, k) => (k === index ? { ...s, ...patch } : s)) }
        : j,
    )
  }, [])

  const runSegments = useCallback(
    async (target: Job, indices: number[]) => {
      const controller = new AbortController()
      controllers.current.add(controller)
      const { apiKey, model } = settingsRef.current
      let fatal: string | null = null

      for (const i of indices) updateSegment(target.id, i, { status: 'pending', error: undefined })

      await runWithConcurrency(indices.length, async (n) => {
        const i = indices[n]
        if (fatal || controller.signal.aborted) {
          updateSegment(target.id, i, { status: 'error', error: fatal ?? '中止しました。' })
          return
        }
        updateSegment(target.id, i, { status: 'running', phase: 'thinking', partial: undefined })
        try {
          const { result, truncated } = await analyzeSegment({
            apiKey,
            model,
            text: target.segments[i].text,
            index: i,
            total: target.segments.length,
            signal: controller.signal,
            onProgress: (p) => updateSegment(target.id, i, { phase: p.phase, partial: p.partial }),
          })
          updateSegment(target.id, i, { status: 'done', result, truncated, partial: undefined })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          if (err instanceof AnalyzeError && err.stopsAll) fatal = message
          updateSegment(target.id, i, { status: 'error', error: message, partial: undefined })
        }
      })
      controllers.current.delete(controller)
    },
    [updateSegment],
  )

  const saveJob = useCallback(
    (j: Job, onlyDone: boolean) => {
      const segments = onlyDone ? j.segments.filter((s) => s.status === 'done') : j.segments
      if (segments.length === 0) return
      const analysis = buildAnalysis(
        j.id,
        segments.map((s) => s.text).join('\n'),
        segments.map((s) => s.result ?? {}),
      )
      setHistory((h) => [analysis, ...h.filter((a) => a.id !== j.id)].slice(0, HISTORY_LIMIT))
      setJob(null)
      if (segments.some((s) => s.truncated)) setToast('一部の区間は出力が長すぎて途中までになりました')
    },
    [setHistory],
  )

  // すべての区間が終わったら履歴に保存
  useEffect(() => {
    if (job && job.segments.every((s) => s.status === 'done')) saveJob(job, false)
  }, [job, saveJob])

  const startAnalysis = () => {
    const text = draft.trim()
    if (!text) return
    if (REQUIRES_API_KEY && !settings.apiKey) {
      setSettingsNotice('自分のテキストを解析するには、Anthropic の APIキーを登録してください。')
      setSettingsOpen(true)
      return
    }
    const segments: SegmentState[] = splitIntoSegments(text, SEGMENT_CHARS).map((t) => ({
      text: t,
      status: 'pending',
      phase: 'thinking',
    }))
    const next: Job = { id: newId(), title: makeTitle(text), sourceText: text, segments }
    setJob(next)
    setOpenId(next.id)
    goto('analyze')
    void runSegments(
      next,
      segments.map((_, i) => i),
    )
  }

  const cancelJob = () => {
    controllers.current.forEach((c) => c.abort())
  }

  // ---- 表示 ----

  const jobRunning = !!job && job.segments.some((s) => s.status === 'running' || s.status === 'pending')

  let resultView: React.ReactNode = null
  if (tab === 'analyze' && openId) {
    if (job && job.id === openId) {
      const blocks: ResultBlock[] = job.segments.map((s, i) => {
        if (s.status === 'done' && s.result) return { kind: 'sentences', sentences: s.result.sentences }
        if (s.status === 'running')
          return {
            kind: 'running',
            sentences: (s.partial?.sentences ?? []).filter(Boolean),
            phase: s.phase,
            text: s.text,
          }
        if (s.status === 'error')
          return { kind: 'error', text: s.text, message: s.error ?? 'エラー', segmentIndex: i }
        return { kind: 'pending', text: s.text }
      })
      const merged = mergeResults(job.segments.map((s) => s.result ?? completedPartial(s.partial)))
      const errorIndices = job.segments.flatMap((s, i) => (s.status === 'error' ? [i] : []))
      const doneCount = job.segments.filter((s) => s.status === 'done').length
      resultView = (
        <ResultView
          title={job.title}
          language={merged.language}
          languageCode={merged.languageCode}
          blocks={blocks}
          vocabulary={merged.vocabulary}
          grammar={merged.grammar}
          live={jobRunning ? { done: doneCount, total: job.segments.length } : undefined}
          hasErrors={errorIndices.length > 0}
          cardKeys={cardKeys}
          speechRate={settings.speechRate}
          onAddCards={addCards}
          onBack={() => setOpenId(null)}
          onStudy={() => goto('study')}
          onRetry={(i) => void runSegments(job, [i])}
          onRetryAll={() => void runSegments(job, errorIndices)}
          onCancel={cancelJob}
          onSavePartial={doneCount > 0 ? () => saveJob(job, true) : undefined}
        />
      )
    } else {
      const analysis =
        openId === SAMPLE_ANALYSIS.id ? SAMPLE_ANALYSIS : history.find((a) => a.id === openId)
      if (analysis) {
        resultView = (
          <ResultView
            title={analysis.title}
            language={analysis.language}
            languageCode={analysis.languageCode}
            blocks={[{ kind: 'sentences', sentences: analysis.sentences }]}
            vocabulary={analysis.vocabulary}
            grammar={analysis.grammar}
            isSample={analysis.isSample}
            cardKeys={cardKeys}
            speechRate={settings.speechRate}
            onAddCards={addCards}
            onBack={() => setOpenId(null)}
            onStudy={() => goto('study')}
          />
        )
      }
    }
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'analyze', label: '解析' },
    { id: 'list', label: 'リスト', badge: cards.length || undefined },
    { id: 'study', label: '復習', badge: dueCount || undefined },
  ]

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#1a1a1a] bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-4">
          <button
            type="button"
            onClick={() => {
              setOpenId(null)
              goto('analyze')
            }}
            className="mr-auto flex items-baseline gap-2"
          >
            <span className="font-bebas text-2xl tracking-[0.2em] text-accent">KUGIRI</span>
            <span className="hidden font-noto text-[11px] text-text-muted sm:inline">区切って覚える語学ノート</span>
          </button>
          <nav className="flex items-center gap-0.5" aria-label="メニュー">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => goto(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`relative rounded-lg px-2.5 py-1.5 font-noto text-sm transition-colors sm:px-3 ${
                  tab === t.id ? 'bg-[#16243a] text-[#cfe0f6]' : 'text-text-muted hover:text-text'
                }`}
              >
                {t.label}
                {t.badge !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-px font-barlow text-[10px] ${
                      t.id === 'study' ? 'bg-accent text-white' : 'bg-[#222] text-text-muted'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <IconButton
            label="設定"
            onClick={() => {
              setSettingsNotice(null)
              setSettingsOpen(true)
            }}
          >
            <GearIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-10 pt-20">
        {tab === 'analyze' &&
          (resultView ?? (
            <InputPanel
              text={draft}
              onTextChange={setDraft}
              onAnalyze={startAnalysis}
              onSample={() => {
                setOpenId(SAMPLE_ANALYSIS.id)
                window.scrollTo({ top: 0 })
              }}
              hasKey={!REQUIRES_API_KEY || !!settings.apiKey}
              onOpenSettings={() => {
                setSettingsNotice(null)
                setSettingsOpen(true)
              }}
              jobRunning={jobRunning}
              onOpenJob={() => job && setOpenId(job.id)}
              history={history}
              onOpenHistory={(id) => {
                setOpenId(id)
                window.scrollTo({ top: 0 })
              }}
              onDeleteHistory={(id) => setHistory((h) => h.filter((a) => a.id !== id))}
            />
          ))}
        {tab === 'list' && (
          <ListView
            cards={cards}
            onDelete={(id) => setCards((prev) => prev.filter((c) => c.id !== id))}
            onStudy={() => goto('study')}
            onGoAnalyze={() => {
              setOpenId(null)
              goto('analyze')
            }}
            speechRate={settings.speechRate}
          />
        )}
        {tab === 'study' && (
          <StudyView cards={cards} onGrade={onGrade} onGoList={() => goto('list')} speechRate={settings.speechRate} />
        )}
      </main>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit max-w-[90vw] rounded-full border border-[#2a3a50] bg-[#0f1824] px-4 py-2 font-noto text-sm text-[#cfe0f6] shadow-lg"
        >
          {toast}
        </div>
      )}

      <SettingsDialog
        open={settingsOpen}
        showApiSettings={REQUIRES_API_KEY}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        notice={settingsNotice}
        cardCount={cards.length}
        historyCount={history.length}
        onClearHistory={() => setHistory([])}
        onClearAll={() => {
          clearStorage(['settings', 'cards', 'history', 'draft'])
          setSettings(DEFAULT_SETTINGS)
          setCards([])
          setHistory([])
          setDraft('')
          setOpenId(null)
          setSettingsOpen(false)
          setToast('すべてのデータを削除しました')
        }}
      />
    </div>
  )
}
