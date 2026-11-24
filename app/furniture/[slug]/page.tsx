import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ITEMS, SITE, getCategory, getItem, itemNumber, itemsIn, type Cell } from '@/lib/furniture'
import { CellGrid, ItemImage } from '../_components/cells'

export const dynamicParams = false

export function generateStaticParams() {
  return ITEMS.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const item = getItem(slug)
  if (!item) return {}
  return {
    title: `${item.name} — ${item.type} | ${SITE.brand}`,
    description: item.description ?? SITE.description,
  }
}

export default async function FurnitureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getItem(slug)
  if (!item) notFound()

  const category = getCategory(item.category)
  const siblings = itemsIn(item.category)
  const idx = siblings.findIndex((s) => s.slug === item.slug)
  const prev = siblings[(idx - 1 + siblings.length) % siblings.length]
  const next = siblings[(idx + 1) % siblings.length]
  const imageCount = Math.max(item.images?.length ?? 0, 1)

  const specs: [string, string | undefined][] = [
    ['Category', category?.label],
    ['Type', item.type],
    ['Year', item.year],
    ['Material', item.material],
    ['Size', item.size],
  ]

  // 同じカテゴリの他の作品（カテゴリセル + 他作品）
  const more: Cell[] = category
    ? [
        { kind: 'label', category, count: siblings.length },
        ...siblings.filter((s) => s.slug !== item.slug).map((s) => ({ kind: 'item' as const, item: s })),
      ]
    : []
  while (more.length % 4 !== 0) more.push({ kind: 'empty', key: `empty-${more.length}` })

  return (
    <>
      <header className="fx-tiny flex items-center justify-between px-4 pt-3 md:px-5 md:pt-4">
        <Link href="/furniture/" className="fx-ulink">
          ← {SITE.title}
        </Link>
        <span className="tabular-nums text-[var(--fx-muted)]">
          {category?.label} / {itemNumber(item)}
        </span>
      </header>

      <main className="mt-6 grid gap-[3px] px-[3px] md:mt-10 md:grid-cols-2 md:gap-1 md:px-1">
        {/* 写真 */}
        <div className="grid gap-[3px] md:gap-1">
          {Array.from({ length: imageCount }, (_, i) => (
            <div key={i} className="fx-in relative aspect-[4/5] overflow-hidden bg-[var(--fx-cell)]" style={{ '--i': i } as React.CSSProperties}>
              <ItemImage item={item} index={i} sizes="(min-width: 768px) 50vw, 100vw" priority={i === 0} />
            </div>
          ))}
        </div>

        {/* 情報 */}
        <aside className="self-start px-3 pb-6 pt-8 md:sticky md:top-0 md:px-8 md:pt-6 lg:px-12">
          <p className="fx-tiny text-[var(--fx-muted)]">{item.type}</p>
          <h1 className="mt-2 font-semibold leading-[0.88] tracking-[-0.05em] [overflow-wrap:anywhere] text-[clamp(2.75rem,12vw,4rem)] md:text-[clamp(3rem,5.6vw,6rem)]">
            {item.name}
          </h1>

          <dl className="mt-10 border-t border-[var(--fx-line)] text-[12px] md:mt-14">
            {specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-[var(--fx-line)] py-2.5">
                <dt className="fx-tiny pt-[2px] text-[var(--fx-muted)]">{k}</dt>
                <dd className="tabular-nums">{v ?? '—'}</dd>
              </div>
            ))}
          </dl>

          {item.description && (
            <p className="mt-8 max-w-[34rem] text-[13px] leading-[1.9]">{item.description}</p>
          )}

          {siblings.length > 1 && (
            <nav className="fx-tiny mt-12 flex justify-between gap-4" aria-label="Pager">
              <Link href={`/furniture/${prev.slug}/`} className="fx-ulink">
                ← {prev.name}
              </Link>
              <Link href={`/furniture/${next.slug}/`} className="fx-ulink text-right">
                {next.name} →
              </Link>
            </nav>
          )}
        </aside>
      </main>

      {more.length > 0 && category && (
        <section className="mt-16 md:mt-24">
          <h2 className="fx-tiny px-4 pb-2.5 md:px-5 md:pb-3">More {category.short}</h2>
          <CellGrid
            cells={more}
            labelLink={(c) => ({ href: `/furniture/#${c.id}`, text: `View all ${c.short} →` })}
          />
        </section>
      )}

      <footer className="fx-tiny flex items-center justify-between px-4 pb-6 pt-10 md:px-5 md:pt-16">
        <span className="text-[var(--fx-muted)]">
          © {new Date().getFullYear()} {SITE.brand}
        </span>
        <Link href="/furniture/" className="fx-ulink">
          Index ↑
        </Link>
      </footer>
    </>
  )
}
