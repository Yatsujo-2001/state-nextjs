/**
 * FURNITURE INDEX — データ
 *
 * ── 家具を追加する手順 ──────────────────────────────
 * 1. 写真を public/furniture/ に置く（例: public/furniture/curb-1.jpg）
 *    ・背景が白〜薄グレーの切り抜き写真なら fit: 'contain'（既定）
 *      → 背景色がセルのグレーに自然に溶け込みます
 *    ・背景ごと見せたい写真（シーン写真など）は fit: 'cover'
 * 2. 下の ITEMS に1件追加する。images の1枚目が INDEX のサムネイルになります
 * 3. 並び順 = ITEMS の並び順（カテゴリごとにまとめて表示されます）
 *
 * ── カテゴリを追加・変更する ─────────────────────────
 * CATEGORIES を編集。labelPosition は「カテゴリ名のセルを
 * そのカテゴリの何番目に差し込むか」（0 = 先頭）。
 * 位置をばらすとグリッドにリズムが生まれます。
 */

export const SITE = {
  /** ページ上部の大見出し */
  title: 'FURNITURE INDEX',
  /** 左上の小さなブランド表記（クリックで href へ） */
  brand: 'STATE',
  brandHref: '/',
  /** ページ説明（meta description） */
  description: 'デザインした家具のインデックス。',
}

export type Category = {
  /** URL に使うID（英小文字） */
  id: string
  /** グリッドに出る大きな見出し */
  label: string
  /** 「VIEW ALL ___」に使う単語 */
  short: string
  /** 辞書風の説明文（カテゴリセルの下部に表示） */
  definition: string
  /** カテゴリセルを差し込む位置（0 = 先頭） */
  labelPosition?: number
}

export type FurnitureItem = {
  /** URL 用ID（英数字とハイフン）。/furniture/<slug>/ になる */
  slug: string
  /** 作品名 */
  name: string
  /** 種別（例: Coffee table） */
  type: string
  /** CATEGORIES の id */
  category: string
  year?: string
  /** /furniture/xxx.jpg 形式。1枚目がサムネイル。未設定ならプレースホルダー表示 */
  images?: string[]
  /** 'contain'（切り抜き・既定）| 'cover'（全面） */
  fit?: 'contain' | 'cover'
  material?: string
  /** 例: W1200 × D600 × H400 mm */
  size?: string
  description?: string
}

export const CATEGORIES: Category[] = [
  {
    id: 'tables',
    label: 'TABLES',
    short: 'TABLES',
    definition:
      'TABLE [téibl] noun. 天板と脚から成る家具。食べる、書く、並べる——暮らしの営みを受け止める水平面。',
    labelPosition: 1,
  },
  {
    id: 'seats',
    label: 'SEATS',
    short: 'SEATS',
    definition:
      'SEAT [síːt] noun. 腰を下ろすための家具。身体を預け、時間を過ごすための小さな居場所。',
    labelPosition: 3,
  },
  {
    id: 'storage',
    label: 'STORAGE',
    short: 'STORAGE',
    definition:
      'STORAGE [stɔ́ːridʒ] noun. ものを収め、整えるための家具。しまうことと見せることのあいだを設計する。',
    labelPosition: 0,
  },
  {
    id: 'lighting',
    label: 'LIGHTING',
    short: 'LIGHTING',
    definition:
      'LIGHTING [láitiŋ] noun. 光を灯し、空間に陰影を与える道具。灯っていない時間も、ひとつのオブジェとして。',
    labelPosition: 2,
  },
  {
    id: 'objects',
    label: 'OBJECTS',
    short: 'OBJECTS',
    definition:
      'OBJECT [ɑ́bdʒikt] noun. 用途の境界にある小さなもの。空間の余白に置かれ、手に触れられるための形。',
    labelPosition: 0,
  },
]

/**
 * ↓ いまはサンプル。写真が届いたものから差し替えていきます。
 */
