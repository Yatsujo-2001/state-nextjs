/**
 * サイトが置かれているパス（GitHub Pages では /state-nextjs、通常は空）。
 * next/link のリンクには自動で付くが、画像の src（unoptimized）や素の <a href> には
 * 付かないので、/ から始まるパスはこれを通す。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function withBase(path: string) {
  return path.startsWith('/') && !path.startsWith('//') ? `${BASE_PATH}${path}` : path
}
