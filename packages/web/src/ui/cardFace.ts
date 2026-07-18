// Presentation helpers for card identity. Pure display parsing — never rules.

import type { GameCard } from '@house-rules/engine';

export interface CardFace {
  rank: string;
  suit: string | null;
}

export function faceOf(card: GameCard): CardFace {
  return { rank: card.rank, suit: card.suit };
}

/** "0:K♠" → {rank:'K', suit:'♠'}; "1:JOKER-2" → {rank:'JOKER', suit:null}. */
export function faceFromId(cardId: string): CardFace {
  const face = cardId.slice(cardId.indexOf(':') + 1);
  if (face.startsWith('JOKER')) return { rank: 'JOKER', suit: null };
  return { rank: face.slice(0, -1), suit: face.slice(-1) };
}

export function faceLabel(f: CardFace): string {
  return f.rank === 'JOKER' ? 'Joker' : `${f.rank}${f.suit ?? ''}`;
}

// Hover-inspect text. Facts are taken straight from the engine's effect
// semantics (types.ts SpellEffectKey + reducer flip table + the M3 canon
// corrections) — presentation only, never a source of rules.
const FLIP_TEXT: Record<string, string> = {
  A: 'power becomes 11 until end of turn',
  '2': "flip any monster's battle position (a face-down flips up)",
  '3': "reveal the opponent's hand",
  '4': 'draw 1 card',
  '5': 'mill 2 from the opponent deck',
  '6': 'return any monster to its hand',
  '7': 'opponent discards 1 at random',
  '8': 'destroy every attack-position monster (both sides)',
  '9': 'no flip effect',
  '10': 'no flip effect',
};
const RANK_SPELL: Record<string, string> = {
  J: 'destroy any one monster',
  Q: 'discard a number card → your monster +its value (this turn)',
  K: 'discard a number card → enemy monster −its value (permanent)',
};
const SUIT_SPELL: Record<string, string> = {
  '♠': 'negate a card/effect on the stack',
  '♥': 'revive a monster from either graveyard (no flip effect)',
  '♣': 'destroy a set spell/trap',
  '♦': 'Polymerization — blackjack-fuse one of your monsters',
};

export function cardTooltip(f: CardFace): string {
  if (f.rank === 'JOKER') return 'Joker — draw 2 (Pot of Greed). Never bankable.';
  const isNumber = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(f.rank);
  if (isNumber) {
    const power = f.rank === 'A' ? 1 : Number(f.rank);
    const cost = power >= 8 ? 2 : power >= 5 ? 1 : 0;
    const costNote = cost === 0 ? 'no tribute' : `${cost} tribute`;
    return `${faceLabel(f)} — monster · power ${power} · ${costNote}. Flip: ${FLIP_TEXT[f.rank]}.`;
  }
  return `${faceLabel(f)} — spell. Rank(${f.rank}): ${RANK_SPELL[f.rank]}. Suit(${f.suit ?? ''}): ${f.suit ? SUIT_SPELL[f.suit] : ''}.`;
}
