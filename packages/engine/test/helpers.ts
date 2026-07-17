// Test utilities: build arbitrary mid-game states directly so scripted tests
// don't have to reach them through shuffles.

import { monsterBasePower } from '../src/cards.js';
import { applyAction } from '../src/reducer.js';
import { createRng, type SeededRNG } from '../src/rng.js';
import {
  DEFAULT_CONFIG,
  type Action,
  type GameCard,
  type GameEvent,
  type GameState,
  type Monster,
  type PlayerId,
  type PlayerState,
  type Position,
  type Rank,
  type RulesConfig,
  type Suit,
} from '../src/types.js';

export function card(owner: PlayerId, rank: Rank, suit: Suit | null = '♠', idSuffix = ''): GameCard {
  const id =
    rank === 'JOKER' ? `${owner}:JOKER-${idSuffix || '1'}` : `${owner}:${rank}${suit}${idSuffix}`;
  return { id, owner, rank, suit: rank === 'JOKER' ? null : suit, stickerStack: [] };
}

export interface MonsterOpts {
  power?: number;
  summonedTurn?: number;
  setTurn?: number;
  attackedTurn?: number;
  posChangedTurn?: number;
}

export function mon(c: GameCard, position: Position, uid: number, opts: MonsterOpts = {}): Monster {
  return {
    uid,
    card: c,
    position,
    power: opts.power ?? monsterBasePower(c),
    tempAdds: [],
    summonedTurn: opts.summonedTurn ?? 0,
    ...(position === 'set' || opts.setTurn !== undefined ? { setTurn: opts.setTurn ?? 0 } : {}),
    attackedTurn: opts.attackedTurn ?? -1,
    posChangedTurn: opts.posChangedTurn ?? -1,
  };
}

/** Pad a zone array to the configured width. */
export function zones<T>(width: number, ...items: (T | null)[]): (T | null)[] {
  const out: (T | null)[] = [...items];
  while (out.length < width) out.push(null);
  return out;
}

export interface SideOpts {
  deck?: GameCard[];
  hand?: GameCard[];
  monsters?: (Monster | null)[];
  spellTraps?: ({ card: GameCard; setTurn: number } | null)[];
  graveyard?: GameCard[];
  bank?: GameCard[];
  removed?: GameCard[];
}

export interface StateOpts {
  turn?: number;
  activePlayer?: PlayerId;
  phase?: 'main1' | 'battle' | 'main2';
  config?: Partial<RulesConfig>;
  p0?: SideOpts;
  p1?: SideOpts;
  normalSummonUsed?: boolean;
}

/** Filler deck cards so tests don't accidentally trip the deck-out clock. */
export function fillerDeck(owner: PlayerId, n: number): GameCard[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${owner}:filler-${i}`,
    owner,
    rank: '3' as Rank,
    suit: '♣' as Suit,
    stickerStack: [],
  }));
}

export function makeState(opts: StateOpts = {}): GameState {
  const config: RulesConfig = { ...DEFAULT_CONFIG, ...opts.config };
  const turn = opts.turn ?? 5;
  const activePlayer = opts.activePlayer ?? 0;
  const side = (p: PlayerId, so: SideOpts = {}): PlayerState => ({
    deck: so.deck ?? fillerDeck(p, 8),
    hand: so.hand ?? [],
    monsters: zones(config.monsterZones, ...(so.monsters ?? [])),
    spellTraps: zones(config.spellTrapZones, ...(so.spellTraps ?? [])),
    graveyard: so.graveyard ?? [],
    bank: so.bank ?? [],
    removed: so.removed ?? [],
    mulliganed: true,
  });
  const players: [PlayerState, PlayerState] = [side(0, opts.p0), side(1, opts.p1)];
  let maxUid = 0;
  for (const ps of players)
    for (const m of ps.monsters) if (m && m.uid > maxUid) maxUid = m.uid;
  return {
    config,
    turn,
    firstPlayer: 0,
    activePlayer,
    phase: opts.phase ?? 'main1',
    players,
    stack: [],
    priority: activePlayer,
    passes: 0,
    pendingWindow: null,
    pending: null,
    poly: null,
    normalSummonUsed: opts.normalSummonUsed ?? false,
    nextUid: maxUid + 1,
    nextStackId: 1,
    result: null,
  };
}

export interface RunResult {
  state: GameState;
  events: GameEvent[];
}

/** Apply a sequence of actions, accumulating events. */
export function run(state: GameState, rng: SeededRNG, ...actions: Action[]): RunResult {
  let s = state;
  const events: GameEvent[] = [];
  for (const a of actions) {
    const r = applyAction(s, a, rng);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

/** Pass with whichever player holds priority until the stack fully resolves (or a decision interrupts). */
export function resolveStack(state: GameState, rng: SeededRNG, maxSteps = 50): RunResult {
  let s = state;
  const events: GameEvent[] = [];
  let steps = 0;
  while (s.stack.length > 0 && !s.pending && !s.poly && s.phase !== 'gameOver') {
    if (steps++ > maxSteps) throw new Error('resolveStack: did not converge');
    const r = applyAction(s, { type: 'pass', player: s.priority }, rng);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

export const rng0 = (): SeededRNG => createRng(42);

export function types(events: GameEvent[]): string[] {
  return events.map((e) => e.type);
}
