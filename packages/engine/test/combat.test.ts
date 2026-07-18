import { describe, expect, it } from 'vitest';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { createRng } from '../src/rng.js';
import { card, makeState, mon, resolveStack, rng0, run, types } from './helpers.js';

const battle = (opts: Parameters<typeof makeState>[0] = {}) =>
  makeState({ phase: 'battle', ...opts });

describe('combat', () => {
  it('attack vs attack, attacker wins: defender destroyed, attacker gets the bank trigger', () => {
    const s = battle({
      p0: { hand: [card(0, 'K', '♥')], monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '5', '♦'), 'attack', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    expect(r.state.stack).toHaveLength(1);
    r = resolveStack(r.state, rng0());
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.players[1].graveyard.map((c) => c.id)).toContain('1:5♦');
    expect(r.state.pending).toEqual({ type: 'bankTrigger', player: 0, remaining: 1 });
    // bank the K from hand
    const r2 = applyAction(r.state, { type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }, rng0());
    expect(r2.state.players[0].bank.map((c) => c.id)).toEqual(['0:K♥']);
    expect(r2.state.players[0].hand).toHaveLength(0);
  });

  it('attack vs attack, attacker loses: the DEFENDER gets the bank trigger', () => {
    const s = battle({
      p0: { monsters: [mon(card(0, '3', '♠'), 'attack', 1)], bank: [card(0, '9', '♥')] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.players[0].monsters[0]).toBeNull();
    // margin default: defender 9 beat attacker 3 by 6 → 2 grants (only 1 spent below).
    expect(r.state.pending).toEqual({ type: 'bankTrigger', player: 1, remaining: 2 });
    // defender chooses to remove from the attacker's bank instead of banking
    const r2 = applyAction(r.state, { type: 'bankChoice', player: 1, choice: 'remove', bankIndex: 0 }, rng0());
    expect(r2.state.players[0].bank).toHaveLength(0);
    expect(r2.state.players[0].removed.map((c) => c.id)).toEqual(['0:9♥']);
  });

  it('breaks power ties by suit (♠ > ♥ > ♣ > ♦)', () => {
    const s = battle({
      p0: { hand: [card(0, '2', '♣')], monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '7', '♥'), 'attack', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.players[0].monsters[0]).not.toBeNull(); // spade survives
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.pending).toEqual({ type: 'bankTrigger', player: 0, remaining: 1 });
  });

  it('true mirror (same rank and suit): both destroyed, no bank trigger', () => {
    const s = battle({
      p0: { monsters: [mon(card(0, '7', '♥'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '7', '♥'), 'attack', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.players[0].monsters[0]).toBeNull();
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.pending).toBeNull();
  });

  it('attack vs face-up defense: winning kill gives NO bank trigger', () => {
    const s = battle({
      p0: { monsters: [mon(card(0, '8', '♠'), 'attack', 1, { summonedTurn: 5 })] },
      p1: { monsters: [mon(card(1, '4', '♦'), 'defense', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.pending).toBeNull();
  });

  it('wall-punish: losing to a defender destroys the attacker AND removes a random bank card', () => {
    const s = battle({
      p0: {
        monsters: [mon(card(0, '3', '♠'), 'attack', 1)],
        bank: [card(0, '9', '♥'), card(0, '8', '♥')],
      },
      p1: { monsters: [mon(card(1, '9', '♦'), 'defense', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.players[0].monsters[0]).toBeNull();
    expect(r.state.players[0].bank).toHaveLength(1); // one removed, seeded-randomly
    expect(r.state.players[0].removed).toHaveLength(1);
    expect(r.state.pending).toBeNull(); // no bank trigger for the defender on a wall win
  });

  it('wall-punish with an empty bank removes nothing', () => {
    const s = battle({
      p0: { monsters: [mon(card(0, '3', '♠'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'defense', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.players[0].monsters[0]).toBeNull();
    expect(r.state.players[0].removed).toHaveLength(0);
  });

  it('wallPunishSelector "defender": defender picks the removed card', () => {
    const s = battle({
      config: { wallPunishSelector: 'defender' },
      p0: {
        monsters: [mon(card(0, '3', '♠'), 'attack', 1)],
        bank: [card(0, '9', '♥'), card(0, 'A', '♠')],
      },
      p1: { monsters: [mon(card(1, '9', '♦'), 'defense', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.pending).toEqual({ type: 'wallPunishPick', player: 1, attacker: 0 });
    const r2 = applyAction(r.state, { type: 'wallPunishPick', player: 1, bankIndex: 1 }, rng0());
    expect(r2.state.players[0].removed.map((c) => c.id)).toEqual(['0:A♠']);
  });

  it('direct attack only with an empty opposing board; grants a bank trigger', () => {
    const blocked = battle({
      p0: { monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '2', '♦'), 'set', 2)] },
    });
    expect(() =>
      applyAction(blocked, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0()),
    ).toThrow(/direct/i);

    const open = battle({
      p0: { hand: [card(0, '10', '♦')], monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
    });
    let r = applyAction(open, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0());
    r = resolveStack(r.state, rng0());
    // margin default: a direct hit lands full attacker power (7 → 2 grants).
    expect(r.state.pending).toEqual({ type: 'bankTrigger', player: 0, remaining: 2 });
  });

  it('attacking a set monster flips it; survivor stays face-up defense', () => {
    // 9 has no flip effect; 9 in defense beats a 5 attacker → wall-punish
    const s = battle({
      p0: { monsters: [mon(card(0, '5', '♠'), 'attack', 1)], bank: [card(0, '2', '♥')] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'set', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    const wall = r.state.players[1].monsters[0];
    expect(wall?.position).toBe('defense'); // flipped face-up and survived
    expect(r.state.players[0].monsters[0]).toBeNull();
    expect(r.state.players[0].bank).toHaveLength(0); // punished
  });

  it('one attack per monster per turn; declining a bank trigger is allowed', () => {
    const s = battle({
      p0: { hand: [card(0, '2', '♥')], monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0());
    r = resolveStack(r.state, rng0());
    r = applyAction(r.state, { type: 'bankChoice', player: 0, choice: 'decline' }, rng0());
    expect(r.state.players[0].bank).toHaveLength(0);
    expect(() =>
      applyAction(r.state, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0()),
    ).toThrow(/already attacked/);
  });

  it('bank trigger with empty hand and empty opposing bank auto-skips', () => {
    const s = battle({
      p0: { monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.pending).toBeNull();
    expect(types(r.events)).toContain('BankTriggerSkipped');
  });

  it('jokers cannot be banked', () => {
    const s = battle({
      p0: { hand: [card(0, 'JOKER', null)], monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
      p1: { bank: [card(1, '4', '♦')] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0());
    r = resolveStack(r.state, rng0());
    // margin default: direct hit at power 7 → 2 grants.
    expect(r.state.pending).toEqual({ type: 'bankTrigger', player: 0, remaining: 2 });
    expect(() =>
      applyAction(r.state, { type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }, rng0()),
    ).toThrow(/Joker/);
    const legal = legalActions(r.state, 0);
    expect(legal.some((a) => a.type === 'bankChoice' && a.choice === 'bank')).toBe(false);
    expect(legal.some((a) => a.type === 'bankChoice' && a.choice === 'remove')).toBe(true);
  });

  it('defense-position and set monsters cannot declare attacks', () => {
    const s = battle({
      p0: {
        monsters: [mon(card(0, '7', '♠'), 'defense', 1), mon(card(0, '5', '♥'), 'set', 2)],
      },
    });
    expect(() =>
      applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0()),
    ).toThrow(/attack position/);
    expect(() =>
      applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 1, direct: true }, rng0()),
    ).toThrow(/attack position/);
    expect(legalActions(s, 0).filter((a) => a.type === 'declareAttack')).toHaveLength(0);
  });
});
