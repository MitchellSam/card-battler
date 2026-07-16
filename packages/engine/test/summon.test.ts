import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/reducer.js';
import { card, makeState, mon, rng0 } from './helpers.js';

describe('summoning & positions', () => {
  it('normal summons a small monster in attack or set, once per turn', () => {
    const s = makeState({ p0: { hand: [card(0, '4', '♠'), card(0, '3', '♥')] } });
    let r = applyAction(
      s,
      { type: 'summon', player: 0, handIndex: 0, zoneIndex: 2, mode: 'attack' },
      rng0(),
    );
    const m = r.state.players[0].monsters[2];
    expect(m?.position).toBe('attack');
    expect(m?.power).toBe(4);
    expect(r.state.normalSummonUsed).toBe(true);
    expect(() =>
      applyAction(
        r.state,
        { type: 'summon', player: 0, handIndex: 0, zoneIndex: 3, mode: 'set' },
        rng0(),
      ),
    ).toThrow(/normal summon/);
  });

  it('sets face-down defense with setTurn recorded', () => {
    const s = makeState({ turn: 4, p0: { hand: [card(0, '4', '♦')] } });
    const r = applyAction(
      s,
      { type: 'summon', player: 0, handIndex: 0, zoneIndex: 0, mode: 'set' },
      rng0(),
    );
    const m = r.state.players[0].monsters[0];
    expect(m?.position).toBe('set');
    expect(m?.setTurn).toBe(4);
  });

  it('requires 1 sacrifice for 5-7 and 2 for 8-10; sacrifices go to the graveyard without flips', () => {
    const base = makeState({
      p0: {
        hand: [card(0, '6', '♠'), card(0, '10', '♥')],
        monsters: [mon(card(0, '2', '♦'), 'set', 1), mon(card(0, '3', '♦'), 'attack', 2)],
      },
    });
    // no sacrifice → illegal
    expect(() =>
      applyAction(base, { type: 'summon', player: 0, handIndex: 0, zoneIndex: 2, mode: 'attack' }, rng0()),
    ).toThrow(/sacrifice/);
    // 6 with 1 sacrifice (a SET monster: no flip trigger)
    let r = applyAction(
      base,
      { type: 'summon', player: 0, handIndex: 0, zoneIndex: 2, mode: 'attack', sacrificeZoneIndices: [0] },
      rng0(),
    );
    expect(r.state.players[0].monsters[2]?.power).toBe(6);
    expect(r.state.players[0].graveyard.map((c) => c.id)).toEqual(['0:2♦']);
    expect(r.state.stack).toHaveLength(0); // no flip effect from the sacrificed set monster
    // 10 needs two sacrifices
    expect(() =>
      applyAction(base, { type: 'summon', player: 0, handIndex: 1, zoneIndex: 2, mode: 'attack', sacrificeZoneIndices: [0] }, rng0()),
    ).toThrow(/sacrifice/);
    const r2 = applyAction(
      base,
      { type: 'summon', player: 0, handIndex: 1, zoneIndex: 0, mode: 'attack', sacrificeZoneIndices: [0, 1] },
      rng0(),
    );
    // may summon into a zone freed by its own sacrifice
    expect(r2.state.players[0].monsters[0]?.power).toBe(10);
  });

  it('rejects occupied zones, non-monsters, and spells in monster zones', () => {
    const s = makeState({
      p0: { hand: [card(0, 'J', '♠'), card(0, '4', '♣')], monsters: [mon(card(0, '5', '♠'), 'attack', 1)] },
    });
    expect(() =>
      applyAction(s, { type: 'summon', player: 0, handIndex: 0, zoneIndex: 1, mode: 'attack' }, rng0()),
    ).toThrow(/not a monster/);
    expect(() =>
      applyAction(s, { type: 'summon', player: 0, handIndex: 1, zoneIndex: 0, mode: 'attack' }, rng0()),
    ).toThrow(/occupied/);
  });

  it('manual position change: once per turn, not on summon turn, not after attacking', () => {
    const s = makeState({
      turn: 6,
      p0: {
        monsters: [
          mon(card(0, '7', '♠'), 'attack', 1, { summonedTurn: 6 }),
          mon(card(0, '5', '♠'), 'attack', 2, { attackedTurn: 6 }),
          mon(card(0, '4', '♠'), 'defense', 3),
        ],
      },
    });
    expect(() => applyAction(s, { type: 'changePosition', player: 0, zoneIndex: 0 }, rng0())).toThrow(
      /summoned/,
    );
    expect(() => applyAction(s, { type: 'changePosition', player: 0, zoneIndex: 1 }, rng0())).toThrow(
      /attacking/,
    );
    let r = applyAction(s, { type: 'changePosition', player: 0, zoneIndex: 2 }, rng0());
    expect(r.state.players[0].monsters[2]?.position).toBe('attack');
    expect(() =>
      applyAction(r.state, { type: 'changePosition', player: 0, zoneIndex: 2 }, rng0()),
    ).toThrow(/already changed/);
  });

  it('summons only in main phases with an empty stack', () => {
    const s = makeState({ phase: 'battle', p0: { hand: [card(0, '4', '♠')] } });
    expect(() =>
      applyAction(s, { type: 'summon', player: 0, handIndex: 0, zoneIndex: 0, mode: 'attack' }, rng0()),
    ).toThrow(/main phase/);
  });
});
