import { getWorks, getNews } from '@/lib/microcms'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const [works, news] = await Promise.all([getWorks(5), getNews(4)])
  return <HomeClient works={works} news={news} />
}
