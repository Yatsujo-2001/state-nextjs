'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  RANK_CHARS,
  SUIT_CHARS,
  createDeck,
  shuffle,
  evaluateBest,
  computePayouts,
  aiDecide,
  HAND_NAMES_EN,
  HAND_NAMES_JA,
} from '@/lib/poker/engine'

const SMALL_BLIND = 10
const BIG_BLIND = 20
const START_CHIPS = 1000

const AI_SEATS = [
  { name: 'NOVA', aggression: 0.62 },
  { name: 'KAZE', aggression: 0.34 },
  { name: 'VEGA', aggression: 0.5 },
]

type Stage = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

interface PlayerState {
  id: number
  name: string
  isHuman: boolean
  aggression: number
  chips: number
  cards: Card[]
  folded: boolean
  allIn: boolean
  out: boolean
  bet: number // 現在のストリートのベット額
  contribution: number // このハンドの総投入額
  acted: boolean
  lastAction: string | null
}

interface Result {
  name: string
  amount: number
  hand: string | null
}

interface GameState {
  players: PlayerState[]
  deck: Card[]
  community: Card[]
  stage: Stage
  current: number
  currentBet: number
  minRaise: number
  dealer: number
  handNo: number
  message: string
  revealed: boolean
  results: Result[] | null
}

const isBetting = (s: Stage) =>
  s === 'preflop' || s === 'flop' || s === 'turn' || s === 'river'

const inHand = (p: PlayerState) => !p.out && !p.folded
const canAct = (p: PlayerState) => inHand(p) && !p.allIn

function nextIdx(
  players: PlayerState[],
  from: number,
  pred: (p: PlayerState) => boolean
): number {
  for (let i = 1; i <= players.length; i++) {
    const idx = (from + i) % players.length
    if (pred(players[idx])) return idx
  }
  return -1
}

function initialState(): GameState {
  const players: PlayerState[] = [
    {
      id: 0, name: 'YOU', isHuman: true, aggression: 0,
      chips: START_CHIPS, cards: [], folded: false, allIn: false, out: false,
      bet: 0, contribution: 0, acted: false, lastAction: null,
    },
    ...AI_SEATS.map((seat, i) => ({
      id: i + 1, name: seat.name, isHuman: false, aggression: seat.aggression,
      chips: START_CHIPS, cards: [] as Card[], folded: false, allIn: false, out: false,
      bet: 0, contribution: 0, acted: false, lastAction: null as string | null,
    })),
  ]
  return {
    players, deck: [], community: [], stage: 'idle',
    current: -1, currentBet: 0, minRaise: BIG_BLIND, dealer: players.length - 1,
    handNo: 0, message: '', revealed: false, results: null,
  }
}

function post(p: PlayerState, amount: number) {
  const pay = Math.min(amount, p.chips)
  p.chips -= pay
  p.bet += pay
  p.contribution += pay
  if (p.chips === 0) p.allIn = true
}

function totalPot(players: PlayerState[]): number {
  return players.reduce((sum, p) => sum + p.contribution, 0)
}

function startHand(prev: GameState): GameState {
  const players = prev.players.map((p) => ({
    ...p,
    cards: [] as Card[],
    folded: false,
    allIn: false,
    out: p.out || p.chips <= 0,
    bet: 0,
    contribution: 0,
    acted: false,
    lastAction: null as string | null,
  }))
  const dealer = nextIdx(players, prev.dealer, (p) => !p.out)
  const deck = shuffle(createDeck())
  for (const p of players) {
    if (!p.out) p.cards = [deck.pop()!, deck.pop()!]
  }
  const aliveCount = players.filter((p) => !p.out).length
  const headsUp = aliveCount === 2
  const sb = headsUp ? dealer : nextIdx(players, dealer, (p) => !p.out)
  const bb = nextIdx(players, sb, (p) => !p.out)
  post(players[sb], SMALL_BLIND)
  post(players[bb], BIG_BLIND)
  players[sb].lastAction = `SB ${players[sb].bet}`
  players[bb].lastAction = `BB ${players[bb].bet}`

  const state: GameState = {
    players,
    deck,
    community: [],
    stage: 'preflop',
    current: bb,
    currentBet: BIG_BLIND,
    minRaise: BIG_BLIND,
    dealer,
    handNo: prev.handNo + 1,
    message: `ハンド #${prev.handNo + 1} — ブラインド ${SMALL_BLIND} / ${BIG_BLIND}`,
    revealed: false,
    results: null,
  }
  return afterAction(state)
}

