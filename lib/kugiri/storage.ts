'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const PREFIX = 'kugiri:'

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** 保存に成功したら true */
export function writeStorage<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function clearStorage(keys: string[]): void {
  for (const key of keys) {
    try {
      window.localStorage.removeItem(PREFIX + key)
    } catch {
      // 削除できなくても続行
    }
  }
}

/**
 * localStorage と同期する state。
 * 静的書き出しのため、初回描画では fallback を使い、マウント後に保存値を読み込む。
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
): [T, (update: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(fallback)
  const [loaded, setLoaded] = useState(false)
  const fallbackRef = useRef(fallback)

  useEffect(() => {
    setValue(readStorage(key, fallbackRef.current))
    setLoaded(true)
  }, [key])

  useEffect(() => {
    if (loaded) writeStorage(key, value)
  }, [key, value, loaded])

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next))
  }, [])

  return [value, update, loaded]
}
