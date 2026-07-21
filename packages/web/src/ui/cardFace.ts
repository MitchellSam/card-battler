// Presentation helpers for card identity. Pure display parsing — never rules.
//
// Drift fix (REVISION 2): effect text comes from the ENGINE's registry
// (describeEffect over the card's EFFECTIVE effect id). Slotless model: a
// card's sticker covers its own effect (a number's flip / a face's rank
// spell); suit spells live on the Cheat Sheet, so the tooltip shows the
// PRINTED suit default and defers to the sheet.

import {
  describeEffect,
  effectiveCardEffect,
  effectiveSuitEffect,
  isNumberRank,
  monsterBasePower,
  sacrificeCost,
  type GameCard,
  type RulesConfig,
} from '@house-rules/engine';

export type SuitOverrides = RulesConfig['suitOverrides'];

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

/** Slot line: printed default plain, a covering sticker named in brackets. */
function slotLine(label: string, card: GameCard): string {
  const eff = effectiveCardEffect(card);
  const d = describeEffect(eff);
  return eff === `default:${card.rank}` ? `${label}: ${d.text}` : `${label} [${d.name}]: ${d.text}`;
}

/** Default effects read as plain rules text; a covering sticker leads with its name. */
function effectFragment(eff: string, isDefault: boolean): string {
  const d = describeEffect(eff);
  return isDefault ? d.text : `${d.name} — ${d.text}`;
}

/** Cast-button label fragment for a face card's RANK effect (sticker-aware). */
export function rankCastLabel(card: GameCard): string {
  const eff = effectiveCardEffect(card);
  return effectFragment(eff, eff === `default:${card.rank}`);
}

/** Cast-button label fragment for a card's SUIT effect (Cheat-Sheet-sticker-aware). */
export function suitCastLabel(card: GameCard, suitOverrides?: SuitOverrides): string {
  const eff = effectiveSuitEffect(suitOverrides, card.owner, card.suit!);
  return effectFragment(eff, eff === `default:${card.suit}`);
}

/** The Joker's rules text — engine-sourced, like every other effect. */
export function jokerText(): string {
  return describeEffect('default:JOKER').text;
}

/**
 * Hover-inspect text for a card, resolved through its EFFECTIVE effects.
 * `suitOverrides` is the duel's Cheat Sheet sticker state (view.suitOverrides)
 * — the suit line shows what the OWNER's cast would actually do, so a sheet
 * sticker can never drift out of the tooltip.
 */
export function cardTooltip(card: GameCard, suitOverrides?: SuitOverrides): string {
  if (card.rank === 'JOKER') {
    return `Joker — ${describeEffect('default:JOKER').text}`;
  }
  const label = faceLabel(faceOf(card));
  if (isNumberRank(card.rank)) {
    const power = monsterBasePower(card);
    const cost = sacrificeCost(card);
    const costNote = cost === 0 ? 'no tribute' : `${cost} tribute`;
    return `${label} — monster · power ${power} · ${costNote}. ${slotLine('Flip', card)}.`;
  }
  const suitEff = effectiveSuitEffect(suitOverrides, card.owner, card.suit!);
  const suitD = describeEffect(suitEff);
  const suitLine =
    suitEff === `default:${card.suit}`
      ? `Suit(${card.suit}) per the Cheat Sheet: ${suitD.text}`
      : `Suit(${card.suit}) [${suitD.name} — sheet sticker!]: ${suitD.text}`;
  return `${label} — spell. ${slotLine(`Rank(${card.rank})`, card)}. ${suitLine}.`;
}
