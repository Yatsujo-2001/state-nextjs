'use client'

import { useState } from 'react'
import Link from 'next/link'

const positions = [
  {
    id: 'construction',
    title: '施工管理',
    en: 'Construction Manager',
    employment: '正社員',
    salary: '月給 30万円〜50万円（経験・能力による）',
    location: '東京都渋谷区（現場による移動あり）',
    requirements: [
      '施工管理技士（1級または2級）の資格保有者',
      '内装工事の施工管理経験3年以上',
      '普通自動車免許（AT限定可）',
    ],
    welcome: [
      'リノベーション施工の経験者',
      '店舗内装の施工管理経験者',
      'AutoCADまたはVectorworksの操作スキル',
    ],
    description: '現場の施工管理業務全般をお任せします。職人・協力業者との調整、工程管理、品質管理、安全管理が主な業務です。少数精鋭のチームで、一人ひとりが幅広い裁量を持って働ける環境です。',
  },
  {
    id: 'carpenter',
    title: '内装大工',
    en: 'Interior Carpenter',
    employment: '正社員',
    salary: '月給 25万円〜40万円（経験・能力による）',
    location: '東京都内および近郊',
    requirements: [
      '内装大工としての実務経験3年以上',
      '木工・造作工事の基本技術の習得',
    ],
    welcome: [
      '鉄骨・溶接の経験者',
      '家具製作の経験者',
      '施工管理の資格保有者',
    ],
    description: '店舗・住宅・オフィスの内装造作工事をお任せします。弊社では特注家具の製作も行っており、幅広いスキルを活かせます。熟練の職人が多く在籍しており、技術の研鑽を続けられる環境です。',
  },
  {
    id: 'designer',
    title: '空間デザイナー',
    en: 'Space Designer',
    employment: '正社員',
    salary: '月給 28万円〜45万円（経験・能力による）',
    location: '東京都渋谷区（リモート一部可）',
    requirements: [
      '建築・インテリアデザイン関連の学校卒業',
      'VectorworksまたはAutoCADでの図面作成経験',
      '店舗・住宅のデザイン実績',
    ],
    welcome: [
      '施工の知識・経験がある方',
      '3Dモデリングツールの使用経験（SketchUp等）',
      'フォトグラフィーのスキル',
    ],
    description: 'クライアントのヒアリングからコンセプト立案、設計・施工図作成まで一貫して担当します。施工チームと密に連携しながら、アイデアを実際の空間へと落とし込む仕事です。',
  },
]

const steps = [
  { no: '01', label: '書類選考', desc: '履歴書・職務経歴書を送付してください。1週間以内に結果をご連絡します。' },
  { no: '02', label: '一次面接', desc: '人事担当者との面接。経歴・志望動機・スキルについてお話しします。' },
  { no: '03', label: '二次面接', desc: '代表または現場責任者との面接。実際の仕事内容・職場見学を含む場合があります。' },
  { no: '04', label: '内定通知', desc: '合否をメールにてご連絡します。条件確認の面談を実施する場合があります。' },
  { no: '05', label: '入社', desc: '入社日はご希望に合わせて柔軟に調整します。オリエンテーション・OJTで丁寧にサポートします。' },
]

