import { describe, expect, it } from 'vitest';
import { effectivePower } from '../src/cards.js';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { card, makeState, mon, resolveStack, rng0, run, types } from './helpers.js';

describe('spells & the stack', () => {
  it('J rank effect destroys any one monster via the stack', () => {
    const s = makeState({
      p0: { hand: [card(0, 'J', '♥')] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] },
    });
    let r = applyAction(
      s,
      { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1 },
      rng0(),
    );
    expect(r.state.stack).toHaveLength(1);
    expect(r.state.priority).toBe(0); // caster retains priority
    r = resolveStack(r.state, rng0());
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.players[0].graveyard.map((c) => c.id)).toContain('0:J♥'); // spell to grave
  });

  it('sorcery speed: hand casts only in own main phase with an empty stack', () => {
    const battle = makeState({ phase: 'battle', p0: { hand: [card(0, 'J', '♥')] }, p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] } });
    expect(() =>
      applyAction(battle, { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1 }, rng0()),
    ).toThrow(/main phase/);
    const notYourTurn = makeState({ activePlayer: 1, p0: { hand: [card(0, 'J', '♥')] }, p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] } });
    expect(() =>
      applyAction(notYourTurn, { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1 }, rng0()),
    ).toThrow(/not your turn/);
  });

  it('a set card cannot be activated the turn it was set, but works from the next turn', () => {
    const s = makeState({ turn: 5, p0: { hand: [card(0, 'J', '♠')] }, p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] } });
    let r = applyAction(s, { type: 'setSpell', player: 0, handIndex: 0, zoneIndex: 0 }, rng0());
    expect(r.state.players[0].spellTraps[0]?.setTurn).toBe(5);
    expect(() =>
      applyAction(r.state, { type: 'castSpell', player: 0, source: { from: 'zone', zoneIndex: 0 }, mode: 'rank', targetMonsterUid: 1 }, rng0()),
    ).toThrow(/turn it was set/);

    const later = makeState({
      turn: 6,
      p0: { spellTraps: [{ card: card(0, 'J', '♠'), setTurn: 5 }] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] },
    });
    const r2 = run(
      later,
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'zone', zoneIndex: 0 }, mode: 'rank', targetMonsterUid: 1 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    expect(r2.state.players[1].monsters[0]).toBeNull();
    expect(r2.state.players[0].spellTraps[0]).toBeNull();
  });

  it('set cards activate on the opponent turn through the phase-change window', () => {
    // p1 is active; p0 holds a set J from an earlier turn; p1 has a monster.
    const s = makeState({
      turn: 6,
      activePlayer: 1,
      p0: { spellTraps: [{ card: card(0, 'J', '♠'), setTurn: 4 }] },
      p1: { monsters: [mon(card(1, '9', '♦'), 'attack', 1)] },
    });
    let r = applyAction(s, { type: 'nextPhase', player: 1 }, rng0());
    expect(r.state.pendingWindow).toEqual({ to: 'battle' });
    expect(r.state.priority).toBe(0); // window handed to the opponent
    const opts = legalActions(r.state, 0);
    expect(opts.some((a) => a.type === 'castSpell')).toBe(true);
    r = run(
      r.state,
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'zone', zoneIndex: 0 }, mode: 'rank', targetMonsterUid: 1 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    expect(r.state.players[1].monsters[0]).toBeNull();
    // window auto-closed after resolution (no more activations) → battle phase
    expect(r.state.phase).toBe('battle');
    expect(r.state.pendingWindow).toBeNull();
  });

  it('♠ NEGATE counters a spell on the stack', () => {
    // p1 (active) casts J at p0's monster; p0 answers with a set J♠ negate.
    const s = makeState({
      turn: 6,
      activePlayer: 1,
      p0: {
        monsters: [mon(card(0, '8', '♥'), 'attack', 1)],
        spellTraps: [{ card: card(0, 'J', '♠'), setTurn: 4 }],
      },
      p1: { hand: [card(1, 'J', '♦')] },
    });
    let r = applyAction(
      s,
      { type: 'castSpell', player: 1, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1 },
      rng0(),
    );
    const jItemId = r.state.stack[0]!.id;
    r = applyAction(r.state, { type: 'pass', player: 1 }, rng0()); // caster passes
    r = run(
      r.state,
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'zone', zoneIndex: 0 }, mode: 'suit', targetStackItemId: jItemId },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    // negate resolved: J removed from the stack without resolving
    expect(r.state.stack).toHaveLength(0);
    expect(r.state.players[0].monsters[0]).not.toBeNull();
    expect(r.state.players[1].graveyard.map((c) => c.id)).toContain('1:J♦');
    expect(r.state.players[0].graveyard.map((c) => c.id)).toContain('0:J♠');
    expect(types(r.events)).toContain('EffectNegated');
  });

  it('♥ special summons a monster from EITHER graveyard, face-up, no flip effect', () => {
    const s = makeState({
      p0: { hand: [card(0, 'Q', '♥')] },
      p1: { graveyard: [card(1, '8', '♦')] },
    });
    const r = run(
      s,
      rng0(),
      {
        type: 'castSpell',
        player: 0,
        source: { from: 'hand', handIndex: 0 },
        mode: 'suit',
        graveTarget: { player: 1, cardId: '1:8♦' },
        summonPosition: 'defense',
      },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    const m = r.state.players[0].monsters[0];
    expect(m?.card.id).toBe('1:8♦'); // stolen from the opponent's graveyard
    expect(m?.position).toBe('defense');
    expect(r.state.players[1].graveyard).toHaveLength(0);
    expect(r.state.stack).toHaveLength(0); // no flip trigger
    expect(types(r.events)).not.toContain('FlipTriggered');
  });

  it('♣ destroys one face-down set spell/trap', () => {
    const s = makeState({
      p0: { hand: [card(0, 'K', '♣')] },
      p1: { spellTraps: [{ card: card(1, 'Q', '♠'), setTurn: 3 }] },
    });
    const r = run(
      s,
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'suit', targetSTZone: { player: 1, zoneIndex: 0 } },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    expect(r.state.players[1].spellTraps[0]).toBeNull();
    expect(r.state.players[1].graveyard.map((c) => c.id)).toEqual(['1:Q♠']);
    expect(types(r.events)).toContain('SetCardDestroyed');
  });

  it('Q buffs your monster by the discarded value until end of turn', () => {
    const s = makeState({
      turn: 5,
      phase: 'main1',
      p0: {
        hand: [card(0, 'Q', '♦'), card(0, '5', '♥')],
        monsters: [mon(card(0, '4', '♠'), 'attack', 1, { summonedTurn: 3 })],
      },
    });
    let r = run(
      s,
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 1 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    expect(effectivePower(r.state.players[0].monsters[0]!)).toBe(9); // 4 + 5
    expect(r.state.players[0].graveyard.map((c) => c.id)).toContain('0:5♥'); // cost paid
    // end the turn → buff expires
    r = run(
      r.state,
      rng0(),
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
    );
    expect(effectivePower(r.state.players[0].monsters[0]!)).toBe(4);
  });

  it('K permanently debuffs an opposing monster, floored at 0', () => {
    const s = makeState({
      p0: { hand: [card(0, 'K', '♥'), card(0, '9', '♥')] },
      p1: { monsters: [mon(card(1, '6', '♦'), 'attack', 1)] },
    });
    let r = run(
      s,
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 1 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    const m = r.state.players[1].monsters[0]!;
    expect(m.power).toBe(0); // 6 - 9 floored
    // permanent: survives end of turn
    r = run(
      r.state,
      rng0(),
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
    );
    expect(r.state.players[1].monsters[0]!.power).toBe(0);
  });

  it('Q/K require a NUMBER card discard and a legal target side', () => {
    const s = makeState({
      p0: { hand: [card(0, 'Q', '♦'), card(0, 'J', '♥')], monsters: [mon(card(0, '4', '♠'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '6', '♦'), 'attack', 2)] },
    });
    expect(() =>
      applyAction(s, { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1, discardHandIndex: 1 }, rng0()),
    ).toThrow(/number card/);
    expect(() =>
      applyAction(s, { type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 2, discardHandIndex: 1 }, rng0()),
    ).toThrow(/your monster/);
  });

  it('Joker is Pot of Greed: draw 2, sorcery only, cannot be set', () => {
    const s = makeState({ p0: { hand: [card(0, 'JOKER', null)] } });
    expect(() =>
      applyAction(s, { type: 'setSpell', player: 0, handIndex: 0, zoneIndex: 0 }, rng0()),
    ).toThrow(/face cards/);
    const r = run(
      s,
      rng0(),
      { type: 'castJoker', player: 0, handIndex: 0 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 },
    );
    expect(r.state.players[0].hand).toHaveLength(2);
    expect(r.state.players[0].graveyard.map((c) => c.id)).toEqual(['0:JOKER-1']);
  });

  it('fizzles when the target is gone at resolution (J at a monster that got destroyed)', () => {
    // p1 active casts J targeting p0's 8♥; p0 responds with set J destroying... p0's own monster
    // can't be destroyed by response here, so instead: two J's on the stack both aimed at the same monster.
    const s = makeState({
      turn: 6,
      activePlayer: 1,
      p0: { monsters: [mon(card(0, '8', '♥'), 'attack', 1)], spellTraps: [{ card: card(0, 'J', '♣'), setTurn: 4 }] },
      p1: { hand: [card(1, 'J', '♦')] },
    });
    // p1 casts J targeting the monster; p0 responds with their set J... also targeting the same monster.
    let r = applyAction(s, { type: 'castSpell', player: 1, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 1 }, rng0());
    r = applyAction(r.state, { type: 'pass', player: 1 }, rng0());
    r = run(
      r.state,
      rng0(),
      { type: 'castSpell', player: 0, source: { from: 'zone', zoneIndex: 0 }, mode: 'rank', targetMonsterUid: 1 },
      { type: 'pass', player: 0 },
      { type: 'pass', player: 1 }, // resolves p0's J: monster destroyed
      { type: 'pass', player: 1 }, // priority back to active player after resolution
      { type: 'pass', player: 0 }, // resolves p1's J: fizzles, target gone
    );
    expect(types(r.events)).toContain('EffectFizzled');
    expect(r.state.stack).toHaveLength(0);
    expect(r.state.players[1].graveyard.map((c) => c.id)).toContain('1:J♦'); // fizzled spell still hits the grave
  });
});
