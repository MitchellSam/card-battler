// M2.5 ratified rules: §3 no first-turn battle, §4 Ace as spell fuel,
// §6 debuff destruction edges, §8 direct-attack interception, §9 generalized
// mirror combat, §11 ante.

import { describe, expect, it } from 'vitest';
import { effectivePower } from '../src/cards.js';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { createRng } from '../src/rng.js';
import { setupGame } from '../src/setup.js';
import { card, makeState, mon, resolveStack, rng0, run, types } from './helpers.js';

describe('§3 first turn has no Battle Phase', () => {
  it('turn 1: nextPhase from main1 goes straight to main2', () => {
    const s = makeState({ turn: 1 });
    const r = applyAction(s, { type: 'nextPhase', player: 0 }, rng0());
    expect(r.state.phase).toBe('main2');
    const phases = r.events.filter((e) => e.type === 'PhaseChanged').map((e) => e.phase);
    expect(phases).toEqual(['main2']);
  });

  it('turn 2 has a battle phase; firstTurnBattle: true restores it on turn 1', () => {
    const t2 = applyAction(makeState({ turn: 2, activePlayer: 1 }), { type: 'nextPhase', player: 1 }, rng0());
    expect(t2.state.phase).toBe('battle');
    const legacy = applyAction(
      makeState({ turn: 1, config: { firstTurnBattle: true } }),
      { type: 'nextPhase', player: 0 },
      rng0(),
    );
    expect(legacy.state.phase).toBe('battle');
  });
});

describe('§4 Ace as Q/K spell fuel', () => {
  const state = () =>
    makeState({
      p0: { hand: [card(0, 'K', '♥'), card(0, 'A', '♥')] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] },
    });

  it('caster chooses 11: K discards the Ace for a -11 debuff (kills anything)', () => {
    const r = run(
      state(),
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 1, aceValue: 11 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    expect(r.state.players[1].monsters[0]).toBeNull(); // 9 - 11 → destroyed (§6)
    const death = r.events.find((e) => e.type === 'MonsterDestroyed');
    expect(death?.cause).toBe('debuff');
  });

  it('caster chooses 1: same Ace, -1 debuff', () => {
    const r = run(
      state(),
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 1, aceValue: 1 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    expect(r.state.players[1].monsters[0]?.power).toBe(8);
  });

  it('aceValue is required for Ace discards and illegal otherwise', () => {
    expect(() =>
      applyAction(state(), { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 1 }, rng0()),
    ).toThrow(/aceValue/);
    const s = makeState({
      p0: { hand: [card(0, 'K', '♥'), card(0, '5', '♥')] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] },
    });
    expect(() =>
      applyAction(s, { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 1, aceValue: 11 }, rng0()),
    ).toThrow(/only legal with an Ace/);
  });

  it('legalActions enumerates both Ace values', () => {
    const acts = legalActions(state(), 0).filter(
      (a) => a.type === 'castSpell' && a.mode === 'rank',
    );
    const values = acts.map((a) => (a.type === 'castSpell' ? a.aceValue : undefined)).sort();
    expect(values).toEqual([1, 11]);
  });
});

