import { createClient } from 'microcms-js-sdk'

function getClient() {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN
  const apiKey = process.env.MICROCMS_API_KEY
  if (!serviceDomain || !apiKey) return null
  return createClient({ serviceDomain, apiKey })
}

export type Work = {
  id: string
  createdAt: string
  updatedAt: string
  publishedAt: string
  title: string
  description: string
  category: string
  location: string
  area: string
  duration: string
  year: string
  thumbnail?: {
    url: string
    height: number
    width: number
  }
}

export type NewsItem = {
  id: string
  createdAt: string
  updatedAt: string
  publishedAt: string
  title: string
  body: string
  category: string
}

export const demoWorks: Work[] = [
  {
    id: 'demo-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
    title: '渋谷カフェ「KURO」内装工事',
    description: '既存の壁を剥がし、コンクリート打ちっぱなしの質感を生かしたインダストリアルな空間に仕上げました。鉄骨の梁を露出させ、無骨でありながら洗練された雰囲気を演出しています。',
    category: '店舗内装',
    location: '東京都渋谷区',
    area: '85㎡',
    duration: '45日',
    year: '2024',
  },
  {
    id: 'demo-2',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
    publishedAt: '2024-02-01T00:00:00.000Z',
    title: '代官山マンションリノベーション',
    description: '築30年のRC造マンションを現代的な住空間へ。スケルトンリノベーションにより、間取りを大幅に変更し、LDKを広く確保しました。キッチンはアイランド型を採用。',
    category: '住宅リノベ',
    location: '東京都渋谷区代官山',
    area: '72㎡',
    duration: '60日',
    year: '2024',
  },
  {
    id: 'demo-3',
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-03-01T00:00:00.000Z',
    publishedAt: '2024-03-01T00:00:00.000Z',
    title: '品川オフィス改装',
    description: 'スタートアップ企業のオフィスをフルリノベーション。フリーアドレス制に対応した柔軟なレイアウトと、集中作業エリア・コラボレーションエリアを明確に区分した設計。',
    category: 'オフィス改装',
    location: '東京都品川区',
    area: '200㎡',
    duration: '30日',
    year: '2023',
  },
  {
    id: 'demo-4',
    createdAt: '2024-04-01T00:00:00.000Z',
    updatedAt: '2024-04-01T00:00:00.000Z',
    publishedAt: '2024-04-01T00:00:00.000Z',
    title: '恵比寿バー「STEEL」特注什器',
    description: 'スチールと古材を組み合わせたカウンターと棚を製作。職人が一点一点手仕上げした金属加工と、レクラメーションウッドの質感が空間のアイコンとなっています。',
    category: '特注家具',
    location: '東京都渋谷区恵比寿',
    area: '—',
    duration: '20日',
    year: '2023',
  },
  {
    id: 'demo-5',
    createdAt: '2024-05-01T00:00:00.000Z',
    updatedAt: '2024-05-01T00:00:00.000Z',
    publishedAt: '2024-05-01T00:00:00.000Z',
    title: '中目黒ヘアサロン「RAW」',
    description: 'ミラーとスチールパイプを大胆に使用したヘアサロン。天井高を最大限に活かしたハイシーリングデザインで、圧迫感のない開放的な空間を実現しました。',
    category: '店舗内装',
    location: '東京都目黒区中目黒',
    area: '55㎡',
    duration: '35日',
    year: '2023',
  },
]

export const demoNews: NewsItem[] = [
  {
    id: 'news-1',
    createdAt: '2024-05-01T00:00:00.000Z',
    updatedAt: '2024-05-01T00:00:00.000Z',
    publishedAt: '2024-05-01T00:00:00.000Z',
    title: '2024年度 施工事例集を公開しました',
    body: '<p>2024年度の施工事例集を公開しました。今年度は渋谷・代官山・恵比寿エリアを中心に多数のプロジェクトを手がけました。</p><p>各プロジェクトの詳細はWorksページよりご覧いただけます。</p>',
    category: 'お知らせ',
  },
  {
    id: 'news-2',
    createdAt: '2024-04-15T00:00:00.000Z',
    updatedAt: '2024-04-15T00:00:00.000Z',
    publishedAt: '2024-04-15T00:00:00.000Z',
    title: 'GW期間中の営業についてのお知らせ',
    body: '<p>2024年のゴールデンウィーク期間（4月27日〜5月6日）は、誠に勝手ながら休業とさせていただきます。</p><p>期間中のお問い合わせは、メールにてお受けしております。</p>',
    category: 'お知らせ',
  },
  {
    id: 'news-3',
    createdAt: '2024-03-20T00:00:00.000Z',
    updatedAt: '2024-03-20T00:00:00.000Z',
    publishedAt: '2024-03-20T00:00:00.000Z',
    title: '施工管理スタッフを募集しています',
    body: '<p>STATEでは施工管理スタッフを募集しています。経験者優遇。詳しくは採用情報ページをご覧ください。</p>',
    category: '採用',
  },
  {
    id: 'news-4',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
    publishedAt: '2024-02-01T00:00:00.000Z',
    title: 'ウェブサイトをリニューアルしました',
    body: '<p>この度、STATE公式ウェブサイトをリニューアルいたしました。施工事例を中心に、より見やすくご覧いただけるよう改善しました。</p>',
    category: 'お知らせ',
  },
]

export async function getWorks(limit = 5): Promise<Work[]> {
  try {
    const client = getClient()
    if (!client) return demoWorks.slice(0, limit)
    const data = await client.getList<Work>({
      endpoint: 'works',
      queries: { limit, orders: '-publishedAt' },
    })
    return data.contents.length ? data.contents : demoWorks.slice(0, limit)
  } catch {
    return demoWorks.slice(0, limit)
  }
}

export async function getNews(limit = 4): Promise<NewsItem[]> {
  try {
    const client = getClient()
    if (!client) return demoNews.slice(0, limit)
    const data = await client.getList<NewsItem>({
      endpoint: 'news',
      queries: { limit, orders: '-publishedAt' },
    })
    return data.contents.length ? data.contents : demoNews.slice(0, limit)
  } catch {
    return demoNews.slice(0, limit)
  }
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    const client = getClient()
    if (!client) return demoNews.find((n) => n.id === id) ?? demoNews[0]
    const data = await client.getListDetail<NewsItem>({
      endpoint: 'news',
      contentId: id,
    })
    return data
  } catch {
    return demoNews.find((n) => n.id === id) ?? demoNews[0]
  }
}

export async function getAllNewsIds(): Promise<string[]> {
  try {
    const items = await getNews(100)
    return items.map((n) => n.id)
  } catch {
    return demoNews.map((n) => n.id)
  }
}
