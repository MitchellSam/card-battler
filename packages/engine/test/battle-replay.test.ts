import { describe, expect, it } from 'vitest';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { card, makeState, mon, resolveStack, rng0, types } from './helpers.js';

// Attacker M0 (9♠) declares on target T (5♦); a set J (destroy) fires during the
// attack's response window, killing T, so the attack resolves into an empty
// target slot. With battleReplay on, the attacker gets a Battle Replay against
// the surviving bystander B (4♣); with it off, the attack fizzles (old rule).
function setup(config: Record<string, unknown> = {}) {
  return makeState({
    turn: 3,
    phase: 'battle',
    config,
    p0: {
      hand: [card(0, 'K', '♥')], // something to bank when the replayed attack wins
      monsters: [mon(card(0, '9', '♠'), 'attack', 1)],
      spellTraps: [{ card: card(0, 'J', '♦'), setTurn: 2 }],
    },
    p1: {
      monsters: [mon(card(1, '5', '♦'), 'attack', 2), mon(card(1, '4', '♣'), 'attack', 3)],
    },
  });
}

// Declare the attack on T, then activate the set J on T (destroying it) while the
// attack still sits on the stack, then let the stack resolve.
function toReplayPoint(config: Record<string, unknown> = {}) {
  let r = applyAction(
    setup(config),
    { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 },
    rng0(),
  );
  r = applyAction(
    r.state,
    { type: 'castSpell', player: 0, source: { from: 'zone', zoneIndex: 0 }, mode: 'rank', targetMonsterUid: 2 },
    rng0(),
  );
  return resolveStack(r.state, rng0());
}

describe('battle replay (playtest-1)', () => {
  it('target destroyed mid-battle → attacker re-targets the survivor', () => {
    let r = toReplayPoint();
    expect(r.state.players[1].monsters[0]).toBeNull(); // T destroyed by the J
    expect(r.state.pending).toEqual({ type: 'battleReplay', player: 0, attackerUid: 1 });

    const legal = legalActions(r.state, 0);
    expect(legal).toContainEqual({ type: 'replayAttack', player: 0, targetZone: 1 });
    expect(legal).toContainEqual({ type: 'replayDecline', player: 0 });
    // no direct option: B still stands
    expect(legal.some((a) => a.type === 'replayAttack' && a.direct)).toBe(false);

    r = applyAction(r.state, { type: 'replayAttack', player: 0, targetZone: 1 }, rng0());
    expect(r.state.players[1].monsters[1]).toBeNull(); // B (4) destroyed by M0 (9)
    expect(r.state.pending?.type).toBe('bankTrigger'); // and the win still banks
  });

  it('replay declined → attack undone, bystander survives, attacker FREED to attack again', () => {
    let r = toReplayPoint();
    r = applyAction(r.state, { type: 'replayDecline', player: 0 }, rng0());
    expect(types(r.events)).toContain('ReplayDeclined');
    expect(r.state.players[1].monsters[1]).not.toBeNull(); // B untouched
    expect(r.state.pending).toBeNull();
    // ratified true-YGO: the declined replay frees the attacker to attack again
    expect(r.state.players[0].monsters[0]!.attackedTurn).toBe(-1);
    expect(legalActions(r.state, 0)).toContainEqual({
      type: 'declareAttack',
      player: 0,
      attackerZone: 0,
      targetZone: 1,
    });
  });

  it('battleReplay off → the attack fizzles as before (no replay)', () => {
    const r = toReplayPoint({ battleReplay: false });
    expect(r.state.pending).toBeNull();
    expect(types(r.events)).toContain('EffectFizzled');
    expect(r.state.players[1].monsters[1]).not.toBeNull(); // B untouched
  });
});
