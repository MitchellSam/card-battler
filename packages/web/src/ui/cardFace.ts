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