function afterAction(state: GameState): GameState {
  const { players } = state
  const alive = players.filter(inHand)
  if (alive.length === 1) return awardUncontested(state)

  const actors = players.filter(canAct)
  const complete = actors.every((p) => p.acted && p.bet === state.currentBet)
  if (!complete) {
    const nxt = nextIdx(
      players,
      state.current,
      (p) => canAct(p) && !(p.acted && p.bet === state.currentBet)
    )
    if (nxt !== -1) return { ...state, current: nxt }
  }
  return advanceStage(state)
}

function advanceStage(state: GameState): GameState {
  if (state.stage === 'river') return doShowdown(state)

  const players = state.players.map((p) => ({
    ...p, bet: 0, acted: false, lastAction: null as string | null,
  }))
  const deck = [...state.deck]
  const community = [...state.community]
  if (state.stage === 'preflop') {
    community.push(deck.pop()!, deck.pop()!, deck.pop()!)
  } else {
    community.push(deck.pop()!)
  }
  const stage: Stage =
    state.stage === 'preflop' ? 'flop' : state.stage === 'flop' ? 'turn' : 'river'

  let next: GameState = {
    ...state, players, deck, community, stage,
    currentBet: 0, minRaise: BIG_BLIND,
  }

  // アクション可能なプレイヤーが1人以下ならランアウトしてショーダウン
  if (players.filter(canAct).length < 2) {
    while (next.community.length < 5) next.community.push(deck.pop()!)
    return doShowdown({ ...next, deck })
  }

  const first = nextIdx(players, state.dealer, canAct)
  return { ...next, current: first }
}

function awardUncontested(state: GameState): GameState {
  const players = state.players.map((p) => ({ ...p, bet: 0 }))
  const winner = players.find(inHand)!
  const pot = totalPot(players)
  winner.chips += pot
  return {
    ...state,
    players,
    stage: 'showdown',
    current: -1,
    revealed: false,
    results: [{ name: winner.name, amount: pot, hand: null }],
    message: `${winner.name} がポット ${pot.toLocaleString()} を獲得`,
  }
}

function doShowdown(state: GameState): GameState {
  const players = state.players.map((p) => ({ ...p, bet: 0 }))
  const evals = players.map((p) =>
    inHand(p) ? evaluateBest([...p.cards, ...state.community]) : null
  )
  const payouts = computePayouts(
    players.map((p, i) => ({
      contribution: p.contribution,
      score: evals[i]?.score ?? null,
    }))
  )
  const results: Result[] = []
  players.forEach((p, i) => {
    p.chips += payouts[i]
    if (payouts[i] > 0) {
      results.push({ name: p.name, amount: payouts[i], hand: evals[i]?.name ?? null })
    }
  })
  return {
    ...state,
    players,
    stage: 'showdown',
    current: -1,
    revealed: true,
    results,
    message: results
      .map((r) => `${r.name} が ${r.amount.toLocaleString()} を獲得（${r.hand}）`)
      .join(' / '),
  }
}

type Action =
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call' }
  | { type: 'raise'; to: number }