export default function RecruitPage() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border bg-bg/90 backdrop-blur-sm">
        <Link href="/" className="font-bebas text-2xl tracking-widest text-accent">STATE</Link>
        <div className="flex gap-6 font-bebas tracking-widest text-sm">
          <Link href="/#works" className="hover:text-accent transition-colors">Works</Link>
          <Link href="/#news" className="hover:text-accent transition-colors">News</Link>
          <Link href="/company" className="hover:text-accent transition-colors">Company</Link>
          <Link href="/recruit" className="text-accent">Recruit</Link>
        </div>
      </nav>

      <main className="pt-24 pb-24">
        {/* HEADER */}
        <div className="px-6 md:px-12 py-16 max-w-7xl mx-auto border-b border-border">
          <p className="font-bebas text-accent tracking-widest text-xs mb-2">JOIN OUR TEAM</p>
          <h1 className="font-bebas text-6xl md:text-8xl tracking-tight">Recruit</h1>
          <p className="font-noto text-sm text-text-muted mt-4 max-w-xl leading-relaxed">
            STATEでは、空間づくりに本気で向き合える仲間を募集しています。
            職種・経験問わず、まずはお気軽にお問い合わせください。
          </p>
        </div>

        {/* POSITIONS */}
        <div className="px-6 md:px-12 py-16 max-w-4xl mx-auto">
          <p className="font-bebas text-accent tracking-widest text-xs mb-2">OPEN POSITIONS</p>
          <h2 className="font-bebas text-5xl tracking-tight mb-12">募集職種</h2>
          <div className="divide-y divide-border border-t border-border">
            {positions.map((pos) => (
              <div key={pos.id}>
                <button
                  className="w-full flex items-center justify-between py-6 text-left group"
                  onClick={() => setOpenId(openId === pos.id ? null : pos.id)}
                >
                  <div>
                    <p className="font-bebas text-accent text-xs tracking-widest mb-1">{pos.en}</p>
                    <h3 className="font-noto text-xl group-hover:text-accent transition-colors">{pos.title}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bebas text-xs text-text-muted tracking-widest border border-border px-3 py-1">{pos.employment}</span>
                    <span className={`font-bebas text-xl transition-transform duration-300 text-text-muted ${openId === pos.id ? 'rotate-45' : ''}`}>+</span>
                  </div>
                </button>
                {openId === pos.id && (
                  <div className="pb-8 space-y-6">
                    <p className="font-noto text-sm text-text-muted leading-relaxed">{pos.description}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="font-bebas text-xs tracking-widest text-accent mb-3">給与</p>
                        <p className="font-noto text-sm">{pos.salary}</p>
                      </div>
                      <div>
                        <p className="font-bebas text-xs tracking-widest text-accent mb-3">勤務地</p>
                        <p className="font-noto text-sm">{pos.location}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-bebas text-xs tracking-widest text-accent mb-3">必須要件</p>
                      <ul className="space-y-2">
                        {pos.requirements.map((r) => (
                          <li key={r} className="font-noto text-sm text-text-muted flex items-start gap-2">
                            <span className="text-accent mt-0.5">—</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-bebas text-xs tracking-widest text-accent mb-3">歓迎スキル</p>
                      <ul className="space-y-2">
                        {pos.welcome.map((w) => (
                          <li key={w} className="font-noto text-sm text-text-muted flex items-start gap-2">
                            <span className="text-text-muted mt-0.5">—</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href="/#contact"
                      className="font-bebas tracking-widest text-sm px-8 py-3 bg-accent text-bg hover:bg-text hover:text-bg transition-colors inline-block"
                    >
                      この職種に応募する
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SELECTION FLOW */}
        <div className="px-6 md:px-12 py-16 bg-[#080808]">
          <div className="max-w-4xl mx-auto">
            <p className="font-bebas text-accent tracking-widest text-xs mb-2">PROCESS</p>
            <h2 className="font-bebas text-5xl tracking-tight mb-12">選考フロー</h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />
              <div className="space-y-0 divide-y divide-border border-t border-border">
                {steps.map((step) => (
                  <div key={step.no} className="flex gap-6 py-8">
                    <div className="flex-shrink-0 w-12 h-12 bg-accent flex items-center justify-center">
                      <span className="font-bebas text-bg text-lg">{step.no}</span>
                    </div>
                    <div className="pt-1">
                      <h3 className="font-noto text-base mb-2">{step.label}</h3>
                      <p className="font-noto text-xs text-text-muted leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 md:px-12 py-24 max-w-4xl mx-auto text-center">
          <p className="font-bebas text-accent tracking-widest text-xs mb-4">INTERESTED?</p>
          <h2 className="font-bebas text-5xl md:text-6xl tracking-tight mb-6">Let's Talk.</h2>
          <p className="font-noto text-sm text-text-muted mb-10 max-w-md mx-auto leading-relaxed">
            求人票に載っていない職種や、インターンシップについても、まずはお気軽にご連絡ください。
          </p>
          <Link
            href="/#contact"
            className="font-bebas tracking-widest text-sm px-12 py-4 bg-accent text-bg hover:bg-text hover:text-bg transition-colors inline-block"
          >
            Contact Us
          </Link>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="font-bebas text-2xl tracking-widest text-accent">STATE</p>
          <p className="font-barlow text-xs text-text-muted">© 2024 STATE Co., Ltd.</p>
        </div>
      </footer>
    </div>
  )
}
