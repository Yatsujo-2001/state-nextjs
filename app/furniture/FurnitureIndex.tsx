'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, ITEMS, SITE, buildCells, getCategory, itemsIn } from '@/lib/furniture'
import { CellGrid } from './_components/cells'

/** URL の #tables などからフィルタを読む */
function readHash(): string | null {
  const id = decodeURIComponent(window.location.hash.slice(1))
  return getCategory(id) ? id : null
}

export default function FurnitureIndex() {
  const [filter, setFilter] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => setFilter(readHash())
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const select = useCallback((id: string | null) => {
    return (e: React.MouseEvent) => {
      e.preventDefault()
      setFilter(id)
      const url = id ? `#${id}` : window.location.pathname
      window.history.pushState(null, '', url)
      const top = gridRef.current?.getBoundingClientRect().top ?? 0
      if (top < 0) gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const cells = useMemo(() => buildCells(filter), [filter])
  const shown = filter ? itemsIn(filter).length : ITEMS.length
  const year = new Date().getFullYear()

  return (
    <>
      <header className="px-4 pt-16 md:px-5 md:pt-24">
        <h1 className="font-semibold uppercase leading-[0.86] tracking-[-0.055em] text-[clamp(2.75rem,11vw,3.75rem)] md:mt-16 md:text-[clamp(3.5rem,6.4vw,7rem)]">
          {SITE.title}
        </h1>
      </header>

      {/* カテゴリ切替 */}
      <div
        ref={gridRef}
        className="scroll-mt-0 px-4 pb-2.5 pt-7 md:px-5 md:pb-3 md:pt-10"
      >
        <nav className="fx-tiny flex flex-wrap items-baseline gap-x-4 gap-y-2" aria-label="Category">
          <FilterLink active={!filter} href="#" onClick={select(null)} label="All" count={ITEMS.length} />
          {CATEGORIES.map((c) => {
            const n = itemsIn(c.id).length
            if (!n) return null
            return (
              <FilterLink
                key={c.id}
                active={filter === c.id}
                href={`#${c.id}`}
                onClick={select(c.id)}
                label={c.short}
                count={n}
              />
            )
          })}
          <span className="ml-auto hidden tabular-nums text-[var(--fx-muted)] md:inline">
            Showing {String(shown).padStart(2, '0')}
          </span>
        </nav>
      </div>

      <CellGrid
        key={filter ?? 'all'}
        cells={cells}
        labelLink={(c) =>
          filter
            ? { href: '#', text: '← Back to index', onClick: select(null) }
            : { href: `#${c.id}`, text: `View all ${c.short} →`, onClick: select(c.id) }
        }
      />

      <footer className="fx-tiny flex items-center justify-between px-4 pb-6 pt-10 md:px-5 md:pt-16">
        <span className="text-[var(--fx-muted)]">
          © {year}
        </span>
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="fx-ulink">
          Back to top ↑
        </a>
      </footer>
    </>
  )
}

function FilterLink({
  active,
  href,
  onClick,
  label,
  count,
}: {
  active: boolean
  href: string
  onClick: (e: React.MouseEvent) => void
  label: string
  count: number
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={active ? 'fx-ulink' : 'text-[var(--fx-muted)] transition-colors hover:text-[var(--fx-ink)]'}
    >
      {label}
      <sup className="ml-0.5 text-[8px] tabular-nums">{String(count).padStart(2, '0')}</sup>
    </a>
  )
}
