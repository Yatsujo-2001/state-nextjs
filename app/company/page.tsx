import Link from 'next/link'

export default function CompanyPage() {
  const companyData = [
    ['会社名', '株式会社STATE'],
    ['代表取締役社長', '山田一郎'],
    ['設立', '2016年4月1日'],
    ['資本金', '1,000万円'],
    ['従業員数', '28名'],
    ['決算期', '3月末'],
    ['所在地', '〒150-0001 東京都渋谷区神宮前X-X-X'],
    ['電話番号', '03-XXXX-XXXX'],
    ['事業内容', '店舗・住宅・オフィスの内装工事・リノベーション、特注家具・什器の設計・製作'],
  ]

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border bg-bg/90 backdrop-blur-sm">
        <Link href="/" className="font-bebas text-2xl tracking-widest text-accent">STATE</Link>
        <div className="flex gap-6 font-bebas tracking-widest text-sm">
          <Link href="/#works" className="hover:text-accent transition-colors">Works</Link>
          <Link href="/#news" className="hover:text-accent transition-colors">News</Link>
          <Link href="/company" className="text-accent">Company</Link>
          <Link href="/recruit" className="hover:text-accent transition-colors">Recruit</Link>
        </div>
      </nav>

      <main className="pt-24 pb-24">
        {/* HEADER */}
        <div className="px-6 md:px-12 py-16 max-w-7xl mx-auto border-b border-border">
          <p className="font-bebas text-accent tracking-widest text-xs mb-2">ABOUT THE COMPANY</p>
          <h1 className="font-bebas text-6xl md:text-8xl tracking-tight">Company</h1>
        </div>

        {/* COMPANY INFO */}
        <div className="px-6 md:px-12 py-16 max-w-4xl mx-auto">
          <div className="divide-y divide-border">
            {companyData.map(([label, value]) => (
              <div key={label} className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
                <dt className="font-bebas text-text-muted text-sm tracking-widest">{label}</dt>
                <dd className="md:col-span-2 font-noto text-sm leading-relaxed">{value}</dd>
              </div>
            ))}
          </div>
        </div>

        {/* PHILOSOPHY */}
        <div className="px-6 md:px-12 py-16 bg-[#080808]">
          <div className="max-w-4xl mx-auto">
            <p className="font-bebas text-accent tracking-widest text-xs mb-2">PHILOSOPHY</p>
            <h2 className="font-bebas text-5xl tracking-tight mb-12">Our Philosophy</h2>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  no: '01',
                  title: '素材と対話する',
                  body: 'コンクリート、鉄、木材—それぞれの素材が持つ固有の表情と向き合い、本来の美しさを最大限に引き出します。',
                },
                {
                  no: '02',
                  title: '余白を設計する',
                  body: '詰め込まず、削ぎ落とす。余白こそが空間に呼吸を与え、使い手が自らの時間を刻む余地を生み出します。',
                },
                {
                  no: '03',
                  title: '長く使われる空間を',
                  body: 'トレンドではなく、時を経て味わいが増す空間づくり。丁寧な施工と適切な素材選定で、10年後も愛される場所を。',
                },
              ].map((p) => (
                <div key={p.no}>
                  <p className="font-bebas text-5xl text-[#1a1a1a] mb-4 leading-none">{p.no}</p>
                  <h3 className="font-noto text-base mb-3">{p.title}</h3>
                  <p className="font-noto text-xs text-text-muted leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HISTORY */}
        <div className="px-6 md:px-12 py-16 max-w-4xl mx-auto">
          <p className="font-bebas text-accent tracking-widest text-xs mb-2">HISTORY</p>
          <h2 className="font-bebas text-5xl tracking-tight mb-12">Company History</h2>
          <div className="relative pl-8">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
            {[
              ['2016', '東京都渋谷区に株式会社STATE設立。初年度より10件以上の店舗内装を手がける。'],
              ['2018', '住宅リノベーション部門を新設。スケルトンリノベの実績を積み重ねる。'],
              ['2020', '特注家具製作工房を開設。鉄・木材の一貫製作体制を構築。'],
              ['2022', 'オフィス改装部門を強化。コロナ後の働き方変革に対応した空間設計に注力。'],
              ['2024', '従業員数28名体制へ拡大。年間施工実績50件超を達成。'],
            ].map(([year, desc]) => (
              <div key={year} className="relative mb-10 last:mb-0">
                <div className="absolute -left-8 top-1 w-2 h-2 bg-accent rounded-full -translate-x-0.5" />
                <p className="font-bebas text-accent text-lg tracking-widest mb-1">{year}</p>
                <p className="font-noto text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
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
