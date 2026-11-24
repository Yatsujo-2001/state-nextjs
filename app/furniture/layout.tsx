import { Inter_Tight } from 'next/font/google'

const interTight = Inter_Tight({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-fx',
})

export default function FurnitureLayout({ children }: { children: React.ReactNode }) {
  return <div className={`fx-root ${interTight.variable}`}>{children}</div>
}
