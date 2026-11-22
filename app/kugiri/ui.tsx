'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** 外国語テキスト用のフォント（ハングル・中国語なども OS のフォントで綺麗に出す） */
export const FOREIGN_FONT = {
  fontFamily:
    'var(--font-barlow), "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR", "PingFang SC", var(--font-noto), sans-serif',
}

type IconProps = { className?: string }

const svg = (path: ReactNode) =>
  function Icon({ className = 'h-4 w-4' }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {path}
      </svg>
    )
  }

export const SpeakerIcon = svg(
  <>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </>,
)
export const PlusIcon = svg(<path d="M12 5v14M5 12h14" />)
export const CheckIcon = svg(<path d="m5 12.5 4.5 4.5L19 7.5" />)
export const TrashIcon = svg(
  <>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </>,
)
export const GearIcon = svg(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </>,
)
export const ArrowLeftIcon = svg(<path d="M19 12H5m6-6-6 6 6 6" />)
export const CloseIcon = svg(<path d="M6 6l12 12M18 6 6 18" />)
export const DownloadIcon = svg(<path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />)

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-[#5b8fd0] disabled:bg-[#2a3a50] disabled:text-[#8a8580]',
  secondary:
    'border border-[#2c2c2c] bg-[#151515] text-text hover:border-accent hover:text-white disabled:opacity-50',
  ghost: 'text-text-muted hover:text-text hover:bg-[#161616] disabled:opacity-50',
  danger: 'border border-[#4a2723] text-[#e08a80] hover:bg-[#2a1715] disabled:opacity-50',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 font-noto text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT[variant]} ${className}`}
    />
  )
}

export function IconButton({
  label,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-[#1a1a1a] hover:text-text disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/** 暗記リストへの追加ボタン（追加済みならチェック表示） */
export function AddButton({
  added,
  onAdd,
  compact = false,
}: {
  added: boolean
  onAdd: () => void
  compact?: boolean
}) {
  if (compact) {
    return (
      <IconButton
        label={added ? '暗記リストに追加済み' : '暗記リストに追加'}
        onClick={onAdd}
        disabled={added}
        className={added ? 'text-[#5fb38a] disabled:opacity-100' : 'text-accent hover:text-white'}
      >
        {added ? <CheckIcon /> : <PlusIcon />}
      </IconButton>
    )
  }
  return (
    <Button variant={added ? 'ghost' : 'primary'} onClick={onAdd} disabled={added} className="px-3 py-1.5 text-xs">
      {added ? <CheckIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
      {added ? '追加済み' : '暗記リストに追加'}
    </Button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`rounded-full border px-3 py-1 font-noto text-xs transition-colors ${
        checked
          ? 'border-accent bg-[#16243a] text-[#cfe0f6]'
          : 'border-[#2a2a2a] text-text-muted hover:text-text'
      }`}
    >
      {label}
    </button>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-noto text-base font-bold tracking-wide text-text">{children}</h2>
      {right}
    </div>
  )
}
