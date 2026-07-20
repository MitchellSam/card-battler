// M4 drift test (exit criterion 3): the tooltip path resolves a stickered
// card to the STICKER's engine-owned text, never a default table.

import { describe, expect, it } from 'vitest';
import { describeEffect, getEffectSpec, type GameCard } from '@house-rules/engine';
import { cardTooltip } from '../src/ui/cardFace.js';

const gc = (rank: GameCard['rank'], suit: GameCard['suit'], stickers: string[] = []): GameCard => ({
  id: `0:${rank}${suit ?? ''}`,
  owner: 0,
  rank,
  suit,
  stickerStack: stickers,
});

describe('cardTooltip (drift fix)', () => {
  it('unstickered cards show the engine default text', () => {
    expect(cardTooltip(gc('5', '♠'))).toContain(describeEffect('default:5').text);
    const k = cardTooltip(gc('K', '♥'));
    expect(k).toContain(describeEffect('default:K').text);
    expect(k).toContain(describeEffect('default:♥').text);
  });

  it("a flip sticker replaces the default flip text with the sticker's", () => {
    const tip = cardTooltip(gc('5', '♠', ['peek']));
    expect(tip).toContain(getEffectSpec('peek')!.text);
    expect(tip).toContain('[Peek]');
    expect(tip).not.toContain(describeEffect('default:5').text);
  });

  it('a rank sticker covers only the rank slot; the suit text stays default', () => {
    const tip = cardTooltip(gc('Q', '♦', ['leverage']));
    expect(tip).toContain(getEffectSpec('leverage')!.text);
    expect(tip).not.toContain(describeEffect('default:Q').text);
    expect(tip).toContain(describeEffect('default:♦').text); // Polymerization untouched
  });

  it("a Cheat Sheet suit sticker shows in the OWNER's suit line (no drift)", () => {
    const overrides: [Record<'♦', string>, null] = [{ '♦': 'skim' }, null];
    const tip = cardTooltip(gc('Q', '♦'), overrides);
    expect(tip).toContain('sheet sticker');
    expect(tip).toContain(getEffectSpec('skim')!.text);
    expect(tip).not.toContain(describeEffect('default:♦').text); // Poly is covered
    // a different suit on the same sheet keeps its printed rule
    const other = cardTooltip(gc('K', '♥'), overrides);
    expect(other).toContain(describeEffect('default:♥').text);
    // and the opponent's card is unaffected by YOUR sheet
    const theirs = cardTooltip({ ...gc('Q', '♦'), owner: 1 }, overrides);
    expect(theirs).toContain(describeEffect('default:♦').text);
  });
});
