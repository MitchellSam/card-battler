// bankTriggerScaling (2026-07 experiment knob): a combat bank trigger grants
// a card count banded by EFFECTIVE POWER at trigger time — 1-4 → 1, 5-7 → 2,
// 8+ → 3. 'power' bands the winner's own power; 'margin' bands the winner-minus-
// loser difference (full attacker power on a direct hit).

import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/reducer.js';
import { card, makeState, mon, resolveStack, rng0 } from './helpers.js';
import type { Action, PlayerId } from '../src/types.js';

const attack = (player: PlayerId, attackerZone: number, targetZone?: number, direct = false): Action =>
  direct
    ? { type: 'declareAttack', player, attackerZone, direct: true }
    : { type: 'declareAttack', player, attackerZone, targetZone };
const bank = (player: PlayerId, handIndex: number): Action => ({
  type: 'bankChoice',
  player,
  choice: 'bank',
  handIndex,
});
const fatHand = (owner: PlayerId) => [
  card(owner, 'K', '♥'),
  card(owner, 'Q', '♦'),
  card(owner, '9', '♣'),
  card(owner, '8', '♥'),
];

describe('bankTriggerScaling', () => {
  it("'off' grants exactly one choice regardless of power", () => {
    const s = makeState({
      phase: 'battle',
      config: { bankTriggerScaling: 'off' },
      p0: { monsters: [mon(card(0, '10', '♠'), 'attack', 1)], hand: fatHand(0) },
      p1: { monsters: [mon(card(1, '2', '♥'), 'attack', 2)] },
    });
    let r = resolveStack(applyAction(s, attack(0, 0, 0), rng0()).state, rng0());
    expect(r.state.pending).toMatchObject({ type: 'bankTrigger', player: 0, remaining: 1 });
    r = applyAction(r.state, bank(0, 0), rng0());
    expect(r.state.pending).toBeNull();
  });

  describe("'power' — bands the winner's own effective power", () => {
    const run = (config: 'power', p0mon: ReturnType<typeof mon>, p1mon: ReturnType<typeof mon>) => {
      const s = makeState({
        phase: 'battle',
        config: { bankTriggerScaling: config },
        p0: { monsters: [p0mon], hand: fatHand(0) },
        p1: { monsters: [p1mon] },
      });
      return resolveStack(applyAction(s, attack(0, 0, 0), rng0()).state, rng0()).state;
    };

    it('power 7 (5-7 tier) grants 2', () => {
      const st = run('power', mon(card(0, '7', '♠'), 'attack', 1), mon(card(1, '6', '♥'), 'attack', 2));
      expect(st.pending).toMatchObject({ remaining: 2 });
    });

    it('power 10 (8+ tier) grants 3', () => {
      const st = run('power', mon(card(0, '10', '♠'), 'attack', 1), mon(card(1, '5', '♥'), 'attack', 2));
      expect(st.pending).toMatchObject({ remaining: 3 });
    });

    it('an Ace scores by its power at trigger time: 1 → one card, 11 → three (direct hits)', () => {
      const ace = (power: number) =>
        makeState({
          phase: 'battle',
          config: { bankTriggerScaling: 'power' },
          p0: { monsters: [mon(card(0, 'A', '♠'), 'attack', 1, { power, summonedTurn: 1 })], hand: fatHand(0) },
        });
      const at1 = resolveStack(applyAction(ace(1), attack(0, 0, undefined, true), rng0()).state, rng0()).state;
      expect(at1.pending).toMatchObject({ remaining: 1 });
      const at11 = resolveStack(applyAction(ace(11), attack(0, 0, undefined, true), rng0()).state, rng0()).state;
      expect(at11.pending).toMatchObject({ remaining: 3 });
    });
  });

  describe("'margin' — bands the winner-minus-loser power difference", () => {
    const combat = (p0mon: ReturnType<typeof mon>, p1mon: ReturnType<typeof mon>) => {
      const s = makeState({
        phase: 'battle',
        config: { bankTriggerScaling: 'margin' },
        p0: { monsters: [p0mon], hand: fatHand(0) },
        p1: { monsters: [p1mon] },
      });
      return resolveStack(applyAction(s, attack(0, 0, 0), rng0()).state, rng0()).state;
    };

    it('a blowout (10 beats 2, margin 8) grants 3', () => {
      const st = combat(mon(card(0, '10', '♠'), 'attack', 1), mon(card(1, '2', '♥'), 'attack', 2));
      expect(st.pending).toMatchObject({ remaining: 3 });
    });

    it('a narrow win (10 beats 9, margin 1) grants only 1 — unlike power mode', () => {
      const st = combat(mon(card(0, '10', '♠'), 'attack', 1), mon(card(1, '9', '♥'), 'attack', 2));
      expect(st.pending).toMatchObject({ remaining: 1 });
    });

    it('a direct hit lands full power (8 → 3), no subtraction', () => {
      const s = makeState({
        phase: 'battle',
        config: { bankTriggerScaling: 'margin' },
        p0: { monsters: [mon(card(0, '8', '♠'), 'attack', 1, { summonedTurn: 1 })], hand: fatHand(0) },
      });
      const st = resolveStack(applyAction(s, attack(0, 0, undefined, true), rng0()).state, rng0()).state;
      expect(st.pending).toMatchObject({ remaining: 3 });
    });
  });

  it("'margin' is the ratified default — no config override needed", () => {
    // 10 beats 2 → margin 8 → 3 grants, straight from DEFAULT_CONFIG.
    const s = makeState({
      phase: 'battle',
      p0: { monsters: [mon(card(0, '10', '♠'), 'attack', 1)], hand: fatHand(0) },
      p1: { monsters: [mon(card(1, '2', '♥'), 'attack', 2)] },
    });
    const st = resolveStack(applyAction(s, attack(0, 0, 0), rng0()).state, rng0()).state;
    expect(st.pending).toMatchObject({ type: 'bankTrigger', remaining: 3 });
  });

  it('a scaled trigger ends early when the winner runs out of cards to bank/remove', () => {
    const s = makeState({
      phase: 'battle',
      config: { bankTriggerScaling: 'power' },
      p0: { monsters: [mon(card(0, '9', '♠'), 'attack', 1)], hand: [card(0, 'K', '♥')] }, // 1 bankable
      p1: { monsters: [mon(card(1, '4', '♥'), 'attack', 2)] },
    });
    let r = resolveStack(applyAction(s, attack(0, 0, 0), rng0()).state, rng0());
    expect(r.state.pending).toMatchObject({ remaining: 3 }); // power 9 → 3
    r = applyAction(r.state, bank(0, 0), rng0());
    expect(r.state.pending).toBeNull(); // nothing left to bank or remove
    expect(r.state.players[0].bank).toHaveLength(1);
  });
});
