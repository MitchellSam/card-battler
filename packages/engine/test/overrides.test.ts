// M4 A2: per-player config overlay (asymmetric rules). Default-absent overlay
// must be byte-identical to today's behaviour; every listed asymmetry gets a
// test; overrides serialize, replay deterministically, and are PUBLIC in views.

import { describe, expect, it } from 'vitest';
import { cfg, cfgFor } from '../src/config.js';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { createRng } from '../src/rng.js';
import { deserialize, serialize } from '../src/serialize.js';
import { setupGame } from '../src/setup.js';
import { DEFAULT_CONFIG } from '../src/types.js';
import { viewFor } from '../src/view.js';
import { card, fillerDeck, makeState, run, rng0 } from './helpers.js';

describe('per-player config overlay', () => {
  it('cfg/cfgFor: override wins for its seat only; absent overlay = shared value', () => {
    const config = { ...DEFAULT_CONFIG, overrides: [{ drawPerTurn: 3 }, null] as [{ drawPerTurn: number }, null] };
    expect(cfgFor(config, 0, 'drawPerTurn')).toBe(3);
    expect(cfgFor(config, 1, 'drawPerTurn')).toBe(2);
    expect(cfgFor(DEFAULT_CONFIG, 0, 'drawPerTurn')).toBe(2);
    expect(cfgFor(config, 0, 'ante')).toBe(0); // untouched fields fall through
  });

  it('asymmetric draw (3 vs 2): the overridden seat draws 3 at its draw phase', () => {
    const state = makeState({
      turn: 4,
      activePlayer: 0,
      config: { overrides: [null, { drawPerTurn: 3 }] },
      p0: { deck: fillerDeck(0, 10) },
      p1: { deck: fillerDeck(1, 10) },
    });
    // p0 ends its turn; p1's turn starts and draws per ITS override.
    const r = run(
      state,
      rng0(),
      { type: 'nextPhase', player: 0 }, // → battle
      { type: 'nextPhase', player: 0 }, // → main2
      { type: 'nextPhase', player: 0 }, // → end → turn rollover
    );
    expect(r.state.activePlayer).toBe(1);
    expect(r.state.players[1].hand).toHaveLength(3);
    expect(cfg(r.state, 0, 'drawPerTurn')).toBe(2);
  });

  it('asymmetric ante (8 vs 5): banks fill per-seat after setup', () => {
    const { state } = setupGame(createRng(7), {
      config: { ante: 5, overrides: [{ ante: 8 }, null] },
      skipMulligan: true,
    });
    expect(state.players[0].bank).toHaveLength(8);
    expect(state.players[1].bank).toHaveLength(5);
  });

  it('zone-width asymmetry: monster zone arrays differ per seat', () => {
    const { state } = setupGame(createRng(7), {
      config: { overrides: [{ monsterZones: 6 }, null] },
      skipMulligan: true,
    });
    expect(state.players[0].monsters).toHaveLength(6);
    expect(state.players[1].monsters).toHaveLength(5);
  });

  it('asymmetric starting hand (6 vs 5)', () => {
    const { state } = setupGame(createRng(7), {
      config: { overrides: [{ startingHand: 6 }, null] },
      skipMulligan: true,
    });
    expect(state.players[0].hand).toHaveLength(6);
    expect(state.players[1].hand).toHaveLength(5);
  });

  it('asymmetric hand limit: overridden seat keeps 8 cards through the end phase', () => {
    const eightCards = () => Array.from({ length: 8 }, (_, i) => card(0, '3', '♣', `h${i}`));
    const base = {
      turn: 4,
      activePlayer: 0 as const,
      p0: { hand: eightCards(), deck: fillerDeck(0, 10) },
      p1: { deck: fillerDeck(1, 10) },
    };
    // Without the override: end phase demands discards down to 6.
    const noOv = run(
      makeState(base),
      rng0(),
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
    );
    expect(noOv.state.pending).toEqual({ type: 'discard', player: 0 });
    // With handLimit 8 for seat 0: turn ends with no discard.
    const ov = run(
      makeState({ ...base, config: { overrides: [{ handLimit: 8 }, null] } }),
      rng0(),
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
    );
    expect(ov.state.pending).toBeNull();
    expect(ov.state.activePlayer).toBe(1);
    expect(ov.state.players[0].hand).toHaveLength(8);
  });

  it('overrides serialize round-trip', () => {
    const { state } = setupGame(createRng(3), {
      config: { ante: 5, overrides: [null, { drawPerTurn: 3, ante: 8 }] },
      skipMulligan: true,
    });
    const back = deserialize(serialize(state));
    expect(back).toEqual(state);
    expect(back.config.overrides).toEqual([null, { drawPerTurn: 3, ante: 8 }]);
  });

  it('viewFor exposes both sides’ overrides to BOTH seats (boss cheats are visible)', () => {
    const { state } = setupGame(createRng(3), {
      config: { overrides: [null, { drawPerTurn: 3 }] },
      skipMulligan: true,
    });
    expect(viewFor(state, 0).overrides).toEqual([null, { drawPerTurn: 3 }]);
    expect(viewFor(state, 1).overrides).toEqual([null, { drawPerTurn: 3 }]);
    // absent overlay → absent in the view too
    const plain = setupGame(createRng(3), { skipMulligan: true }).state;
    expect(viewFor(plain, 0).overrides).toBeUndefined();
  });

  it('sim determinism with overrides set: same seed ⇒ identical full game', () => {
    const play = () => {
      const rng = createRng(11);
      const pick = createRng(11 * 7919);
      let state = setupGame(rng, {
        config: { ante: 5, overrides: [{ drawPerTurn: 3 }, { ante: 8 }] },
      }).state;
      let steps = 0;
      while (state.phase !== 'gameOver') {
        if (++steps > 30000) throw new Error('did not terminate');
        const acts = [...legalActions(state, 0), ...legalActions(state, 1)];
        expect(acts.length).toBeGreaterThan(0);
        state = applyAction(state, acts[pick.int(acts.length)]!, rng).state;
      }
      return serialize(state);
    };
    expect(play()).toBe(play());
  }, 30000);
});

describe('viewFor exposes the full config (rules are public)', () => {
  it('both seats see the same live RulesConfig, overrides included', () => {
    const config = { ...DEFAULT_CONFIG, overrides: [{ drawPerTurn: 3 }, null] as [{ drawPerTurn: number }, null] };
    const { state } = setupGame(createRng(7), { config });
    for (const seat of [0, 1] as const) {
      const v = viewFor(state, seat);
      expect(v.config).toEqual(config);
      expect(cfgFor(v.config, 0, 'drawPerTurn')).toBe(3);
      expect(cfgFor(v.config, 1, 'drawPerTurn')).toBe(2);
    }
  });
});
