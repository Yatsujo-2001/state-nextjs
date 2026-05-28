import { getNewsById, getAllNewsIds, demoNews } from '@/lib/microcms'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  try {
    const ids = await getAllNewsIds()
    return ids.map((id) => ({ id }))
  } catch {
    return demoNews.map((item) => ({ id: item.id }))
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getNewsById(id)
  if (!item) notFound()

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border bg-bg/90 backdrop-blur-sm">
        <Link href="/" className="font-bebas text-2xl tracking-widest text-accent">STATE</Link>
        <div className="flex gap-6 font-bebas tracking-widest text-sm">
          <Link href="/" className="hover:text-accent transition-colors">Works</Link>
          <Link href="/" className="hover:text-accent transition-colors">News</Link>
          <Link href="/company" className="hover:text-accent transition-colors">Company</Link>
          <Link href="/recruit" className="hover:text-accent transition-colors">Recruit</Link>
        </div>
      </nav>

      <main className="pt-24 pb-24 px-6 md:px-12 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 font-bebas text-xs tracking-widest text-text-muted mb-12">
          <Link href="/" className="hover:text-text transition-colors">Home</Link>
          <span>/</span>
          <span>News</span>
          <span>/</span>
          <span className="text-text truncate max-w-xs">{item.title}</span>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="font-bebas text-accent text-xs tracking-widest border border-accent px-2 py-0.5">
              {item.category}
            </span>
            <span className="font-barlow text-text-muted text-sm">
              {formatDate(item.publishedAt)}
            </span>
          </div>
          <h1 className="font-noto text-2xl md:text-3xl leading-snug">{item.title}</h1>
        </div>

        <div className="h-px bg-border mb-12" />

        <div
          className="rich-text font-noto text-sm text-text-muted leading-relaxed"
          dangerouslySetInnerHTML={{ __html: item.body }}
        />

        <div className="h-px bg-border mt-16 mb-8" />

        <Link
          href="/"
          className="font-bebas tracking-widest text-sm text-text-muted hover:text-text transition-colors"
        >
          ← Back to News
        </Link>
      </main>

      <footer className="border-t border-border px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="font-bebas text-2xl tracking-widest text-accent">STATE</p>
          <p className="font-barlow text-xs text-text-muted">© 2024 STATE Co., Ltd.</p>
        </div>
      </footer>
    </div>
  )
}
