import type { Metadata } from 'next'
import PokerGame from './PokerGame'

export const metadata: Metadata = {
  title: "Texas Hold'em | Poker",
  description:
    '3人のAIプレイヤーと対戦できるテキサスホールデム ポーカーゲーム。',
}

export default function PokerPage() {
  return <PokerGame />
}
