'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Work, NewsItem } from '@/lib/microcms'

export default function HomeClient({ works, news }: { works: Work[]; news: NewsItem[] }) {
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSent, setContactSent] = useState(false)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border bg-bg/90 backdrop-blur-sm">
        <Link href="/" className="font-bebas text-2xl tracking-widest text-accent">STATE</Link>
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <div className={`w-6 h-px bg-text mb-1.5 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <div className={`w-6 h-px bg-text mb-1.5 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <div className={`w-6 h-px bg-text transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
        <ul className="hidden md:flex gap-8 font-bebas tracking-widest text-sm">
          {['Works', 'News', 'About', 'Services', 'Contact'].map((item) => (
            <li key={item}>
              <a href={`#${item.toLowerCase()}`} className="hover:text-accent transition-colors">
                {item}
              </a>
            </li>
          ))}
          <li><Link href="/company" className="hover:text-accent transition-colors">Company</Link></li>
          <li><Link href="/recruit" className="hover:text-accent transition-colors">Recruit</Link></li>
        </ul>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-bg flex flex-col items-center justify-center gap-8">
          {['Works', 'News', 'About', 'Services', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="font-bebas text-4xl tracking-widest hover:text-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <Link href="/company" className="font-bebas text-4xl tracking-widest hover:text-accent transition-colors" onClick={() => setMenuOpen(false)}>Company</Link>
          <Link href="/recruit" className="font-bebas text-4xl tracking-widest hover:text-accent transition-colors" onClick={() => setMenuOpen(false)}>Recruit</Link>
        </div>
      )}

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-end pb-16 px-6 md:px-12 pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/80 to-bg z-10" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, #1e1e1e 60px, #1e1e1e 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, #1e1e1e 60px, #1e1e1e 61px)`,
          }}
        />
        <div className="relative z-20 max-w-6xl">
          <p className="font-bebas text-accent tracking-[0.4em] text-sm mb-4">RENOVATION CONTRACTOR — TOKYO</p>
          <h1 className="font-bebas text-[clamp(4rem,14vw,12rem)] leading-none tracking-tight text-text mb-6">
            空間を、<br />つくる。
          </h1>
          <p className="font-noto text-text-muted text-sm md:text-base max-w-md leading-relaxed mb-10">
            素材の声を聴き、職人の手で仕上げる。<br />
            余白と緊張が共鳴する空間づくり。
          </p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="#works"
              className="font-bebas tracking-widest text-sm px-8 py-3 bg-accent text-bg hover:bg-text hover:text-bg transition-colors"
            >
              View Works
            </a>
            <a
              href="#contact"
              className="font-bebas tracking-widest text-sm px-8 py-3 border border-text-muted text-text-muted hover:border-text hover:text-text transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 right-8 md:right-12 z-20 font-bebas text-text-muted text-xs tracking-widest" style={{ writingMode: 'vertical-rl' }}>
          SCROLL DOWN
        </div>
      </section>

      {/* WORKS */}
      <section id="works" className="px-6 md:px-12 py-24 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="font-bebas text-accent tracking-widest text-xs mb-2">PORTFOLIO</p>
            <h2 className="font-bebas text-5xl md:text-6xl tracking-tight">Works</h2>
          </div>
          <span className="font-bebas text-text-muted text-sm tracking-widest">{works.length} PROJECTS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {works.map((work, i) => (
            <button
              key={work.id}
              onClick={() => setSelectedWork(work)}
              className="relative group bg-bg overflow-hidden text-left w-full"
            >
              <div className="aspect-[4/3] bg-[#111] relative overflow-hidden">
                {work.thumbnail ? (
                  <Image
                    src={work.thumbnail.url}
                    alt={work.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bebas text-8xl text-[#1e1e1e]">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-bg/0 group-hover:bg-bg/40 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="font-bebas text-sm tracking-widest border border-text px-6 py-2">View Detail</span>
                </div>
              </div>
              <div className="p-5">
                <span className="font-bebas text-accent text-xs tracking-widest">{work.category}</span>
                <h3 className="font-noto text-base mt-1 mb-2 leading-snug">{work.title}</h3>
                <div className="flex gap-4 text-text-muted font-barlow text-xs">
                  <span>{work.location}</span>
                  <span>{work.year}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* WORK MODAL */}
      {selectedWork && (
        <div
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedWork(null)}
        >
          <div
            className="bg-[#0f0f0f] border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="font-bebas text-accent text-xs tracking-widest">{selectedWork.category}</span>
                  <h3 className="font-noto text-xl md:text-2xl mt-1">{selectedWork.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedWork(null)}
                  className="text-text-muted hover:text-text transition-colors text-2xl leading-none ml-4 flex-shrink-0"
                >
                  ×
                </button>
              </div>
              {selectedWork.thumbnail && (
                <div className="aspect-video relative mb-6 overflow-hidden">
                  <Image src={selectedWork.thumbnail.url} alt={selectedWork.title} fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {([
                  ['場所', selectedWork.location],
                  ['面積', selectedWork.area],
                  ['工期', selectedWork.duration],
                  ['施工年', selectedWork.year],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="border-l-2 border-accent pl-3">
                    <p className="font-bebas text-text-muted text-xs tracking-widest">{label}</p>
                    <p className="font-noto text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <p className="font-noto text-sm text-text-muted leading-relaxed">{selectedWork.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* NEWS */}
      <section id="news" className="px-6 md:px-12 py-24 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="font-bebas text-accent tracking-widest text-xs mb-2">UPDATES</p>
            <h2 className="font-bebas text-5xl md:text-6xl tracking-tight">News</h2>
          </div>
          <div className="divide-y divide-border">
            {news.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 py-6 group hover:pl-2 transition-all duration-200"
              >
                <span className="font-barlow text-text-muted text-sm whitespace-nowrap">
                  {formatDate(item.publishedAt)}
                </span>
                <span className="font-bebas text-accent text-xs tracking-widest border border-accent px-2 py-0.5 w-fit">
                  {item.category}
                </span>
                <span className="font-noto text-sm group-hover:text-accent transition-colors flex-1">
                  {item.title}
                </span>
                <span className="font-bebas text-text-muted text-xs tracking-widest hidden md:block">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 md:px-12 py-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-bebas text-accent tracking-widest text-xs mb-2">ABOUT US</p>
            <h2 className="font-bebas text-5xl md:text-6xl tracking-tight mb-8">About</h2>
            <div className="space-y-4 font-noto text-sm text-text-muted leading-relaxed">
              <p>
                STATEは2016年、東京・渋谷に設立されたリノベーション施工会社です。
                店舗・住宅・オフィスの内装工事から、特注家具の設計・製作まで、
                空間づくりのすべてを手がけています。
              </p>
              <p>
                私たちが追求するのは、「状態（STATE）」の美しさ。
                素材が持つ本来の表情を引き出し、使い手と空間が共鳴する場所をつくります。
                余計なものを削ぎ落とし、本質だけを残す。それが私たちの仕事です。
              </p>
              <p>
                熟練の職人と気鋭のデザイナーが一つのチームとして動き、
                企画から施工完了まで一貫して責任を持って対応します。
              </p>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {([['8', 'Years'], ['200+', 'Projects'], ['28', 'Staff']] as [string, string][]).map(([num, label]) => (
                <div key={label}>
                  <p className="font-bebas text-4xl text-accent">{num}</p>
                  <p className="font-bebas text-text-muted text-xs tracking-widest">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/company" className="font-bebas tracking-widest text-sm border border-accent text-accent px-6 py-2 hover:bg-accent hover:text-bg transition-colors inline-block">
                Company Info
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-[#111] relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, #1e1e1e 0px, #1e1e1e 1px, transparent 1px, transparent 40px)`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bebas text-[10rem] text-[#1a1a1a] leading-none select-none">S</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent" />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="px-6 md:px-12 py-24 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <p className="font-bebas text-accent tracking-widest text-xs mb-2">WHAT WE DO</p>
          <h2 className="font-bebas text-5xl md:text-6xl tracking-tight mb-12">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {[
              {
                no: '01',
                title: '店舗内装',
                en: 'Store Interior',
                desc: 'カフェ・バー・レストラン・サロンなど、業態に合わせた店舗空間を設計・施工。コンセプトから什器まで一貫対応。',
              },
              {
                no: '02',
                title: '住宅リノベ',
                en: 'Residential',
                desc: 'スケルトンリノベから部分改修まで。既存の躯体を活かしながら、現代の暮らしに合わせた住空間を実現します。',
              },
              {
                no: '03',
                title: 'オフィス改装',
                en: 'Office',
                desc: '働き方の変化に対応したオフィス空間。フリーアドレス・コラボレーションゾーン・集中スペースを適切に配置。',
              },
              {
                no: '04',
                title: '特注家具',
                en: 'Custom Furniture',
                desc: '鉄・木・ガラスなど多様な素材を組み合わせた一点物の家具・什器を製作。空間のアイコンとなるピースを。',
              },
            ].map((s) => (
              <div key={s.no} className="bg-bg p-8 hover:bg-[#0f0f0f] transition-colors">
                <p className="font-bebas text-6xl text-[#1a1a1a] mb-4 leading-none">{s.no}</p>
                <p className="font-bebas text-accent text-xs tracking-widest mb-1">{s.en}</p>
                <h3 className="font-noto text-lg mb-4">{s.title}</h3>
                <p className="font-noto text-xs text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-6 md:px-12 py-24 max-w-4xl mx-auto">
        <p className="font-bebas text-accent tracking-widest text-xs mb-2">GET IN TOUCH</p>
        <h2 className="font-bebas text-5xl md:text-6xl tracking-tight mb-4">Contact</h2>
        <p className="font-noto text-sm text-text-muted mb-12">
          施工のご相談・お見積りはお気軽にお問い合わせください。
        </p>
        {contactSent ? (
          <div className="border border-accent p-8 text-center">
            <p className="font-bebas text-2xl text-accent mb-2">Thank you.</p>
            <p className="font-noto text-sm text-text-muted">お問い合わせを受け付けました。担当者よりご連絡いたします。</p>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="font-bebas text-xs tracking-widest text-text-muted block mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-transparent border border-border focus:border-accent outline-none px-4 py-3 font-noto text-sm transition-colors text-text"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="font-bebas text-xs tracking-widest text-text-muted block mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full bg-transparent border border-border focus:border-accent outline-none px-4 py-3 font-noto text-sm transition-colors text-text"
                  placeholder="example@mail.com"
                />
              </div>
            </div>
            <div>
              <label className="font-bebas text-xs tracking-widest text-text-muted block mb-2">Message *</label>
              <textarea
                required
                rows={6}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-accent outline-none px-4 py-3 font-noto text-sm transition-colors resize-none text-text"
                placeholder="ご相談内容をお書きください"
              />
            </div>
            <button
              type="submit"
              className="font-bebas tracking-widest text-sm px-10 py-3 bg-accent text-bg hover:bg-text hover:text-bg transition-colors"
            >
              Send Message
            </button>
          </form>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="font-bebas text-2xl tracking-widest text-accent mb-1">STATE</p>
            <p className="font-noto text-xs text-text-muted">〒150-0001 東京都渋谷区神宮前X-X-X</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {['Works', 'News', 'About', 'Services', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="font-bebas text-xs tracking-widest text-text-muted hover:text-text transition-colors">
                {item}
              </a>
            ))}
            <Link href="/company" className="font-bebas text-xs tracking-widest text-text-muted hover:text-text transition-colors">Company</Link>
            <Link href="/recruit" className="font-bebas text-xs tracking-widest text-text-muted hover:text-text transition-colors">Recruit</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border">
          <p className="font-barlow text-xs text-text-muted">© 2024 STATE Co., Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
