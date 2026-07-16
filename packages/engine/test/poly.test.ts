import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/reducer.js';
import { card, makeState, mon, resolveStack, rng0, run, types } from './helpers.js';
import type { GameCard, GameState } from '../src/types.js';

function castPoly(deck: GameCard[], extra: Parameters<typeof makeState>[0] = {}): GameState {
  const s = makeState({
    p0: {
      hand: [card(0, 'J', '♦')],
      monsters: [mon(card(0, '4', '♠'), 'attack', 1, { summonedTurn: 3 })],
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

describe('Polymerization (♦)', () => {
  it('auto-deals 2, then STAND sets power to ceil(total/2) permanently', () => {
    let s = castPoly([card(0, '10', '♥'), card(0, '9', '♥'), card(0, '5', '♥')]);
    expect(s.poly?.total).toBe(19);
    expect(s.pending).toEqual({ type: 'polyHitStand', player: 0 });
    s = applyAction(s, { type: 'polyStand', player: 0 }, rng0()).state;
    expect(s.poly).toBeNull();
    expect(s.players[0].monsters[0]?.power).toBe(10); // ceil(19/2)
    // all drawn cards + the spell are in the caster's graveyard
    expect(s.players[0].graveyard.map((c) => c.id)).toEqual(['0:J♦', '0:10♥', '0:9♥']);
    expect(s.players[0].deck).toHaveLength(1);
  });

  it('exact 21 gives power 11', () => {
    let s = castPoly([card(0, '10', '♥'), card(0, '8', '♥'), card(0, '3', '♥')]);
    s = applyAction(s, { type: 'polyHit', player: 0 }, rng0()).state; // 18 + 3 = 21
    expect(s.poly?.total).toBe(21);
    s = applyAction(s, { type: 'polyStand', player: 0 }, rng0()).state;
    expect(s.players[0].monsters[0]?.power).toBe(11);
  });

  it('BUST destroys the target monster', () => {
    let s = castPoly([card(0, '10', '♥'), card(0, '9', '♥'), card(0, '5', '♥')]);
    const r = applyAction(s, { type: 'polyHit', player: 0 }, rng0()); // 19 + 5 = 24
    expect(types(r.events)).toContain('PolyBust');
    expect(r.state.poly).toBeNull();
    expect(r.state.players[0].monsters[0]).toBeNull();
    // drawn cards still go to the graveyard
    expect(r.state.players[0].graveyard.map((c) => c.id)).toContain('0:5♥');
  });

  it('a drawn Ace asks the caster for 1 or 11, at draw time, irrevocably', () => {
    let s = castPoly([card(0, 'A', '♥'), card(0, '9', '♥'), card(0, '2', '♥')]);
    expect(s.pending).toEqual({ type: 'polyAce', player: 0 });
    s = applyAction(s, { type: 'polyAce', player: 0, value: 11 }, rng0()).state;
    expect(s.poly?.total).toBe(20); // 11 + 9
    expect(s.pending).toEqual({ type: 'polyHitStand', player: 0 });
    s = applyAction(s, { type: 'polyStand', player: 0 }, rng0()).state;
    expect(s.players[0].monsters[0]?.power).toBe(10);
  });

  it('face cards count 10 in blackjack', () => {
    let s = castPoly([card(0, 'K', '♥'), card(0, 'Q', '♥'), card(0, '5', '♥')]);
    expect(s.poly?.total).toBe(20);
  });

  it('poly self-mill can run the deck out; game ends after the mini-game finishes', () => {
    let s = castPoly([card(0, '10', '♥'), card(0, '9', '♥')]);
    // deck had exactly the 2 dealt cards → deck-out flagged, but the mini-game finishes first
    expect(s.deckOut).toBe(true);
    expect(s.phase).not.toBe('gameOver');
    expect(s.pending).toEqual({ type: 'polyHitStand', player: 0 });
    s = applyAction(s, { type: 'polyStand', player: 0 }, rng0()).state;
    expect(s.phase).toBe('gameOver');
  });

  it('hitting into an empty deck forces a STAND on the current total', () => {
    let s = castPoly([card(0, '10', '♥'), card(0, '9', '♥')]);
    const r = applyAction(s, { type: 'polyHit', player: 0 }, rng0());
    expect(types(r.events)).toContain('PolyStand'); // forced stand, total 19
    expect(r.state.players[0].monsters[0]?.power).toBe(10);
    expect(r.state.phase).toBe('gameOver'); // deck-out clock fired once poly ended
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