describe('§6 debuff destruction edges', () => {
  it('a temp buff can keep a debuffed monster alive; expiry kills it at end of turn', () => {
    // p0's 5♠ gets Q+4 (→9). In the phase-change window p1 activates a set K
    // for -7: base 5-7 = -2, effective 2 → survives. Buff expires at end of
    // turn → effective -2 → destroyed by the §6 check.
    const s = makeState({
      p0: {
        hand: [card(0, 'Q', '♦'), card(0, '4', '♥')],
        monsters: [mon(card(0, '5', '♠'), 'attack', 1, { summonedTurn: 3 })],
      },
      p1: {
        hand: [card(1, '7', '♥')],
        spellTraps: [{ card: card(1, 'K', '♣'), setTurn: 3 }],
      },
    });
    let r = run(
      s,
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 1 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    expect(effectivePower(r.state.players[0].monsters[0]!)).toBe(9);
    r = run(r.state, rng0(), { type: 'nextPhase', player: 0 }); // window opens, p1 holds a set K
    expect(r.state.priority).toBe(1);
    r = run(
      r.state,
      rng0(),
      { type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 0 },
      { type: 'pass', player: 1 },
      { type: 'pass', player: 0 },
    );
    const m = r.state.players[0].monsters[0]!;
    expect(m.power).toBe(-2); // permanent base went negative
    expect(effectivePower(m)).toBe(2); // temp buff holds it above 0 → alive
    const ended = run(
      r.state,
      rng0(),
      { type: 'nextPhase', player: 0 }, // battle → main2
      { type: 'nextPhase', player: 0 }, // main2 → end (buffs expire)
    );
    expect(ended.state.players[0].monsters[0]).toBeNull(); // buff expired → ≤0 → dead
    const death = ended.events.find((e) => e.type === 'MonsterDestroyed');
    expect(death?.cause).toBe('debuff');
  });
});

describe('§8 direct-attack interception', () => {
  it('a single monster summoned in response intercepts; face-down flips then fights', () => {
    // p0 declares direct; p1 revives a monster in the response window? Simplest
    // deterministic path: p1 activates a set ♥ (revive) while the attack is on
    // the stack, so a monster appears before resolution.
    const s = makeState({
      phase: 'battle',
      p0: { monsters: [mon(card(0, '7', '♠'), 'attack', 1, { summonedTurn: 3 })] },
      p1: {
        spellTraps: [{ card: card(1, 'J', '♥'), setTurn: 3 }],
        graveyard: [card(1, '9', '♦')],
      },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0());
    r = applyAction(r.state, { type: 'pass', player: 0 }, rng0());
    // p1 responds with revive → 9♦ in attack position
    r = applyAction(
      r.state,
      { type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 0 }, mode: 'suit', graveTarget: { player: 1, cardId: '1:9♦' }, summonPosition: 'attack' },
      rng0(),
    );
    const done = resolveStack(r.state, rng0());
    expect(types(done.events)).toContain('AttackIntercepted');
    // 7♠ vs 9♦ in attack position: attacker dies, interceptor's owner gets the trigger...
    expect(done.state.players[0].monsters[0]).toBeNull();
    expect(done.state.players[1].monsters.some((m) => m?.card.id === '1:9♦')).toBe(true);
  });

  it('multiple appeared monsters: the DEFENDER chooses the interceptor', () => {
    const s = makeState({
      phase: 'battle',
      p0: { monsters: [mon(card(0, '7', '♠'), 'attack', 1, { summonedTurn: 3 })] },
      p1: {
        spellTraps: [
          { card: card(1, 'J', '♥'), setTurn: 3 },
          { card: card(1, 'Q', '♥'), setTurn: 3 },
        ],
        graveyard: [card(1, '9', '♦'), card(1, '2', '♣')],
      },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, direct: true }, rng0());
    r = applyAction(r.state, { type: 'pass', player: 0 }, rng0());
    r = applyAction(
      r.state,
      { type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 0 }, mode: 'suit', graveTarget: { player: 1, cardId: '1:9♦' }, summonPosition: 'attack' },
      rng0(),
    );
    r = applyAction(r.state, { type: 'pass', player: 1 }, rng0());
    r = applyAction(r.state, { type: 'pass', player: 0 }, rng0()); // revive #1 resolves
    r = applyAction(r.state, { type: 'pass', player: 0 }, rng0()); // hand priority to p1
    r = applyAction(
      r.state,
      { type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 1 }, mode: 'suit', graveTarget: { player: 1, cardId: '1:2♣' }, summonPosition: 'defense' },
      rng0(),
    );
    const done = resolveStack(r.state, rng0()); // revive #2, then the attack
    expect(done.state.pending).toMatchObject({ type: 'interceptor', player: 1 });
    const options = legalActions(done.state, 1).filter((a) => a.type === 'chooseInterceptor');
    expect(options).toHaveLength(2);
    // defender feeds the weak 2♣ (in defense) to the attack → attacker wins, no trigger
    const weak = done.state.players[1].monsters.find((m) => m?.card.id === '1:2♣')!;
    const after = applyAction(done.state, { type: 'chooseInterceptor', player: 1, monsterUid: weak.uid }, rng0());
    expect(types(after.events)).toContain('AttackIntercepted');
    expect(after.state.players[1].monsters.some((m) => m?.card.id === '1:2♣')).toBe(false);
    expect(after.state.players[1].monsters.some((m) => m?.card.id === '1:9♦')).toBe(true);
  });
});

