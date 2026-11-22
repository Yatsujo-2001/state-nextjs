// 実行環境ごとに差し替える部分。
// このファイルは通常のWebサイト版（ブラウザから Anthropic API を直接呼ぶ）。
// 別の環境で動かすときは、同じ名前をエクスポートするファイルに差し替える。

import { DEFAULT_SEGMENT_CHARS } from './core'

export { analyzeSegment } from './analyze'

/** 解析に Anthropic の APIキーが必要か */
export const REQUIRES_API_KEY = true

/** 1回の解析に送る最大文字数 */
export const SEGMENT_CHARS = DEFAULT_SEGMENT_CHARS

/** 入力欄の初期テキスト */
export const INITIAL_DRAFT = ''

/** テキストファイルを保存する。保存を始められたら true */
export async function saveTextFile(filename: string, text: string, mime: string): Promise<boolean> {
  try {
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}
