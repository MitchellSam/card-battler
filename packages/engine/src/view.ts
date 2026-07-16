// viewFor: the redacted per-player view. This is what a future server sends to
// clients and what the heuristic AI reads — it must never leak: opponent hand,
// either deck's order, or face-down cards' identities.

import { effectivePower } from './cards.js';
import type {
  GameCard,
  GameResult,
  GameState,
  Monster,
  Pending,
  Phase,
  PlayerId,
  PolyState,
  StackItem,
} from './types.js';

export interface MonsterView {
  uid: number;
  position: 'attack' | 'set' | 'defense';
  /** null when face-down and not yours */
  card: GameCard | null;
  /** null when face-down and not yours */
  power: number | null;
  attackedThisTurn: boolean;
}

export interface SetSpellView {
  /** null when not yours */
  card: GameCard | null;
  setTurn: number;
}

export interface SideView {
  deckCount: number;
  handCount: number;
  /** Only present for your own side. */
  hand?: GameCard[];
  monsters: (MonsterView | null)[];
  spellTraps: (SetSpellView | null)[];
  graveyard: GameCard[];
  bank: GameCard[];
  removed: GameCard[];
}

export interface PlayerView {
  player: PlayerId;
  turn: number;
  phase: Phase;
  activePlayer: PlayerId;
  priority: PlayerId;
  pending: Pending | null;
  pendingWindow: GameState['pendingWindow'];
  /** Stack is public: cards on the stack are revealed. */
  stack: StackItem[];
  poly: PolyState | null;
  normalSummonUsed: boolean;
  you: SideView;
  opponent: SideView;
  deckOut: boolean;
  result: GameResult | null;
}

function monsterView(m: Monster, mine: boolean, turn: number): MonsterView {
  const hidden = m.position === 'set' && !mine;
  return {
    uid: m.uid,
    position: m.position,
    card: hidden ? null : m.card,
    power: hidden ? null : effectivePower(m),
    attackedThisTurn: m.attackedTurn === turn,
  };
}

function sideView(state: GameState, side: PlayerId, viewer: PlayerId): SideView {
  const ps = state.players[side];
  const mine = side === viewer;
  return {
    deckCount: ps.deck.length,
    handCount: ps.hand.length,
    ...(mine ? { hand: ps.hand } : {}),
    monsters: ps.monsters.map((m) => (m ? monsterView(m, mine, state.turn) : null)),
    spellTraps: ps.spellTraps.map((st) =>
      st ? { card: mine ? st.card : null, setTurn: st.setTurn } : null,
    ),
    graveyard: ps.graveyard,
    bank: ps.bank,
    removed: ps.removed,
  };
}

export function viewFor(state: GameState, player: PlayerId): PlayerView {
  const opponent = (1 - player) as PlayerId;
  return {
    player,
    turn: state.turn,
    phase: state.phase,
    activePlayer: state.activePlayer,
    priority: state.priority,
    pending: state.pending,
    pendingWindow: state.pendingWindow,
    stack: state.stack,
    poly: state.poly,
    normalSummonUsed: state.normalSummonUsed,
    you: sideView(state, player, player),
    opponent: sideView(state, opponent, player),
    deckOut: state.deckOut,
    result: state.result,
  };
}
