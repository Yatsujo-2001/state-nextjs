'use client'

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase())
  if (exact) return exact
  const base = lang.split('-')[0].toLowerCase()
  return voices.find((v) => v.lang.toLowerCase().startsWith(base))
}

/** ブラウザの音声合成で読み上げる */
export function speak(text: string, lang: string, rate = 0.9): void {
  if (!canSpeak() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  if (lang) {
    utterance.lang = lang
    const voice = pickVoice(lang)
    if (voice) utterance.voice = voice
  }
  utterance.rate = rate
  synth.speak(utterance)
}
