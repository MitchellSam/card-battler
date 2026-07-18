import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/reducer.js';
import { createRng } from '../src/rng.js';
import { deserialize, serialize } from '../src/serialize.js';
import { setupGame } from '../src/setup.js';
import { viewFor } from '../src/view.js';
import { card, makeState, mon, run } from './helpers.js';

describe('setup', () => {
  it('deals 5 from a 54-card deck to each player', () => {
    const { state } = setupGame(createRng(1));
    for (const p of [0, 1] as const) {
      expect(state.players[p].hand).toHaveLength(5);
      expect(state.players[p].deck).toHaveLength(49);
    }
    expect(state.phase).toBe('mulligan');
  });

  it('is deterministic for the same seed and differs across seeds', () => {
    const a = setupGame(createRng(7)).state;
    const b = setupGame(createRng(7)).state;
    const c = setupGame(createRng(8)).state;
    expect(serialize(a)).toBe(serialize(b));
    expect(serialize(a)).not.toBe(serialize(c));
  });

  it('mulligan shuffles discards back and redraws the same count', () => {
    const rng = createRng(3);
    const { state } = setupGame(rng, { firstPlayer: 0 });
    const before = state.players[0].hand.map((c) => c.id);
    const r = applyAction(state, { type: 'mulligan', player: 0, discardHandIndices: [0, 2] }, rng);
    expect(r.state.players[0].hand).toHaveLength(5);
    expect(r.state.players[0].deck).toHaveLength(49);
    expect(r.state.players[0].mulliganed).toBe(true);
    // untouched cards stay in hand
    expect(r.state.players[0].hand.map((c) => c.id)).toContain(before[1]);
    // cannot mulligan twice
    expect(() =>
      applyAction(r.state, { type: 'mulligan', player: 0, discardHandIndices: [] }, rng),
    ).toThrow();
  });

  it('first player skips their first draw: turn 1 starts after both mulligans with no draw', () => {
    const rng = createRng(3);
    const { state } = setupGame(rng, { firstPlayer: 0 });
    const r = run(
      state,
      rng,
      { type: 'mulligan', player: 0, discardHandIndices: [] },
      { type: 'mulligan', player: 1, discardHandIndices: [] },
    );
    expect(r.state.phase).toBe('main1');
    expect(r.state.activePlayer).toBe(0);
    expect(r.state.players[0].hand).toHaveLength(5); // no draw for first player
    expect(r.state.players[0].deck).toHaveLength(49);
  });
});

describe('serialization', () => {
  it('round-trips a fresh game and a mid-game state', () => {
    const { state } = setupGame(createRng(11));
    expect(deserialize(serialize(state))).toEqual(state);

    const mid = makeState({
      p0: { hand: [card(0, '7', '♥')], monsters: [mon(card(0, '9', '♠'), 'attack', 1)] },
      p1: { bank: [card(1, 'K', '♦')] },
    });
    expect(deserialize(serialize(mid))).toEqual(mid);
  });

  it('round-trips mid-game with a populated stack and pending decision, and play continues identically', () => {
    const rng = createRng(5);
    // a spell on the stack…
    const s1 = makeState({
      p0: { hand: [card(0, 'J', '♥')] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] },
    });
    const withStack = applyAction(
      s1,
      { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1 },
      rng,
    ).state;
    expect(withStack.stack).toHaveLength(1);
    expect(serialize(deserialize(serialize(withStack)))).toBe(serialize(withStack));
    // …continues identically after a round-trip
    const cont = (st: typeof withStack) =>
      run(st, createRng(9), { type: 'pass', player: 0 }, { type: 'pass', player: 1 }).state;
    expect(serialize(cont(deserialize(serialize(withStack))))).toBe(serialize(cont(withStack)));

    // …and with a pending decision mid-combat (flip target choice)
    const s2 = makeState({
      phase: 'battle',
      p0: { monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '2', '♦'), 'set', 2)] },
    });
    const r = run(
      s2,
      createRng(6),
      { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
      // Ratified (2026-07): the attacked 2's flip is offered first; activate it
      // to reach the flipTarget decision this round-trips.
      { type: 'flipChoice', player: 1, choice: 'activate' },
    ).state;
    expect(r.pending?.type).toBe('flipTarget');
    expect(r.stack.length).toBeGreaterThan(0);
    expect(deserialize(serialize(r))).toEqual(r);
  });

  it('rejects garbage', () => {
    expect(() => deserialize('{"nope":true}')).toThrow();
  });
});

describe('viewFor redaction', () => {
  it('hides opponent hand, both deck orders, and face-down identities', () => {
    const s = makeState({
      p0: {
        hand: [card(0, '7', '♥'), card(0, 'J', '♠')],
        monsters: [mon(card(0, '9', '♠'), 'set', 1)],
        spellTraps: [{ card: card(0, 'Q', '♣'), setTurn: 1 }],
      },
      p1: { hand: [card(1, '2', '♦')] },
    });
    const v0 = viewFor(s, 0);
    const v1 = viewFor(s, 1);
    // own hidden info visible to self
    expect(v0.you.hand).toHaveLength(2);
    expect(v0.you.monsters[0]?.card?.id).toBe('0:9♠');
    expect(v0.you.spellTraps[0]?.card?.id).toBe('0:Q♣');
    // opponent sees counts and masks only
    expect(v1.opponent.hand).toBeUndefined();
    expect(v1.opponent.handCount).toBe(2);
    expect(v1.opponent.monsters[0]?.card).toBeNull();
    expect(v1.opponent.monsters[0]?.power).toBeNull();
    expect(v1.opponent.spellTraps[0]?.card).toBeNull();
    // deck orders never exposed, only counts
    expect((v0.you as unknown as Record<string, unknown>)['deck']).toBeUndefined();
    expect(v0.you.deckCount).toBe(8);
    expect(JSON.stringify(v1.opponent)).not.toContain('"deck":');
  });
});
