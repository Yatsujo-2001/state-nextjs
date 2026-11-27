import Image from 'next/image'
import Link from 'next/link'
import type { Category, Cell, FurnitureItem } from '@/lib/furniture'
import { itemNumber } from '@/lib/furniture'
import { withBase } from '@/lib/base-path'

const CELL = 'relative aspect-[4/5] overflow-hidden'

/* ── 写真（プレースホルダー）だけを描く ── */
export function ItemImage({
  item,
  index = 0,
  sizes,
  priority,
}: {
  item: FurnitureItem
  index?: number
  sizes: string
  priority?: boolean
}) {
  const src = item.images?.[index]
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center select-none" aria-hidden>
        <span className="font-semibold tracking-[-0.06em] leading-none text-[var(--fx-ghost)] text-[clamp(2.5rem,12vw,3.5rem)] md:text-[clamp(3rem,5.5vw,5.5rem)]">
          {itemNumber(item)}
        </span>
      </div>
    )
  }
  const contain = item.fit === 'contain'
  return (
    <Image
      src={withBase(src)}
      alt={`${item.name} — ${item.type}`}
      fill
      sizes={sizes}
      priority={priority}
      className={`fx-img ${contain ? 'object-contain p-[14%] fx-blend' : 'object-cover'}`}
    />
  )
}

/* ── 商品セル ── */
export function ItemCell({ item, style }: { item: FurnitureItem; style?: React.CSSProperties }) {
  return (
    <Link
      href={`/furniture/${item.slug}/`}
      className={`fx-cell fx-in group block bg-[var(--fx-cell)] ${CELL}`}
      style={style}
    >
      <ItemImage item={item} sizes="(min-width: 768px) 25vw, 50vw" />
      <div className="fx-meta absolute inset-0 flex flex-col justify-between p-3 md:p-4">
        <div className="flex items-start justify-between gap-2 text-[11px] leading-[1.25] md:text-[12px]">
          <p>
            <span className="block font-medium">{item.name}</span>
            <span className="block text-[var(--fx-muted)]">{item.type}</span>
          </p>
          <span className="fx-meta-no tabular-nums text-[var(--fx-muted)]">{item.year}</span>
        </div>
        <span className="fx-meta-cta fx-tiny fx-ulink self-start">View detail ↗</span>
      </div>
    </Link>
  )
}

/* ── カテゴリ見出しセル ── */
export function LabelCell({
  category,
  count,
  href,
  linkText,
  onClick,
  style,
}: {
  category: Category
  count: number
  href: string
  linkText: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`fx-in flex flex-col bg-[var(--fx-cell-soft)] p-3 md:p-4 ${CELL}`}
      style={style}
    >
      <div className="fx-tiny flex items-baseline justify-between gap-2">
        <a href={withBase(href)} onClick={onClick} className="fx-ulink">
          {linkText}
        </a>
        <span className="tabular-nums text-[var(--fx-muted)]">({String(count).padStart(2, '0')})</span>
      </div>
      <h2 className="mt-2 font-semibold uppercase leading-[0.88] tracking-[-0.045em] [overflow-wrap:anywhere] text-[clamp(1.5rem,7.2vw,2.5rem)] md:text-[clamp(1.6rem,3.3vw,3.6rem)]">
        {category.label}
      </h2>
      <p className="mt-auto max-w-[95%] text-[10px] leading-[1.5] md:max-w-[88%] md:text-[11px]">
        {category.definition}
      </p>
    </div>
  )
}

export function EmptyCell({ style, desktopOnly }: { style?: React.CSSProperties; desktopOnly?: boolean }) {
  return (
    <div
      className={`fx-in bg-[var(--fx-cell-soft)] ${CELL} ${desktopOnly ? 'hidden md:block' : ''}`}
      style={style}
      aria-hidden
    />
  )
}

/* ── グリッド本体 ── */
export function CellGrid({
  cells,
  labelLink,
}: {
  cells: Cell[]
  /** カテゴリセルのリンク先・文言・クリック処理 */
  labelLink: (c: Category) => {
    href: string
    text: string
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  }
}) {
  return (
    <div className="grid grid-cols-2 gap-[3px] px-[3px] md:grid-cols-4 md:gap-1 md:px-1">
      {cells.map((cell, i) => {
        const style = { '--i': i } as React.CSSProperties
        if (cell.kind === 'item') return <ItemCell key={cell.item.slug} item={cell.item} style={style} />
        if (cell.kind === 'label') {
          const l = labelLink(cell.category)
          return (
            <LabelCell
              key={`label-${cell.category.id}`}
              category={cell.category}
              count={cell.count}
              href={l.href}
              linkText={l.text}
              onClick={l.onClick}
              style={style}
            />
          )
        }
        return <EmptyCell key={cell.key} style={style} desktopOnly={cell.desktopOnly} />
      })}
    </div>
  )
}