export const ITEMS: FurnitureItem[] = [
  // TABLES
  {
    slug: 'table-01',
    name: 'Table 01',
    type: 'Low table',
    category: 'tables',
    year: '2026',
    // images: ['/furniture/table-01-1.jpg', '/furniture/table-01-2.jpg'],
    material: 'Steel, Oak',
    size: 'W1200 × D600 × H350 mm',
    description:
      'ここに作品の説明が入ります。素材の選び方、かたちの由来、使われる場面など。2〜4行程度がちょうどよい長さです。',
  },
  { slug: 'table-02', name: 'Table 02', type: 'Side table', category: 'tables', year: '2026' },
  { slug: 'table-03', name: 'Table 03', type: 'Dining table', category: 'tables', year: '2025' },

  // SEATS
  { slug: 'seat-01', name: 'Seat 01', type: 'Stool', category: 'seats', year: '2026' },
  { slug: 'seat-02', name: 'Seat 02', type: 'Bar stool', category: 'seats', year: '2025' },
  { slug: 'seat-03', name: 'Seat 03', type: 'Lounge chair', category: 'seats', year: '2025' },

  // STORAGE
  { slug: 'storage-01', name: 'Storage 01', type: 'Wall shelf', category: 'storage', year: '2026' },
  { slug: 'storage-02', name: 'Storage 02', type: 'Sideboard', category: 'storage', year: '2025' },
  { slug: 'storage-03', name: 'Storage 03', type: 'Bookshelf', category: 'storage', year: '2025' },

  // LIGHTING
  { slug: 'lighting-01', name: 'Lighting 01', type: 'Table lamp', category: 'lighting', year: '2026' },
  { slug: 'lighting-02', name: 'Lighting 02', type: 'Floor lamp', category: 'lighting', year: '2025' },
  { slug: 'lighting-03', name: 'Lighting 03', type: 'Pendant', category: 'lighting', year: '2025' },

  // OBJECTS
  { slug: 'object-01', name: 'Object 01', type: 'Tray', category: 'objects', year: '2026' },
  { slug: 'object-02', name: 'Object 02', type: 'Vase', category: 'objects', year: '2026' },
  { slug: 'object-03', name: 'Object 03', type: 'Bookend', category: 'objects', year: '2025' },
]

/* ───────────── helpers ───────────── */

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id)
}

export function getItem(slug: string) {
  return ITEMS.find((i) => i.slug === slug)
}

export function itemsIn(categoryId: string) {
  return ITEMS.filter((i) => i.category === categoryId)
}

/** カテゴリ内の通し番号（01, 02 …） */
export function itemNumber(item: FurnitureItem) {
  const idx = itemsIn(item.category).findIndex((i) => i.slug === item.slug)
  return String(idx + 1).padStart(2, '0')
}

export type Cell =
  | { kind: 'label'; category: Category; count: number }
  | { kind: 'item'; item: FurnitureItem }
  | { kind: 'empty'; key: string }

/**
 * グリッドに並べるセル列を組み立てる。
 * 各カテゴリの商品列の labelPosition 番目にカテゴリセルを差し込み、
 * 最後は 4 の倍数になるよう空セルで埋める（2列・4列どちらでも行が揃う）。
 */
export function buildCells(filter: string | null): Cell[] {
  const cats = filter ? CATEGORIES.filter((c) => c.id === filter) : CATEGORIES
  const cells: Cell[] = []
  for (const category of cats) {
    const items = itemsIn(category.id)
    if (!items.length) continue
    const pos = Math.min(Math.max(category.labelPosition ?? 0, 0), items.length)
    const row: Cell[] = items.map((item) => ({ kind: 'item', item }))
    row.splice(pos, 0, { kind: 'label', category, count: items.length })
    cells.push(...row)
  }
  while (cells.length % 4 !== 0) cells.push({ kind: 'empty', key: `empty-${cells.length}` })
  return cells
}
