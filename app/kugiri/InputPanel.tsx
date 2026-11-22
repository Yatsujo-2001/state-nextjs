'use client'

import { splitIntoSegments } from '@/lib/kugiri/analyze'
import type { Analysis } from '@/lib/kugiri/types'
import { Button, CloseIcon, FOREIGN_FONT, IconButton } from './ui'

const PLACEHOLDER = `例）저는 요즘 한국어를 공부하고 있어요. 한국 드라마를 보는데 자막 없이 이해하고 싶거든요.

韓国語・英語・中国語など、覚えたい言語の文章をそのまま貼り付けてください。長文でもOKです。`

function formatDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function InputPanel({
  text,
  onTextChange,
  onAnalyze,
  onSample,
  hasKey,
  onOpenSettings,
  jobRunning,
  onOpenJob,
  history,
  onOpenHistory,
  onDeleteHistory,
}: {
  text: string
  onTextChange: (text: string) => void
  onAnalyze: () => void
  onSample: () => void
  hasKey: boolean
  onOpenSettings: () => void
  jobRunning: boolean
  onOpenJob: () => void
  history: Analysis[]
  onOpenHistory: (id: string) => void
  onDeleteHistory: (id: string) => void
}) {
  const trimmed = text.trim()
  const segments = trimmed ? splitIntoSegments(trimmed).length : 0

  return (
    <div>
      <section className="pb-6 pt-2">
        <h1 className="font-noto text-2xl font-bold leading-snug text-text sm:text-3xl">
          貼り付けるだけで、
          <br className="sm:hidden" />
          区切って覚える。
        </h1>
        <p className="mt-3 font-noto text-sm leading-relaxed text-text-muted">
          外国語の文章を、意味のかたまりごとに区切って読み方・意味・文法を解説します。気になった区切りや単語は、そのまま暗記リストへ。
        </p>
      </section>

      {jobRunning && (
        <button
          type="button"
          onClick={onOpenJob}
          className="mb-4 flex w-full items-center gap-2 rounded-lg border border-[#22344d] bg-[#0e1621] px-4 py-3 text-left font-noto text-sm text-[#cfe0f6]"
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
          解析中のテキストがあります
          <span className="ml-auto text-xs text-[#9cc0ec]">表示する →</span>
        </button>
      )}

      <div className="rounded-xl border border-[#232323] bg-[#111] focus-within:border-accent">
        <label htmlFor="kugiri-input" className="sr-only">
          解析するテキスト
        </label>
        <textarea
          id="kugiri-input"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={9}
          className="block w-full resize-y rounded-xl bg-transparent px-4 py-4 text-base leading-relaxed text-text placeholder:font-noto placeholder:text-sm placeholder:text-[#55524e] focus:outline-none"
          style={FOREIGN_FONT}
        />
        <div className="flex items-center justify-between border-t border-[#1c1c1c] px-4 py-2 font-noto text-xs text-text-muted">
          <span>
            {text.length.toLocaleString()} 文字
            {segments > 1 && ` ・ ${segments}区間に分けて解析`}
          </span>
          {text && (
            <button type="button" onClick={() => onTextChange('')} className="hover:text-text">
              クリア
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="primary"
          onClick={onAnalyze}
          disabled={!trimmed || jobRunning}
          className="py-3 text-base sm:flex-1"
        >
          {jobRunning ? '解析中…' : '区切って解析する'}
        </Button>
        <Button variant="secondary" onClick={onSample} className="py-3">
          サンプルを見る
        </Button>
      </div>

      {!hasKey && (
        <p className="mt-3 font-noto text-xs leading-relaxed text-text-muted">
          解析には Anthropic の APIキーが必要です。
          <button type="button" onClick={onOpenSettings} className="ml-1 text-accent underline underline-offset-2">
            設定する
          </button>
        </p>
      )}

      {history.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-noto text-sm font-bold text-text">最近の解析</h2>
          <ul className="divide-y divide-[#1a1a1a] rounded-xl border border-[#1e1e1e] bg-[#111]">
            {history.map((a) => (
              <li key={a.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onOpenHistory(a.id)}
                  className="min-w-0 flex-1 px-4 py-3 text-left hover:bg-[#151515]"
                >
                  <p className="truncate text-sm text-text" style={FOREIGN_FONT}>
                    {a.title}
                  </p>
                  <p className="mt-0.5 font-noto text-[11px] text-text-muted">
                    {[a.language, `${a.sentences.length}文`, `単語${a.vocabulary.length}`, formatDate(a.createdAt)]
                      .filter(Boolean)
                      .join(' ・ ')}
                  </p>
                </button>
                <IconButton label="履歴から削除" onClick={() => onDeleteHistory(a.id)} className="mr-2">
                  <CloseIcon />
                </IconButton>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
