import type { EffectId, GameCard, Monster, PlayerId, Rank, Suit } from './types.js';

export const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];
export const NUMBER_RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
export const FACE_RANKS: Rank[] = ['J', 'Q', 'K'];
export const ALL_RANKS: Rank[] = [...NUMBER_RANKS, ...FACE_RANKS];

/** Combat/spell tiebreak order: ♠ > ♥ > ♣ > ♦. Higher = stronger. */
export function suitWeight(suit: Suit | null): number {
  switch (suit) {
    case '♠':
      return 4;
    case '♥':
      return 3;
    case '♣':
      return 2;
    case '♦':
      return 1;
    default:
      return 0;
  }
}

export function createDeck(owner: PlayerId): GameCard[] {
  const deck: GameCard[] = [];
  for (const suit of SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({ id: `${owner}:${rank}${suit}`, owner, rank, suit, stickerStack: [] });
    }
  }
  deck.push({ id: `${owner}:JOKER-1`, owner, rank: 'JOKER', suit: null, stickerStack: [] });
  deck.push({ id: `${owner}:JOKER-2`, owner, rank: 'JOKER', suit: null, stickerStack: [] });
  return deck; // 54 cards
}

export function isNumberRank(rank: Rank): boolean {
  return NUMBER_RANKS.includes(rank);
}

export function isMonsterCard(card: GameCard): boolean {
  if (card.typeOverride) return card.typeOverride === 'monster';
  return isNumberRank(card.rank);
}

export function isSpellCard(card: GameCard): boolean {
  if (card.rank === 'JOKER') return true; // sorcery-speed spell, but can never be SET
  if (card.typeOverride) return card.typeOverride === 'spell';
  return FACE_RANKS.includes(card.rank);
}

/** Face cards only — the ones that may be set in a spell/trap zone. */
export function isSettableSpell(card: GameCard): boolean {
  return isSpellCard(card) && card.rank !== 'JOKER';
}

/** Numeric value of a number card (Ace = 1). Used for power, sacrifice tiers, Q/K amounts. */
export function numberValue(rank: Rank): number {
  // RULES-GAP: Q/K say "discard a number card ... that value". Ace's value as a
  // discard is unstated; the flip table treats A as a number card, so we count A = 1.
  if (rank === 'A') return 1;
  const n = Number(rank);
  if (!Number.isFinite(n)) throw new Error(`not a number rank: ${rank}`);
  return n;
}

export function monsterBasePower(card: GameCard): number {
  if (card.typeOverride === 'monster') return 10; // Recast flat 10 (Run mode; unused in M1)
  return numberValue(card.rank);
}

/** Sacrifices required to summon: 5-7 need 1, 8-10 need 2, A-4 free. */
export function sacrificeCost(card: GameCard): number {
  if (!isMonsterCard(card)) return 0;
  if (card.typeOverride === 'monster') return 2; // Recast = flat 10 power / 2-sac cost (Run mode)
  const v = numberValue(card.rank);
  if (v >= 8) return 2;
  if (v >= 5) return 1;
  return 0;
}

/** Blackjack value for Polymerization draws (Ace handled separately: caster picks 1 or 11). */
export function polyValue(rank: Rank): number {
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  if (rank === 'JOKER') {
    // RULES-GAP: a Joker drawn during Polymerization has no defined blackjack value.
    // Conservative reading: 0 (it is neither a number nor a face card).
    return 0;
  }
  return numberValue(rank);
}

/**
 * Effect resolution hook: every effect lookup goes through here so Run-mode
 * stickers (top of stickerStack overrides the default) slot in without refactor.
 * M1: stacks are always empty, so this returns the rank-default effect id.
 */
export function effectiveEffect(card: GameCard): EffectId {
  const top = card.stickerStack[card.stickerStack.length - 1];
  return top ?? `default:${card.rank}`;
}

/** The flip-effect rank a set monster resolves with (through the sticker hook). */
export function effectiveFlipRank(card: GameCard): Rank {
  const eff = effectiveEffect(card);
  if (eff.startsWith('default:')) return eff.slice('default:'.length) as Rank;
  // Sticker effects arrive in M4; until then only defaults exist.
  throw new Error(`unknown effect id: ${eff}`);
}

/** Current effective power: temp "becomes" overrides base, then temp adds, floored at 0. */
export function effectivePower(m: Monster): number {
  const base = m.tempSet ? m.tempSet.value : m.power;
  const total = base + m.tempAdds.reduce((sum, b) => sum + b.value, 0);
  return Math.max(0, total);
}