function applyAction(state: GameState, action: Action): GameState {
  if (!isBetting(state.stage) || state.current < 0) return state
  const players = state.players.map((p) => ({ ...p }))
  const p = players[state.current]
  let { currentBet, minRaise } = state

  if (action.type === 'fold') {
    p.folded = true
    p.acted = true
    p.lastAction = 'Fold'
  } else if (action.type === 'check') {
    p.acted = true
    p.lastAction = 'Check'
  } else if (action.type === 'call') {
    const pay = Math.min(currentBet - p.bet, p.chips)
    p.chips -= pay
    p.bet += pay
    p.contribution += pay
    if (p.chips === 0) p.allIn = true
    p.acted = true
    p.lastAction = pay > 0 ? (p.allIn ? 'All-in' : `Call ${p.bet}`) : 'Check'
  } else {
    const maxTo = p.bet + p.chips
    const to = Math.min(Math.max(action.to, 0), maxTo)
    const pay = to - p.bet
    p.chips -= pay
    p.bet = to
    p.contribution += pay
    if (p.chips === 0) p.allIn = true
    if (to > currentBet) {
      const isBet = currentBet === 0
      minRaise = Math.max(minRaise, to - currentBet)
      currentBet = to
      for (const other of players) {
        if (other !== p && canAct(other)) other.acted = false
      }
      p.lastAction = p.allIn ? 'All-in' : `${isBet ? 'Bet' : 'Raise'} ${to}`
    } else {
      p.lastAction = p.allIn ? 'All-in' : `Call ${to}`
    }
    p.acted = true
  }

  return afterAction({ ...state, players, currentBet, minRaise })
}

// ---- UI ----

const SUIT_COLORS = ['text-neutral-900', 'text-[#b04a45]', 'text-[#b04a45]', 'text-neutral-900']

function PlayingCard({
  card,
  hidden,
  size = 'md',
  dimmed,
}: {
  card?: Card
  hidden?: boolean
  size?: 'sm' | 'md' | 'lg'
  dimmed?: boolean
}) {
  const dims =
    size === 'sm'
      ? 'w-8 h-11 rounded-[5px]'
      : size === 'md'
        ? 'w-12 h-[66px] rounded-md'
        : 'w-16 h-[88px] rounded-lg'
  const rankText =
    size === 'sm' ? 'text-[11px]' : size === 'md' ? 'text-base' : 'text-xl'
  const suitText =
    size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-sm' : 'text-lg'

  if (hidden) {
    return (
      <div
        className={`${dims} bg-[#1c1c1c] border border-neutral-700 flex items-center justify-center ${dimmed ? 'opacity-30' : ''}`}
      >
        <div className="w-1 h-1 rounded-full bg-neutral-600" />
      </div>
    )
  }
  if (!card) {
    return <div className={`${dims} border border-dashed border-neutral-300`} />
  }
  return (
    <div
      className={`${dims} bg-white border border-neutral-200 shadow-sm flex flex-col items-center justify-center leading-none ${dimmed ? 'opacity-30' : ''}`}
    >
      <span className={`${rankText} font-medium tracking-tight text-neutral-900`}>
        {RANK_CHARS[card.rank]}
      </span>
      <span className={`${suitText} mt-0.5 ${SUIT_COLORS[card.suit]}`}>
        {SUIT_CHARS[card.suit]}
      </span>
    </div>
  )
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-neutral-400 tracking-wide">{children}</p>
}

const STAGE_LABELS: Record<string, string> = {
  preflop: 'Pre-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
}

const RANKING_ROWS = HAND_NAMES_EN.map((en, i) => ({ en, ja: HAND_NAMES_JA[i] })).reverse()

