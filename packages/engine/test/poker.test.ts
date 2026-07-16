import { describe, expect, it } from 'vitest';
import { createDeck } from '../src/cards.js';
import { bestHand, compareBanks, evaluate5, showdown } from '../src/poker.js';
import { createRng } from '../src/rng.js';
import { shuffle } from '../src/rng.js';
import type { GameCard, PlayerId, Rank, Suit } from '../src/types.js';
import { card } from './helpers.js';

const c = (rank: Rank, suit: Suit, owner: PlayerId = 0) => card(owner, rank, suit);

describe('hand categories', () => {
  const cases: [string, GameCard[], number][] = [
    ['straight flush', [c('9', '♠'), c('8', '♠'), c('7', '♠'), c('6', '♠'), c('5', '♠')], 8],
    ['wheel straight flush', [c('A', '♦'), c('2', '♦'), c('3', '♦'), c('4', '♦'), c('5', '♦')], 8],
    ['four of a kind', [c('9', '♠'), c('9', '♥'), c('9', '♣'), c('9', '♦'), c('5', '♠')], 7],
    ['full house', [c('9', '♠'), c('9', '♥'), c('9', '♣'), c('5', '♦'), c('5', '♠')], 6],
    ['flush', [c('K', '♥'), c('9', '♥'), c('7', '♥'), c('4', '♥'), c('2', '♥')], 5],
    ['straight', [c('10', '♠'), c('9', '♥'), c('8', '♣'), c('7', '♦'), c('6', '♠')], 4],
    ['ace-high straight', [c('A', '♠'), c('K', '♥'), c('Q', '♣'), c('J', '♦'), c('10', '♠')], 4],
    ['wheel', [c('A', '♠'), c('2', '♥'), c('3', '♣'), c('4', '♦'), c('5', '♠')], 4],
    ['trips', [c('9', '♠'), c('9', '♥'), c('9', '♣'), c('4', '♦'), c('5', '♠')], 3],
    ['two pair', [c('9', '♠'), c('9', '♥'), c('5', '♣'), c('5', '♦'), c('2', '♠')], 2],
    ['pair', [c('9', '♠'), c('9', '♥'), c('7', '♣'), c('5', '♦'), c('2', '♠')], 1],
    ['high card', [c('K', '♠'), c('9', '♥'), c('7', '♣'), c('5', '♦'), c('2', '♠')], 0],
  ];
  for (const [name, cards, category] of cases) {
    it(name, () => expect(evaluate5(cards).category).toBe(category));
  }
});

describe('bank comparison', () => {
  it('any complete hand beats any partial hand', () => {
    const partial = [c('A', '♠'), c('A', '♥'), c('A', '♣'), c('A', '♦')]; // 4 aces, but only 4 cards
    const complete = [c('2', '♠'), c('3', '♥'), c('5', '♣'), c('7', '♦'), c('9', '♠')];
    expect(compareBanks(complete, partial)).toBeGreaterThan(0);
  });

  it('partials compare by high card', () => {
    const kHigh = [c('K', '♠')];
    const pairOfFives = [c('5', '♥'), c('5', '♦')];
    expect(compareBanks(kHigh, pairOfFives)).toBeGreaterThan(0);
  });

  it('picks the best 5 out of a larger bank', () => {
    const bank = [
      c('9', '♠'), c('9', '♥'), c('9', '♣'), // trips
      c('5', '♦'), c('5', '♠'), // + pair = full house
      c('K', '♠'), c('2', '♦'),
    ];
    expect(bestHand(bank).category).toBe(6);
  });

  it('kickers first, then suit of the highest differing card', () => {
    // same pair, same kickers ranks — suit of the highest card decides
    const a = [c('9', '♠'), c('9', '♥'), c('K', '♠'), c('7', '♣'), c('2', '♦')];
    const b = [c('9', '♣', 1), c('9', '♦', 1), c('K', '♥', 1), c('7', '♦', 1), c('2', '♣', 1)];
    expect(compareBanks(a, b)).toBeGreaterThan(0); // K♠ > K♥ path
  });

  it('literally identical best-5: extended kickers decide, else draw', () => {
    const five = (owner: PlayerId) => [
      c('9', '♠', owner), c('9', '♥', owner), c('K', '♠', owner), c('7', '♣', owner), c('2', '♦', owner),
    ];
    expect(showdown(five(0), five(1)).winner).toBe('draw');
    const withExtra = [...five(0), c('3', '♦')];
    expect(showdown(withExtra, five(1)).winner).toBe(0); // 6th-best card breaks the tie
  });
});

// Property test: category agrees with an independent reference implementation.
function referenceCategory(cards: GameCard[]): number {
  const order: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11 };
  const ranks = cards
    .map((x) => order[x.rank] ?? Number(x.rank))
    .sort((a, b) => b - a);
  const counts = Object.values(
    ranks.reduce<Record<number, number>>((m, r) => ((m[r] = (m[r] ?? 0) + 1), m), {}),
  ).sort((a, b) => b - a);
  const flush = new Set(cards.map((x) => x.suit)).size === 1;
  const uniq = [...new Set(ranks)];
  const straight =
    uniq.length === 5 &&
    (ranks[0]! - ranks[4]! === 4 || ranks.join() === [14, 5, 4, 3, 2].join());
  if (straight && flush) return 8;
  if (counts[0] === 4) return 7;
  if (counts[0] === 3 && counts[1] === 2) return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (counts[0] === 3) return 3;
  if (counts[0] === 2 && counts[1] === 2) return 2;
  if (counts[0] === 2) return 1;
  return 0;
}

describe('property: evaluator vs reference', () => {
  it('agrees on 2000 random 5-card hands', () => {
    const rng = createRng(1234);
    const deck = createDeck(0).filter((x) => x.rank !== 'JOKER'); // 52 cards
    for (let i = 0; i < 2000; i++) {
      shuffle(deck, rng);
      const hand = deck.slice(0, 5);
      expect(evaluate5(hand).category, hand.map((h) => h.id).join(',')).toBe(
        referenceCategory(hand),
      );
    }
  });

  it('bestHand never scores below any individual 5-card subset (500 random banks)', () => {
    const rng = createRng(99);
    const deck = createDeck(0).filter((x) => x.rank !== 'JOKER');
    for (let i = 0; i < 500; i++) {
      shuffle(deck, rng);
      const bank = deck.slice(0, 5 + rng.int(4)); // 5-8 cards
      const best = bestHand(bank).category;
      for (let t = 0; t < 5; t++) {
        shuffle(bank, rng);
        expect(best).toBeGreaterThanOrEqual(evaluate5(bank.slice(0, 5)).category);
      }
    }
  });

  it('comparison is antisymmetric', () => {
    const rng = createRng(7);
    const d0 = createDeck(0).filter((x) => x.rank !== 'JOKER');
    const d1 = createDeck(1).filter((x) => x.rank !== 'JOKER');
    for (let i = 0; i < 300; i++) {
      shuffle(d0, rng);
      shuffle(d1, rng);
      const a = d0.slice(0, 3 + rng.int(6));
      const b = d1.slice(0, 3 + rng.int(6));
      expect(Math.sign(compareBanks(a, b))).toBe(-Math.sign(compareBanks(b, a)));
    }
  });
});
