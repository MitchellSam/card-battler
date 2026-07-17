// Poker-hand evaluator for the bank showdown.
// Scoring: best 5-card hand from the entire bank; banks < 5 score standard
// categories over the cards available (M2.5 §10) and compete on the same
// category scale. Tie-breaks: standard kickers → suit order (♠>♥>♣>♦) on the
// highest differing card → extended kickers over the rest of the bank (an
// extra card beats no card) → true draw.

import { suitWeight } from './cards.js';
import type { GameCard, HandResult, PlayerId } from './types.js';

/** Poker rank: A high (A-low straights handled separately). */
export function pokerRank(card: GameCard): number {
  switch (card.rank) {
    case 'A':
      return 14;
    case 'K':
      return 13;
    case 'Q':
      return 12;
    case 'J':
      return 11;
    case 'JOKER':
      throw new Error('Jokers cannot be banked and have no poker value');
    default:
      return Number(card.rank);
  }
}

const CATEGORY_NAMES: Record<number, string> = {
  [-1]: 'partial hand',
  0: 'high card',
  1: 'pair',
  2: 'two pair',
  3: 'three of a kind',
  4: 'straight',
  5: 'flush',
  6: 'full house',
  7: 'four of a kind',
  8: 'straight flush',
};

export interface ScoredHand {
  category: number; // -1 partial, 0..8 complete
  vector: number[]; // [category, kicker ranks...] — lexicographic compare
  cards: GameCard[]; // hand cards sorted desc by (rank, suit) for suit tie-break
}

function sortDesc(cards: GameCard[]): GameCard[] {
  return [...cards].sort(
    (a, b) => pokerRank(b) - pokerRank(a) || suitWeight(b.suit) - suitWeight(a.suit),
  );
}

export function evaluate5(cards: GameCard[]): ScoredHand {
  if (cards.length !== 5) throw new Error('evaluate5 requires exactly 5 cards');
  const sorted = sortDesc(cards);
  const ranks = sorted.map(pokerRank);
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  // groups: by count desc, then rank desc
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = sorted.every((c) => c.suit === sorted[0]!.suit);
  const unique = [...counts.keys()].sort((a, b) => b - a);
  let straightHigh = 0;
  if (unique.length === 5) {
    if (unique[0]! - unique[4]! === 4) straightHigh = unique[0]!;
    else if (unique.join(',') === '14,5,4,3,2') straightHigh = 5; // wheel
  }

  let category: number;
  let vector: number[];
  if (straightHigh && flush) {
    category = 8;
    vector = [8, straightHigh];
  } else if (groups[0]![1] === 4) {
    category = 7;
    vector = [7, groups[0]![0], groups[1]![0]];
  } else if (groups[0]![1] === 3 && groups[1]![1] === 2) {
    category = 6;
    vector = [6, groups[0]![0], groups[1]![0]];
  } else if (flush) {
    category = 5;
    vector = [5, ...ranks];
  } else if (straightHigh) {
    category = 4;
    vector = [4, straightHigh];
  } else if (groups[0]![1] === 3) {
    category = 3;
    vector = [3, groups[0]![0], ...groups.slice(1).map((g) => g[0])];
  } else if (groups[0]![1] === 2 && groups[1]![1] === 2) {
    category = 2;
    vector = [2, groups[0]![0], groups[1]![0], groups[2]![0]];
  } else if (groups[0]![1] === 2) {
    category = 1;
    vector = [1, groups[0]![0], ...groups.slice(1).map((g) => g[0])];
  } else {
    category = 0;
    vector = [0, ...ranks];
  }
  return { category, vector, cards: sorted };
}

/**
 * Partial banks (<5 cards) score standard poker categories over the cards
 * available (ratified M2.5 §10): pairs, two pair, trips, quads are valid;
 * straights / flushes / full houses require 5 cards and are impossible.
 * Categories compete on the same scale as full hands — a 2-card KK pair beats
 * a 4-card (or 5-card) ace-high. Kickers then extended kickers as usual; an
 * extra card beats no card on a prefix tie.
 */
