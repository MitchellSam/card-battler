// Effect registry — REVISION 2 (2026-07-19): stickers are SLOTLESS and
// effects are CONTEXT-FREE. An effect is one definition that resolves in any
// context; the trigger decides when it fires:
//   · on a number card  → it is the flip effect
//   · on a face card    → it replaces the card's RANK spell
//   · on the Cheat Sheet's suit entries (config.suitOverrides, per player)
//     → it replaces that suit's spell for that player's casts
// The base game's DEFAULT effects are stickers too (pre-discovered, poolable),
// so players can rearrange the base game onto different cards.
//
// name/text live HERE and are THE anti-drift source: the web tooltip renders
// describeEffect(effective id) — never its own tables. Behaviour is
// implemented in the reducer keyed by id; no behaviour lambdas in data.

import type { EffectId, GameCard, Suit } from './types.js';

export type EffectTier = 'common' | 'uncommon' | 'rare';

/** What an effect needs picked at activation (cast time / flip-params time). */
export type TargetKind =
  | 'none'
  | 'anyMonster'
  | 'ownMonster' // any of yours, set included
  | 'ownFaceUp'
  | 'oppFaceUp'
  | 'oppFaceDown'
  | 'faceUpPowerLE5'
  | 'stackItem'
  | 'setSpellZone'
  | 'graveMonster';

export interface EffectSpec {
  id: EffectId;
  tier: EffectTier;
  name: string; // display name (defaults: "<rank> (default)")
  text: string; // display rules text — THE anti-drift source
  target: TargetKind;
  /**
   * Context rule: when the effect fires from a FLIP, the flipped monster IS
   * the subject and no target is picked; cast as a spell it targets instead.
   */
  subjectIsSource?: boolean;
  /** Discard cost picked at activation: number card (value = amount, Ace 1/11) or face card (flat +3). */
  fuel?: 'number' | 'face';
  /** graveMonster targets also pick the face-up summon position. */
  needsPosition?: boolean;
  /**
   * What the effect does TO ITS PICKED TARGET — machine-readable so the UI can
   * warn about self-destructive picks without hardcoding effect ids. Absent =
   * neutral/beneficial to the target. Untargeted board-wipes (default:8) carry
   * nothing: no target is ever picked for them.
   */
  harm?: 'destroy' | 'weaken';
  /** May appear in run reward/pack pools (effect-less 9/10 do not). */
  poolable: boolean;
  /** Unlocked from the start (the base game's defaults). */
  preDiscovered: boolean;
}

const sticker = (
  id: EffectId,
  tier: EffectTier,
  name: string,
  text: string,
  rest: Partial<EffectSpec> = {},
): EffectSpec => ({
  id,
  tier,
  name,
  text,
  target: 'none',
  poolable: true,
  preDiscovered: false,
  ...rest,
});

const dflt = (
  key: string,
  tier: EffectTier,
  text: string,
  rest: Partial<EffectSpec> = {},
): EffectSpec => ({
  id: `default:${key}`,
  tier,
  name: `${key} (default)`,
  text,
  target: 'none',
  poolable: true,
  preDiscovered: true,
  ...rest,
});

/**
 * Every implemented effect. Catalog stickers first (planning/EFFECT_CATALOG_v2.md,
 * text verbatim minus designer commentary), then the base-game defaults
 * (provisional tiers: number flips common, J/Q/K + suit spells uncommon).
 */
