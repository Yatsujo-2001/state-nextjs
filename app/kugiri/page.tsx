import type { Metadata } from 'next'
import KugiriApp from './KugiriApp'

export const metadata: Metadata = {
  title: 'KUGIRI | 貼り付けて区切って覚える語学ノート',
  description:
    '外国語のテキストを貼り付けるだけで、意味のかたまりごとに区切って読み方・意味・文法を解説。気になった表現は暗記リストとフラッシュカードで復習できます。',
}

export default function KugiriPage() {
  return <KugiriApp />
}
