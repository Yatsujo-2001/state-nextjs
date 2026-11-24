/**
 * FURNITURE INDEX — データ
 *
 * ── 家具を追加する手順 ──────────────────────────────
 * 1. 写真を 4:5 に整えて public/furniture/ に置く
 *      python3 scripts/prepare_furniture_image.py 元画像 public/furniture/<slug>.jpg
 *    ・背景がグレー〜白のレンダー/写真 → 既定（float）。背景をセル色に合わせ、作品を中央に浮かせる
 *      作品の大きさは --fill 0.6〜0.8 で揃える
 *    ・床や壁ごと見せたい写真 → --mode bleed（4:5 にトリミングのみ）
 * 2. 下の ITEMS に1件追加する。images の1枚目が INDEX のサムネイルになります
 *    （加工していない白背景の切り抜き写真をそのまま使う場合は fit: 'contain'）
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
  /** 'cover'（既定・4:5 に整えた画像）| 'contain'（未加工の白背景切り抜き） */
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
    labelPosition: 1,
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
    labelPosition: 0,
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
 * 作品名・年・素材・サイズ・説明は未確定（仮の名前）。分かり次第入れる。
 * 項目を書かなければ INDEX では非表示、詳細ページでは「—」になります。
 */
export const ITEMS: FurnitureItem[] = [
  // TABLES
  {
    slug: 'table-01',
    name: 'Table 01',
    type: 'Low table',
    category: 'tables',
    images: ['/furniture/table-01.jpg'],
  },
  {
    slug: 'table-02',
    name: 'Table 02',
    type: 'Side table',
    category: 'tables',
    images: ['/furniture/table-02.jpg'],
  },

  // SEATS
  {
    slug: 'seat-01',
    name: 'Seat 01',
    type: 'Chair',
    category: 'seats',
    images: ['/furniture/seat-01.jpg'],
  },
  {
    slug: 'seat-02',
    name: 'Seat 02',
    type: 'Lounge chair',
    category: 'seats',
    images: ['/furniture/seat-02.jpg'],
  },
  {
    slug: 'seat-03',
    name: 'Seat 03',
    type: 'Bench',
    category: 'seats',
    images: ['/furniture/seat-03.jpg'],
  },

  // STORAGE
  {
    slug: 'storage-01',
    name: 'Storage 01',
    type: 'Shelf',
    category: 'storage',
    images: ['/furniture/storage-01.jpg'],
  },

  // LIGHTING
  {
    slug: 'lighting-01',
    name: 'Lighting 01',
    type: 'Table lamp',
    category: 'lighting',
    images: ['/furniture/lighting-01.jpg'],
  },
  {
    slug: 'lighting-02',
    name: 'Lighting 02',
    type: 'Floor lamp',
    category: 'lighting',
    images: ['/furniture/lighting-02.jpg'],
  },
  {
    slug: 'lighting-03',
    name: 'Lighting 03',
    type: 'Floor lamp',
    category: 'lighting',
    images: ['/furniture/lighting-03.jpg'],
  },
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
  | { kind: 'empty'; key: string; desktopOnly: boolean }

/**
 * 最後の行を空セルで埋める。PC（4列）では 4 の倍数に、
 * スマホ（2列）では偶数に揃え、スマホで余る空セルは desktopOnly にする。
 */
export function padCells(cells: Cell[]): Cell[] {
  const out = [...cells]
  const mobileFill = out.length % 2
  for (let i = 0; out.length % 4 !== 0; i++) {
    out.push({ kind: 'empty', key: `empty-${out.length}`, desktopOnly: i >= mobileFill })
  }
  return out
}

/**
 * グリッドに並べるセル列を組み立てる。
 * 各カテゴリの商品列の labelPosition 番目にカテゴリセルを差し込み、
 * 最後の行を空セルで埋める。
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
  return padCells(cells)
}
