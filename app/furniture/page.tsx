import type { Metadata } from 'next'
import { SITE } from '@/lib/furniture'
import FurnitureIndex from './FurnitureIndex'

export const metadata: Metadata = {
  title: `${SITE.title} | ${SITE.brand}`,
  description: SITE.description,
}

export default function FurniturePage() {
  return <FurnitureIndex />
}