export default function PokerGame() {
  const [gs, setGs] = useState<GameState>(initialState)
  const [raiseTo, setRaiseTo] = useState(BIG_BLIND * 2)

  const human = gs.players[0]
  const isHumanTurn = isBetting(gs.stage) && gs.current === 0
  const pot = totalPot(gs.players)
  const toCall = Math.max(0, gs.currentBet - human.bet)
  const maxTo = human.bet + human.chips
  const minRaiseTo = Math.min(gs.currentBet + gs.minRaise, maxTo)
  const canRaise = isHumanTurn && maxTo > gs.currentBet && human.chips > toCall

  // AI の手番を進める
  useEffect(() => {
    if (!isBetting(gs.stage)) return
    const actor = gs.players[gs.current]
    if (!actor || actor.isHuman) return
    const timer = setTimeout(() => {
      setGs((s) => {
        if (!isBetting(s.stage)) return s
        const p = s.players[s.current]
        if (!p || p.isHuman) return s
        const decision = aiDecide({
          holeCards: p.cards,
          community: s.community,
          toCall: Math.max(0, s.currentBet - p.bet),
          pot: totalPot(s.players),
          chips: p.chips,
          currentBet: s.currentBet,
          myBet: p.bet,
          minRaiseTo: Math.min(s.currentBet + s.minRaise, p.bet + p.chips),
          bigBlind: BIG_BLIND,
          aggression: p.aggression,
        })
        return applyAction(s, decision)
      })
    }, 700 + Math.random() * 600)
    return () => clearTimeout(timer)
  }, [gs])

  // 手番が回ってきたらレイズ額をリセット
  useEffect(() => {
    if (isHumanTurn) setRaiseTo(minRaiseTo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHumanTurn, gs.stage, gs.currentBet])

  const myHandName = useMemo(() => {
    if (human.cards.length < 2 || gs.community.length < 3) return null
    return evaluateBest([...human.cards, ...gs.community]).name
  }, [human.cards, gs.community])

  const aliveOthers = gs.players.slice(1).filter((p) => !p.out)
  const humanBusted = gs.stage === 'showdown' && human.chips <= 0
  const humanChampion =
    gs.stage === 'showdown' && human.chips > 0 &&
    gs.players.slice(1).every((p) => p.chips <= 0)

  const clampedRaise = Math.min(Math.max(raiseTo, minRaiseTo), maxTo)

  return (
    <main className="min-h-screen bg-[#e9e9e7] text-neutral-900 font-barlow">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-5">
        {/* micro header */}
        <div className="flex justify-between items-baseline px-1">
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">
            Full Game / Texas Hold&apos;em
          </p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">Poker</p>
        </div>

        {gs.stage === 'idle' ? (
          <>
            {/* hero */}
            <section className="bg-[#f4f4f2] rounded-3xl p-7">
              <div className="flex justify-between text-xs text-neutral-700 mb-10">
                <span>Hold&apos;em®</span>
                <span>Overview</span>
                <span>Chips ( {START_CHIPS.toLocaleString()} )</span>
              </div>
              <h1 className="text-5xl font-medium tracking-tight leading-[1.02] mb-10">
                Texas
                <br />
                Hold&apos;em <span className="text-3xl align-top">®</span>
              </h1>
              <div className="flex justify-center gap-3 mb-12">
                <div className="rotate-[-6deg]">
                  <PlayingCard card={{ rank: 14, suit: 0 }} size="lg" />
                </div>
                <div className="rotate-[6deg] mt-2">
                  <PlayingCard card={{ rank: 13, suit: 1 }} size="lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-6 mb-12">
                {[
                  'ノーリミット形式の本格ベッティング',
                  '個性の異なる3人のAIと対戦',
                  `ブラインド ${SMALL_BLIND} / ${BIG_BLIND}`,
                  `スターティングスタック ${START_CHIPS.toLocaleString()}`,
                ].map((t) => (
                  <div key={t}>
                    <span className="inline-block w-3.5 h-3.5 rounded-full border border-neutral-400 text-neutral-400 text-[9px] leading-[13px] text-center mb-2">
                      i
                    </span>
                    <p className="text-xs text-neutral-500 leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
              <MicroLabel>Introducing Texas Hold&apos;em</MicroLabel>
              <p className="text-sm leading-relaxed mt-3 mb-8 text-neutral-800">
                2枚の手札と5枚のコミュニティカードで最強の役をつくる、
                世界でもっとも遊ばれているポーカー。駆け引きと確率のバランスが生む、
                純粋な思考のゲーム体験を。
              </p>
              <button
                onClick={() => setGs((s) => startHand(s))}
                className="w-full bg-neutral-900 text-white rounded-xl py-3.5 text-sm tracking-wide hover:bg-neutral-700 transition-colors"
              >
                ゲームを開始
              </button>
            </section>
          </>
        ) : (
          <>
            {/* opponents */}
            <section className="bg-[#0b0b0b] text-white rounded-3xl p-6">
              <MicroLabel>Opponents ( {aliveOthers.length} )</MicroLabel>
              <div className="mt-2">
                {gs.players.slice(1).map((p) => {
                  const isTurn = isBetting(gs.stage) && gs.current === p.id
                  const showCards = gs.revealed && !p.folded && !p.out
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between py-3.5 border-b border-neutral-800 last:border-0 ${
                        p.folded || p.out ? 'opacity-40' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-500">
                            0{p.id + 1}
                          </span>
                          <span className="text-sm tracking-wide">{p.name}</span>
                          {gs.dealer === p.id && (
                            <span className="text-[9px] w-4 h-4 rounded-full border border-neutral-600 text-neutral-400 flex items-center justify-center">
                              D
                            </span>
                          )}
                          {isTurn && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          {p.out
                            ? 'Eliminated'
                            : `${p.chips.toLocaleString()} chips${
                                p.lastAction ? ` — ${p.lastAction}` : ''
                              }`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {p.bet > 0 && (
                          <span className="text-xs text-neutral-400">{p.bet}</span>
                        )}
                        {!p.out && (
                          <div className="flex gap-1">
                            {showCards ? (
                              <>
                                <PlayingCard card={p.cards[0]} size="sm" />
                                <PlayingCard card={p.cards[1]} size="sm" />
                              </>
                            ) : (
                              <>
                                <PlayingCard hidden size="sm" dimmed={p.folded} />
                                <PlayingCard hidden size="sm" dimmed={p.folded} />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* community + pot */}
            <section className="bg-white rounded-3xl p-6">
              <div className="flex justify-between items-baseline">
                <MicroLabel>Community ( {gs.community.length} )</MicroLabel>
                <p className="text-[11px] text-neutral-400">
                  {STAGE_LABELS[gs.stage] ?? ''}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <PlayingCard key={i} card={gs.community[i]} size="md" />
                ))}
              </div>
              <div className="border-t border-neutral-200 mt-6 pt-5">
                <MicroLabel>Pot</MicroLabel>
                <p className="text-6xl font-medium tracking-tight mt-1">
                  {pot.toLocaleString()}
                </p>
              </div>
            </section>

            {/* player */}
            <section className="bg-white rounded-3xl p-6">
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-2">
                  <MicroLabel>Your hand ( 2 )</MicroLabel>
                  {gs.dealer === 0 && (
                    <span className="text-[9px] w-4 h-4 rounded-full border border-neutral-300 text-neutral-400 flex items-center justify-center">
                      D
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Stack {human.chips.toLocaleString()}
                  {human.bet > 0 ? ` / Bet ${human.bet}` : ''}
                </p>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="flex gap-2">
                  <PlayingCard card={human.cards[0]} size="lg" dimmed={human.folded} />
                  <PlayingCard card={human.cards[1]} size="lg" dimmed={human.folded} />
                </div>
                {myHandName && !human.folded && (
                  <p className="text-xs text-neutral-500 mb-1">{myHandName}</p>
                )}
              </div>

              <p className="text-[11px] text-neutral-400 mt-5 min-h-[16px]">
                {gs.message}
              </p>

              {gs.stage === 'showdown' ? (
                <div className="mt-4">
                  {gs.results?.map((r, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-baseline py-2.5 border-t border-neutral-200"
                    >
                      <span className="text-sm">
                        {r.name}
                        {r.hand ? (
                          <span className="text-neutral-400"> — {r.hand}</span>
                        ) : null}
                      </span>
                      <span className="text-sm font-medium">
                        +{r.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {humanBusted ? (
                    <>
                      <p className="text-2xl font-medium tracking-tight mt-6 mb-4">
                        Game over.
                      </p>
                      <button
                        onClick={() => setGs(() => startHand(initialState()))}
                        className="w-full bg-neutral-900 text-white rounded-xl py-3.5 text-sm tracking-wide hover:bg-neutral-700 transition-colors"
                      >
                        もう一度はじめる
                      </button>
                    </>
                  ) : humanChampion ? (
                    <>
                      <p className="text-2xl font-medium tracking-tight mt-6 mb-4">
                        You win it all.
                      </p>
                      <button
                        onClick={() => setGs(() => startHand(initialState()))}
                        className="w-full bg-neutral-900 text-white rounded-xl py-3.5 text-sm tracking-wide hover:bg-neutral-700 transition-colors"
                      >
                        もう一度はじめる
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setGs((s) => startHand(s))}
                      className="w-full mt-4 bg-neutral-900 text-white rounded-xl py-3.5 text-sm tracking-wide hover:bg-neutral-700 transition-colors"
                    >
                      次のハンドへ
                    </button>
                  )}
                </div>
              ) : isHumanTurn ? (
                <div className="mt-4">
                  {canRaise && (
                    <div className="mb-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <MicroLabel>Raise to</MicroLabel>
                        <span className="text-sm font-medium">
                          {clampedRaise >= maxTo ? 'All-in' : clampedRaise.toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={minRaiseTo}
                        max={maxTo}
                        step={10}
                        value={clampedRaise}
                        onChange={(e) => setRaiseTo(Number(e.target.value))}
                        className="w-full accent-neutral-900"
                      />
                      <div className="flex gap-2 mt-2">
                        {[
                          { label: 'Min', value: minRaiseTo },
                          { label: '½ Pot', value: Math.round((gs.currentBet + pot * 0.5) / 10) * 10 },
                          { label: 'Pot', value: Math.round((gs.currentBet + pot) / 10) * 10 },
                          { label: 'Max', value: maxTo },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() =>
                              setRaiseTo(Math.min(Math.max(preset.value, minRaiseTo), maxTo))
                            }
                            className="text-[11px] text-neutral-500 border border-neutral-200 rounded-full px-3 py-1 hover:border-neutral-400 transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGs((s) => applyAction(s, { type: 'fold' }))}
                      className="flex-1 border border-neutral-300 rounded-xl py-3 text-sm text-neutral-600 hover:border-neutral-500 transition-colors"
                    >
                      Fold
                    </button>
                    <button
                      onClick={() =>
                        setGs((s) =>
                          applyAction(s, { type: toCall > 0 ? 'call' : 'check' })
                        )
                      }
                      className="flex-1 border border-neutral-300 rounded-xl py-3 text-sm text-neutral-600 hover:border-neutral-500 transition-colors"
                    >
                      {toCall > 0
                        ? `Call ${Math.min(toCall, human.chips).toLocaleString()}`
                        : 'Check'}
                    </button>
                    {canRaise && (
                      <button
                        onClick={() =>
                          setGs((s) => applyAction(s, { type: 'raise', to: clampedRaise }))
                        }
                        className="flex-1 bg-neutral-900 text-white rounded-xl py-3 text-sm hover:bg-neutral-700 transition-colors"
                      >
                        {clampedRaise >= maxTo
                          ? 'All-in'
                          : gs.currentBet === 0
                            ? 'Bet'
                            : 'Raise'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 mt-4 animate-pulse">
                  相手のアクションを待っています…
                </p>
              )}
            </section>
          </>
        )}

        {/* hand rankings */}
        <section className="bg-white rounded-3xl p-6">
          <h2 className="text-2xl font-medium tracking-tight mb-4">Hand Rankings</h2>
          <div>
            {RANKING_ROWS.map((row, i) => (
              <div
                key={row.en}
                className="flex justify-between items-baseline py-3 border-b border-neutral-200 last:border-0"
              >
                <span className="text-sm text-neutral-800">
                  <span className="text-[10px] text-neutral-400 mr-3">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {row.en}
                </span>
                <span className="text-xs text-neutral-400">{row.ja}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[10px] text-neutral-400 text-center pb-4">
          Texas Hold&apos;em® — A perfect balance of odds and instinct.
        </p>
      </div>
    </main>
  )
}
