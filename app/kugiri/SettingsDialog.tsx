'use client'

import { useEffect, useState } from 'react'
import { MODEL_OPTIONS, type Settings } from '@/lib/kugiri/types'
import { Button, CloseIcon, IconButton } from './ui'

const RATES = [
  { value: 0.7, label: 'ゆっくり' },
  { value: 0.9, label: 'ふつう' },
  { value: 1.1, label: 'はやい' },
]

export default function SettingsDialog({
  open,
  showApiSettings,
  settings,
  onChange,
  onClose,
  cardCount,
  historyCount,
  onClearHistory,
  onClearAll,
  notice,
}: {
  open: boolean
  showApiSettings: boolean
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
  cardCount: number
  historyCount: number
  onClearHistory: () => void
  onClearAll: () => void
  notice?: string | null
}) {
  const [keyDraft, setKeyDraft] = useState(settings.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [confirming, setConfirming] = useState<'history' | 'all' | null>(null)

  useEffect(() => {
    if (open) setKeyDraft(settings.apiKey)
  }, [open, settings.apiKey])

  useEffect(() => {
    if (!open) setConfirming(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const saveKey = () => onChange({ ...settings, apiKey: keyDraft.trim() })
  const keyChanged = keyDraft.trim() !== settings.apiKey

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kugiri-settings-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#232323] bg-[#0f0f0f] p-5 sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="kugiri-settings-title" className="font-noto text-lg font-bold text-text">
            設定
          </h2>
          <IconButton label="閉じる" onClick={onClose}>
            <CloseIcon className="h-5 w-5" />
          </IconButton>
        </div>

        {notice && (
          <p className="mb-5 rounded-lg border border-[#2a3a50] bg-[#0f1824] px-4 py-3 font-noto text-xs leading-relaxed text-[#cfe0f6]">
            {notice}
          </p>
        )}

        {showApiSettings && (
          <>
            <section>
              <label htmlFor="kugiri-api-key" className="mb-2 block font-noto text-sm font-bold text-text">
                Anthropic APIキー
              </label>
              <div className="flex gap-2">
                <input
                  id="kugiri-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                  placeholder="sk-ant-..."
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2.5 font-mono text-sm text-text placeholder:text-[#55524e] focus:border-accent focus:outline-none"
                />
                <Button variant="ghost" onClick={() => setShowKey((v) => !v)} className="px-3">
                  {showKey ? '隠す' : '表示'}
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button variant="primary" onClick={saveKey} disabled={!keyChanged} className="px-3 py-1.5 text-xs">
                  保存
                </Button>
                {settings.apiKey && !keyChanged && (
                  <span className="font-noto text-xs text-[#5fb38a]">保存済み</span>
                )}
              </div>
              <p className="mt-3 font-noto text-xs leading-relaxed text-text-muted">
                キーはこのブラウザの中だけに保存され、解析するときに Anthropic の API へ直接送られます。ほかのサーバーには送信されません。共有のパソコンでは使い終わったら削除してください。キーは{' '}
                <a
                  href="https://platform.claude.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  Claude Console
                </a>{' '}
                で発行できます（API の利用料金がかかります）。
              </p>
            </section>

            <section className="mt-7">
              <p className="mb-2 font-noto text-sm font-bold text-text">解析に使うモデル</p>
              <div className="space-y-2">
                {MODEL_OPTIONS.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      settings.model === m.id ? 'border-accent bg-[#14202f]' : 'border-[#232323] hover:border-[#333]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kugiri-model"
                      checked={settings.model === m.id}
                      onChange={() => onChange({ ...settings, model: m.id })}
                      className="accent-[#4a7fc1]"
                    />
                    <span className="font-noto text-sm text-text">{m.label}</span>
                    <span className="ml-auto font-noto text-xs text-text-muted">{m.hint}</span>
                  </label>
                ))}
              </div>
            </section>
          </>
        )}

        <section className={showApiSettings ? 'mt-7' : ''}>
          <p className="mb-2 font-noto text-sm font-bold text-text">読み上げの速さ</p>
          <div className="grid grid-cols-3 gap-2">
            {RATES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onChange({ ...settings, speechRate: r.value })}
                aria-pressed={settings.speechRate === r.value}
                className={`rounded-lg border py-2 font-noto text-sm transition-colors ${
                  settings.speechRate === r.value
                    ? 'border-accent bg-[#14202f] text-[#cfe0f6]'
                    : 'border-[#232323] text-text-muted hover:text-text'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7 border-t border-[#1e1e1e] pt-5">
          <p className="mb-1 font-noto text-sm font-bold text-text">データ</p>
          <p className="mb-3 font-noto text-xs text-text-muted">
            暗記リスト {cardCount}枚 ・ 解析履歴 {historyCount}件（このブラウザに保存）
          </p>
          {confirming ? (
            <div className="rounded-lg border border-[#4a2723] bg-[#140c0b] p-3">
              <p className="font-noto text-xs leading-relaxed text-[#e08a80]">
                {confirming === 'history'
                  ? '解析履歴をすべて削除します。元に戻せません。'
                  : `暗記リスト・解析履歴${showApiSettings ? '・APIキー' : ''}をすべて削除します。元に戻せません。`}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (confirming === 'history') onClearHistory()
                    else onClearAll()
                    setConfirming(null)
                  }}
                >
                  削除する
                </Button>
                <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setConfirming(null)}>
                  やめる
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                disabled={historyCount === 0}
                onClick={() => setConfirming('history')}
              >
                履歴を削除
              </Button>
              <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setConfirming('all')}>
                すべてのデータを削除
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
