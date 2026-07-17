import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/reducer.js';
import { card, makeState, mon, rng0, run, types } from './helpers.js';
import type { GameCard, GameState, Rank } from '../src/types.js';

// M2.5 §5: the blackjack total starts at the TARGET's card value; the target
// is not drawn or milled. Hits then come from the deck as normal.
function castPoly(
  deck: GameCard[],
  targetRank: Rank = '4',
  extra: Parameters<typeof makeState>[0] = {},
): GameState {
  const s = makeState({
    p0: {
      hand: [card(0, 'J', '♦')],
      monsters: [mon(card(0, targetRank, '♠'), 'attack', 1, { summonedTurn: 3 })],
      deck,
    },
    ...extra,
  });
  const r = run(
    s,
    rng0(),
    { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'suit', targetMonsterUid: 1 },
    { type: 'pass', player: 0 },
    { type: 'pass', player: 1 },
  );
  return r.state;
}

describe('Polymerization (♦) — M2.5 §5/§7 rules', () => {
  it('total starts at the target card value; no cards are auto-dealt', () => {
    const s = castPoly([card(0, '10', '♥')], '4');
    expect(s.poly?.total).toBe(4); // target 4♠, nothing drawn
    expect(s.players[0].deck).toHaveLength(1); // deck untouched
    expect(s.pending).toEqual({ type: 'polyHitStand', player: 0 });
  });

  it('STAND sets power to ceil(total/2) permanently', () => {
    let s = castPoly([card(0, '10', '♥'), card(0, '5', '♥')], '4');
    s = applyAction(s, { type: 'polyHit', player: 0 }, rng0()).state; // 4 + 10 = 14
    expect(s.poly?.total).toBe(14);
    s = applyAction(s, { type: 'polyStand', player: 0 }, rng0()).state;
    expect(s.poly).toBeNull();
    expect(s.players[0].monsters[0]?.power).toBe(7); // ceil(14/2)
    // the drawn card + the spell are in the caster's graveyard; target stayed put
    expect(s.players[0].graveyard.map((c) => c.id)).toEqual(['0:J♦', '0:10♥']);
    expect(s.players[0].deck).toHaveLength(1);
  });

  it('exact 21 gives power 11', () => {
    let s = castPoly([card(0, '10', '♥'), card(0, '7', '♥')], '4');
    s = applyAction(s, { type: 'polyHit', player: 0 }, rng0()).state; // 14
    s = applyAction(s, { type: 'polyHit', player: 0 }, rng0()).state; // 21
    expect(s.poly?.total).toBe(21);
    s = applyAction(s, { type: 'polyStand', player: 0 }, rng0()).state;
    expect(s.players[0].monsters[0]?.power).toBe(11);
  });

  it('BUST destroys the target monster', () => {
    let s = castPoly([card(0, '10', '♥'), card(0, '9', '♥')], '4');
    s = applyAction(s, { type: 'polyHit', player: 0 }, rng0()).state; // 14
    const r = applyAction(s, { type: 'polyHit', player: 0 }, rng0()); // 23
    expect(types(r.events)).toContain('PolyBust');
    expect(r.state.poly).toBeNull();
    expect(r.state.players[0].monsters[0]).toBeNull();
    expect(r.state.players[0].graveyard.map((c) => c.id)).toContain('0:9♥');
  });

  it('an ACE TARGET asks the caster for 1 or 11 when Poly begins (M2.5 §5)', () => {
    const s = castPoly([card(0, '10', '♥')], 'A');
    expect(s.pending).toEqual({ type: 'polyAce', player: 0 });
    expect(s.poly?.total).toBe(0); // undecided until the choice
    const r = applyAction(s, { type: 'polyAce', player: 0, value: 11 }, rng0());
    expect(r.state.poly?.total).toBe(11);
    expect(r.state.pending).toEqual({ type: 'polyHitStand', player: 0 });
    expect(r.state.players[0].deck).toHaveLength(1); // still nothing drawn
  });

  it('a drawn Ace asks the caster for 1 or 11, at draw time, irrevocably', () => {
    let s = castPoly([card(0, 'A', '♥'), card(0, '9', '♥')], '4');
    s = applyAction(s, { type: 'polyHit', player: 0 }, rng0()).state;
    expect(s.pending).toEqual({ type: 'polyAce', player: 0 });
    s = applyAction(s, { type: 'polyAce', player: 0, value: 11 }, rng0()).state;
    expect(s.poly?.total).toBe(15); // 4 + 11
    expect(s.pending).toEqual({ type: 'polyHitStand', player: 0 });
  });

  it('face cards count 10 in blackjack', () => {
    let s = castPoly([card(0, 'K', '♥')], '4');
    s = applyAction(s, { type: 'polyHit', player: 0 }, rng0()).state;
    expect(s.poly?.total).toBe(14);
  });

  it('a drawn Joker is shuffled back and the hit redrawn (M2.5 §7)', () => {
    // Non-joker cards all rank 5, so the redraw's value is deterministic
    // regardless of the reshuffle order.
    let s = castPoly([card(0, 'JOKER', null, '1'), card(0, '5', '♥'), card(0, '5', '♣')], '4');
    const r = applyAction(s, { type: 'polyHit', player: 0 }, rng0());
    expect(types(r.events)).toContain('PolyJokerReshuffled');
    expect(r.state.poly?.total).toBe(9); // 4 + 5
    // the joker is back in the deck, not in the graveyard
    const deckRanks = r.state.players[0].deck.map((c) => c.rank);
    expect(deckRanks).toContain('JOKER');
    expect(r.state.players[0].graveyard.some((c) => c.rank === 'JOKER')).toBe(false);
  });

  it('deck with only Jokers left: the hit fails and forces a STAND', () => {
    let s = castPoly([card(0, 'JOKER', null, '1')], '4');
    const r = applyAction(s, { type: 'polyHit', player: 0 }, rng0());
    expect(types(r.events)).toContain('PolyStand'); // forced stand on 4
    expect(r.state.players[0].monsters[0]?.power).toBe(2); // ceil(4/2)
    expect(r.state.players[0].deck.map((c) => c.rank)).toEqual(['JOKER']);
    expect(r.state.phase).not.toBe('gameOver'); // deck-out only ends games at a draw phase
  });

  it('hitting into an empty deck forces a STAND; the game does NOT end mid-turn (M2.5 §2)', () => {
    let s = castPoly([], '4');
    const r = applyAction(s, { type: 'polyHit', player: 0 }, rng0());
    expect(types(r.events)).toContain('PolyStand'); // forced stand, total 4
    expect(r.state.players[0].monsters[0]?.power).toBe(2);
    expect(r.state.phase).not.toBe('gameOver'); // play continues until the next draw phase
  });

  it('targets only your own face-up monster', () => {
    const s = makeState({
      p0: { hand: [card(0, 'J', '♦')], monsters: [mon(card(0, '4', '♠'), 'set', 1)] },
      p1: { monsters: [mon(card(1, '6', '♦'), 'attack', 2)] },
    });
    expect(() =>
      applyAction(s, { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'suit', targetMonsterUid: 1 }, rng0()),
    ).toThrow(/face-up/);
    expect(() =>
      applyAction(s, { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'suit', targetMonsterUid: 2 }, rng0()),
    ).toThrow(/you control/);
  });
});
