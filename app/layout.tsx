import type { Metadata } from 'next'
import { Bebas_Neue, Barlow, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const barlow = Barlow({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-barlow',
})

const notoSansJP = Noto_Sans_JP({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto',
})

export const metadata: Metadata = {
  title: 'STATE | リノベーション施工会社',
  description: '東京を拠点とするリノベーション施工会社STATE。店舗・住宅・オフィスの内装工事・リノベーション、特注家具の設計・製作。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={`${bebasNeue.variable} ${barlow.variable} ${notoSansJP.variable}`}>
        {children}
      </body>
    </html>
  )
}
