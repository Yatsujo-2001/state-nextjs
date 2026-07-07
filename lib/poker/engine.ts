// テキサスホールデム ゲームエンジン
// カード生成・役判定・サイドポット計算・AI意思決定

export type Card = { rank: number; suit: number } // rank: 2-14 (14=A), suit: 0♠ 1♥ 2♦ 3♣

export const SUIT_CHARS = ['♠', '♥', '♦', '♣']
export const RANK_CHARS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}

export const HAND_NAMES_JA = [
  'ハイカード',
  'ワンペア',
  'ツーペア',
  'スリーカード',
  'ストレート',
  'フラッシュ',
  'フルハウス',
  'フォーカード',
  'ストレートフラッシュ',
]

export const HAND_NAMES_EN = [
  'High Card',
  'One Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
]

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 5枚の役を数値配列で評価する。[カテゴリ, タイブレーク...] 辞書式に大きい方が強い
function rank5(cards: Card[]): number[] {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a)
  const counts = new Map<number, number>()
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1)

  const isFlush = cards.every((c) => c.suit === cards[0].suit)

  const uniq = [...new Set(ranks)]
  let straightHigh = 0
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0]
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHigh = 5 // A-2-3-4-5
  }

  if (isFlush && straightHigh) return [8, straightHigh]

  // 出現回数の多い順 → ランクの高い順
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])

  if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]]
  if (groups[0][1] === 3 && groups[1][1] === 2) return [6, groups[0][0], groups[1][0]]
  if (isFlush) return [5, ...ranks]
  if (straightHigh) return [4, straightHigh]
  if (groups[0][1] === 3) return [3, groups[0][0], groups[1][0], groups[2][0]]
  if (groups[0][1] === 2 && groups[1][1] === 2)
    return [2, groups[0][0], groups[1][0], groups[2][0]]
  if (groups[0][1] === 2)
    return [1, groups[0][0], groups[1][0], groups[2][0], groups[3][0]]
  return [0, ...ranks]
}

export function compareScores(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    if (av !== bv) return av - bv
  }
  return 0
}

// 5〜7枚から最良の5枚役を求める
export function evaluateBest(cards: Card[]): { score: number[]; name: string; nameEn: string } {
  let best: number[] | null = null
  const n = cards.length
  const pick = (start: number, chosen: Card[]) => {
    if (chosen.length === 5) {
      const s = rank5(chosen)
      if (!best || compareScores(s, best) > 0) best = s
      return
    }
    if (n - start < 5 - chosen.length) return
    for (let i = start; i < n; i++) {
      chosen.push(cards[i])
      pick(i + 1, chosen)
      chosen.pop()
    }
  }
  pick(0, [])
  const score = best! as number[]
  const isRoyal = score[0] === 8 && score[1] === 14
  return {
    score,
    name: isRoyal ? 'ロイヤルフラッシュ' : HAND_NAMES_JA[score[0]],
    nameEn: isRoyal ? 'Royal Flush' : HAND_NAMES_EN[score[0]],
  }
}

// サイドポットを考慮した払い戻し計算
// contribution: このハンドでの総投入額, score: ショーダウンでの評価値 (フォールドは null)
export function computePayouts(
  entries: { contribution: number; score: number[] | null }[]
): number[] {
  const payouts = entries.map(() => 0)
  const levels = [...new Set(entries.map((e) => e.contribution).filter((c) => c > 0))].sort(
    (a, b) => a - b
  )
  let prev = 0
  for (const level of levels) {
    let pot = 0
    for (const e of entries) {
      pot += Math.max(0, Math.min(e.contribution, level) - prev)
    }
    const eligible = entries
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.score !== null && e.contribution >= level)
    if (eligible.length === 0) {
      // このレベルの拠出者が全員フォールドしている場合は各自に返金
      entries.forEach((e, i) => {
        payouts[i] += Math.max(0, Math.min(e.contribution, level) - prev)
      })
    } else {
      let best = eligible[0]
      for (const cand of eligible) {
        if (compareScores(cand.e.score!, best.e.score!) > 0) best = cand
      }
      const winners = eligible.filter(
        ({ e }) => compareScores(e.score!, best.e.score!) === 0
      )
      const share = Math.floor(pot / winners.length)
      let remainder = pot - share * winners.length
      for (const w of winners) {
        payouts[w.i] += share
        if (remainder > 0) {
          payouts[w.i] += 1
          remainder -= 1
        }
      }
    }
    prev = level
  }
  return payouts
}

// ---- AI ----

// プリフロップのハンド強度 (0-1)。Chen formula を簡略化
function preflopStrength(cards: Card[]): number {
  const [a, b] = [...cards].sort((x, y) => y.rank - x.rank)
  let pts = Math.max(a.rank / 14, 0.3)
  if (a.rank === b.rank) pts = Math.min(1, 0.55 + a.rank / 28) // ペア
  else {
    pts = a.rank / 14 * 0.55 + b.rank / 14 * 0.25
    if (a.suit === b.suit) pts += 0.08
    const gap = a.rank - b.rank
    if (gap === 1) pts += 0.06
    else if (gap === 2) pts += 0.03
    else if (gap >= 4) pts -= 0.08
  }
  return Math.max(0, Math.min(1, pts))
}

export type AIAction =
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call' }
  | { type: 'raise'; to: number }

export function aiDecide(params: {
  holeCards: Card[]
  community: Card[]
  toCall: number // コール額
  pot: number // 現在の総ポット (全員の contribution 合計)
  chips: number // 残りスタック
  currentBet: number
  myBet: number
  minRaiseTo: number
  bigBlind: number
  aggression: number // 0-1 プレイヤーごとの性格
}): AIAction {
  const {
    holeCards, community, toCall, pot, chips,
    minRaiseTo, myBet, bigBlind, aggression,
  } = params

  let strength: number
  if (community.length === 0) {
    strength = preflopStrength(holeCards)
  } else {
    const { score } = evaluateBest([...holeCards, ...community])
    // カテゴリ + トップランクでざっくり正規化
    strength = Math.min(1, (score[0] + (score[1] ?? 0) / 15) / 6.5)
    // ボードだけで完成している役は割り引く
    if (community.length >= 5) {
      const boardOnly = evaluateBest(community)
      if (compareScores(boardOnly.score, score) === 0) strength *= 0.45
    }
  }

  const noise = (Math.random() - 0.5) * 0.14
  const s = Math.max(0, Math.min(1, strength + noise + aggression * 0.08))

  const maxTo = myBet + chips
  const raiseTo = () => {
    const target = Math.round((pot * (0.5 + aggression * 0.6 + Math.random() * 0.3)) / 10) * 10
    return Math.min(maxTo, Math.max(minRaiseTo, target))
  }

  if (toCall <= 0) {
    // チェック可能な局面
    if (s > 0.62 && chips > 0) return { type: 'raise', to: raiseTo() }
    if (s < 0.3 && Math.random() < 0.07 && chips > bigBlind * 2) {
      return { type: 'raise', to: raiseTo() } // たまにブラフ
    }
    return { type: 'check' }
  }

  const potOdds = toCall / (pot + toCall)
  if (s > 0.72 && chips > toCall) {
    return Math.random() < 0.7 ? { type: 'raise', to: raiseTo() } : { type: 'call' }
  }
  if (s > potOdds + 0.12) return { type: 'call' }
  if (toCall <= bigBlind && s > 0.25) return { type: 'call' } // 少額ならコール
  if (Math.random() < 0.05 && chips > toCall * 3) return { type: 'call' } // 時々粘る
  return { type: 'fold' }
}