function scorePartial(cards: GameCard[]): ScoredHand {
  const sorted = sortDesc(cards);
  const ranks = sorted.map(pokerRank);
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const kickersAfter = (used: number[]) => ranks.filter((r) => !used.includes(r));

  let category: number;
  let vector: number[];
  if (groups[0] && groups[0][1] === 4) {
    category = 7;
    vector = [7, groups[0][0], ...kickersAfter([groups[0][0]])];
  } else if (groups[0] && groups[0][1] === 3) {
    category = 3;
    vector = [3, groups[0][0], ...kickersAfter([groups[0][0]])];
  } else if (groups[0] && groups[0][1] === 2 && groups[1] && groups[1][1] === 2) {
    category = 2;
    vector = [2, groups[0][0], groups[1][0], ...kickersAfter([groups[0][0], groups[1][0]])];
  } else if (groups[0] && groups[0][1] === 2) {
    category = 1;
    vector = [1, groups[0][0], ...kickersAfter([groups[0][0]])];
  } else {
    category = 0;
    vector = [0, ...ranks];
  }
  return { category, vector, cards: sorted };
}

/** Lexicographic vector compare; on prefix tie, the longer vector wins. */
function compareVectors(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i]! !== b[i]!) return a[i]! - b[i]!;
  }
  return a.length - b.length;
}

/** Suit tie-break: compare hands card-by-card (sorted desc); first differing suit wins. */
function compareSuits(a: GameCard[], b: GameCard[]): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = suitWeight(a[i]!.suit) - suitWeight(b[i]!.suit);
    if (d !== 0) return d;
  }
  return a.length - b.length;
}

export function compareScored(a: ScoredHand, b: ScoredHand): number {
  return compareVectors(a.vector, b.vector) || compareSuits(a.cards, b.cards);
}

function* combinations5<T>(items: T[]): Generator<T[]> {
  const n = items.length;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++)
            yield [items[a]!, items[b]!, items[c]!, items[d]!, items[e]!];
}

/** Best hand a bank can form (all cards if fewer than 5). */
export function bestHand(bank: GameCard[]): ScoredHand {
  if (bank.length < 5) return scorePartial(bank);
  let best: ScoredHand | null = null;
  for (const combo of combinations5(bank)) {
    const scored = evaluate5(combo);
    if (!best || compareScored(scored, best) > 0) best = scored;
  }
  return best!;
}

export function toHandResult(scored: ScoredHand): HandResult {
  return { category: scored.category, name: CATEGORY_NAMES[scored.category]!, cards: scored.cards };
}

/**
 * Full showdown comparison including extended kickers: if the two best-5 hands
 * are literally identical (ranks and suits), compare the 6th-best bank card,
 * then 7th, etc.; if still identical the game is a draw.
 */
export function compareBanks(bankA: GameCard[], bankB: GameCard[]): number {
  return compareBanksScored(bestHand(bankA), bestHand(bankB), bankA, bankB);
}

/** compareBanks with pre-computed best hands (showdown evaluates each bank once). */
function compareBanksScored(
  a: ScoredHand,
  b: ScoredHand,
  bankA: GameCard[],
  bankB: GameCard[],
): number {
  const primary = compareScored(a, b);
  if (primary !== 0) return primary;
  const usedA = new Set(a.cards.map((c) => c.id));
  const usedB = new Set(b.cards.map((c) => c.id));
  const restA = sortDesc(bankA.filter((c) => !usedA.has(c.id)));
  const restB = sortDesc(bankB.filter((c) => !usedB.has(c.id)));
  const n = Math.min(restA.length, restB.length);
  for (let i = 0; i < n; i++) {
    const d =
      pokerRank(restA[i]!) - pokerRank(restB[i]!) ||
      suitWeight(restA[i]!.suit) - suitWeight(restB[i]!.suit);
    if (d !== 0) return d;
  }
  // Ratified (M2.5 §10): on a prefix tie, an extra card beats no card.
  return restA.length - restB.length;
}

export function showdown(bank0: GameCard[], bank1: GameCard[]): {
  winner: PlayerId | 'draw';
  hands: [HandResult, HandResult];
} {
  const a = bestHand(bank0);
  const b = bestHand(bank1);
  const cmp = compareBanksScored(a, b, bank0, bank1);
  return {
    winner: cmp > 0 ? 0 : cmp < 0 ? 1 : 'draw',
    hands: [toHandResult(a), toHandResult(b)],
  };
}