export const EFFECT_SPECS: EffectSpec[] = [
  // --- catalog stickers (M4 seed 9) ---------------------------------------
  sticker('peek', 'common', 'Peek', 'Look at the top 3 cards of your deck, rearrange them in any order.'),
  sticker('skim', 'common', 'Skim', 'Mill 1 card from your own deck, then draw 1 card.'),
  sticker('rally', 'common', 'Rally', 'All your other face-up attack monsters gain +1 power until end of turn.'),
  sticker('doorstop', 'common', 'Doorstop', 'This monster cannot be destroyed by combat this turn (survives regardless of power comparison).', {
    target: 'ownMonster',
    subjectIsSource: true,
  }),
  sticker('needle', 'common', 'Needle', 'Opponent reveals their hand to you, then you choose 1 card — they discard it.'),
  sticker('scavenge', 'common', 'Scavenge', 'Return 1 random card from your graveyard to your hand.'),
  sticker('warning-shot', 'common', 'Warning Shot', 'Deal no combat effect, but force 1 opposing face-down monster to reveal itself (flip face-up) without triggering its flip effect.', {
    target: 'oppFaceDown',
  }),
  sticker('leverage', 'uncommon', 'Leverage', 'Discard a face card to give your monster +3 power until end of turn.', {
    target: 'ownFaceUp',
    fuel: 'face',
  }),
  sticker('executioners-toll', 'uncommon', "Executioner's Toll", 'Destroy a monster with power 5 or lower.', {
    target: 'faceUpPowerLE5',
    harm: 'destroy',
  }),
  // --- base-game defaults, now poolable stickers ---------------------------
  dflt('A', 'common', 'power becomes 11 until end of turn', { target: 'ownFaceUp', subjectIsSource: true }),
  dflt('2', 'common', "flip any monster's battle position (a face-down flips up)", { target: 'anyMonster' }),
  dflt('3', 'common', "reveal the opponent's hand"),
  dflt('4', 'common', 'draw 1 card'),
  dflt('5', 'common', 'mill 2 from the opponent deck'),
  dflt('6', 'common', 'return any monster to its hand', { target: 'anyMonster' }),
  dflt('7', 'common', 'opponent discards 1 at random'),
  dflt('8', 'common', 'destroy every attack-position monster (both sides)'),
  dflt('9', 'common', 'no flip effect', { poolable: false }),
  dflt('10', 'common', 'no flip effect', { poolable: false }),
  dflt('J', 'uncommon', 'destroy any one monster', { target: 'anyMonster', harm: 'destroy' }),
  dflt('Q', 'uncommon', 'discard a number card → your monster +its value (this turn)', {
    target: 'ownFaceUp',
    fuel: 'number',
  }),
  dflt('K', 'uncommon', 'discard a number card → enemy monster −its value (permanent)', {
    target: 'oppFaceUp',
    fuel: 'number',
    harm: 'weaken',
  }),
  dflt('♠', 'uncommon', 'negate a card/effect on the stack', { target: 'stackItem' }),
  dflt('♥', 'uncommon', 'revive a monster from either graveyard (no flip effect)', {
    target: 'graveMonster',
    needsPosition: true,
  }),
  dflt('♣', 'uncommon', 'destroy a set spell/trap', { target: 'setSpellZone', harm: 'destroy' }),
  dflt('♦', 'uncommon', 'Polymerization — blackjack-fuse one of your monsters', { target: 'ownFaceUp' }),
];

const REGISTRY = new Map<EffectId, EffectSpec>(EFFECT_SPECS.map((s) => [s.id, s]));

export function getEffectSpec(id: EffectId): EffectSpec | undefined {
  return REGISTRY.get(id);
}

/** Catalog stickers only (not the base-game defaults). */
export function isCatalogSticker(id: EffectId): boolean {
  const spec = REGISTRY.get(id);
  return spec !== undefined && !spec.preDiscovered;
}

export interface EffectDescription {
  name: string;
  text: string;
}

/** Human-readable descriptor for ANY effect id (JOKER's Pot of Greed included). */
export function describeEffect(id: EffectId): EffectDescription {
  const spec = REGISTRY.get(id);
  if (spec) return { name: spec.name, text: spec.text };
  if (id === 'default:JOKER')
    return { name: 'Joker', text: 'draw 2 (Pot of Greed). Never bankable.' };
  throw new Error(`describeEffect: unknown effect id: ${id}`);
}

// ---------------------------------------------------------------------------
// Effective-effect lookups (slotless model)
// ---------------------------------------------------------------------------

/**
 * THE card-effect lookup: topmost REGISTERED sticker covers the card's own
 * effect (a number card's flip; a face card's rank spell), else the default.
 * Unregistered ids (schema-only rares) never resolve.
 */
export function effectiveCardEffect(card: GameCard): EffectId {
  for (let i = card.stickerStack.length - 1; i >= 0; i--) {
    if (REGISTRY.has(card.stickerStack[i]!)) return card.stickerStack[i]!;
  }
  return `default:${card.rank}`;
}

/** The flip effect a monster resolves with. */
export function effectiveFlipEffect(card: GameCard): EffectId {
  return effectiveCardEffect(card);
}

/**
 * The suit spell a player casts: their Cheat Sheet sticker for that suit
 * (config.suitOverrides — per player, VISIBLE) or the printed default.
 */
export function effectiveSuitEffect(
  suitOverrides: [Partial<Record<Suit, EffectId>> | null, Partial<Record<Suit, EffectId>> | null] | undefined,
  player: 0 | 1,
  suit: Suit,
): EffectId {
  return suitOverrides?.[player]?.[suit] ?? `default:${suit}`;
}

/**
 * Slot legality, REVISION 2: a kid sticks a sticker wherever — any card takes
 * any sticker (it becomes that card's effect). Only Jokers are off-limits
 * (they cannot be summoned or set; revisit with Recast in M5).
 */
export function canApplySticker(card: GameCard, spec: EffectSpec): boolean {
  void spec;
  return card.rank !== 'JOKER';
}