describe('§9 mirror combat', () => {
  it('identical rank+suit into a DEFENDER: both destroyed, no wall-punish, no trigger', () => {
    const s = makeState({
      phase: 'battle',
      p0: {
        monsters: [mon(card(0, '7', '♥'), 'attack', 1, { summonedTurn: 3 })],
        bank: [card(0, '9', '♥')],
      },
      p1: { monsters: [mon(card(1, '7', '♥'), 'defense', 2)] },
    });
    const atk = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    const r = resolveStack(atk.state, rng0());
    expect(r.state.players[0].monsters[0]).toBeNull();
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.players[0].bank).toHaveLength(1); // no wall-punish on a tie
    expect(r.state.pending).toBeNull(); // no bank trigger either
  });
});

describe('firstTurnDraw experiment knob', () => {
  it('default: the first player skips the turn-1 draw phase', () => {
    const { state } = setupGame(createRng(3), { skipMulligan: true, firstPlayer: 0 });
    expect(state.players[0].hand).toHaveLength(state.config.startingHand);
  });

  it('firstTurnDraw: turn 1 begins with a normal draw phase', () => {
    const { state, events } = setupGame(createRng(3), {
      skipMulligan: true,
      firstPlayer: 0,
      config: { firstTurnDraw: true },
    });
    expect(state.players[0].hand).toHaveLength(state.config.startingHand + state.config.drawPerTurn);
    expect(state.players[1].hand).toHaveLength(state.config.startingHand);
    expect(events.some((e) => e.type === 'CardsDrawn' && e.player === 0)).toBe(true);
  });

  it('applies on the mulligan path too', () => {
    const rng = createRng(5);
    let s = setupGame(rng, { config: { firstTurnDraw: true }, firstPlayer: 0 }).state;
    s = applyAction(s, { type: 'mulligan', player: 0, discardHandIndices: [] }, rng).state;
    s = applyAction(s, { type: 'mulligan', player: 1, discardHandIndices: [] }, rng).state;
    expect(s.players[0].hand).toHaveLength(7); // 5 + draw 2
    expect(s.players[1].hand).toHaveLength(5);
  });
});

describe('§11 ante', () => {
  it('moves ante cards from each deck top to the public banks after mulligans', () => {
    const rng = createRng(7);
    const { state, events } = setupGame(rng, { config: { ante: 3 }, skipMulligan: true });
    expect(state.players[0].bank).toHaveLength(3);
    expect(state.players[1].bank).toHaveLength(3);
    expect(state.players[0].deck.length + state.players[0].hand.length).toBe(51);
    const anteEvents = events.filter((e) => e.type === 'CardBanked' && e.cause === 'ante');
    expect(anteEvents).toHaveLength(6);
    // Jokers are never ante'd
    for (const p of [0, 1] as const)
      expect(state.players[p].bank.every((c) => c.rank !== 'JOKER')).toBe(true);
  });

  it('ante fires after the mulligan phase completes', () => {
    const rng = createRng(11);
    let s = setupGame(rng, { config: { ante: 2 } }).state;
    expect(s.players[0].bank).toHaveLength(0);
    s = applyAction(s, { type: 'mulligan', player: 0, discardHandIndices: [] }, rng).state;
    expect(s.players[0].bank).toHaveLength(0); // not yet — p1 still to mulligan
    s = applyAction(s, { type: 'mulligan', player: 1, discardHandIndices: [0, 1] }, rng).state;
    expect(s.players[0].bank).toHaveLength(2);
    expect(s.players[1].bank).toHaveLength(2);
    expect(s.phase).toBe('main1');
  });

  it('ante 0 (Constructed canonical) banks nothing', () => {
    const { state } = setupGame(createRng(1), { skipMulligan: true });
    expect(state.players[0].bank).toHaveLength(0);
  });
});
