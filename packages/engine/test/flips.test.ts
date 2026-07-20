import { describe, expect, it } from 'vitest';
import { effectivePower } from '../src/cards.js';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { card, fillerDeck, flipChoice, makeState, mon, resolveStack, rng0, run, types } from './helpers.js';

describe('flip effects', () => {
  it('manual flip triggers the effect on the stack; A becomes 11 until end of turn', () => {
    const s = makeState({
      turn: 5,
      p0: { monsters: [mon(card(0, 'A', '♠'), 'set', 1, { setTurn: 3 })] },
    });
    let r = applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0());
    expect(r.state.players[0].monsters[0]?.position).toBe('attack');
    // Ratified (2026-07): the flip is offered first, not forced onto the stack.
    expect(r.state.pending).toMatchObject({ type: 'flipDecision', player: 0, effect: 'default:A' });
    r = flipChoice(r.state, rng0(), 'activate');
    expect(r.state.stack).toHaveLength(1); // respondable trigger, now on the stack
    r = resolveStack(r.state, rng0());
    expect(effectivePower(r.state.players[0].monsters[0]!)).toBe(11);
    // reverts at end of the turn it was flipped
    r = run(
      r.state,
      rng0(),
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
      { type: 'nextPhase', player: 0 },
    );
    expect(effectivePower(r.state.players[0].monsters[0]!)).toBe(1);
  });

  it('a manually flipped monster cannot switch position the same turn (ratified 2026-07)', () => {
    // Rank 9 has no flip effect, isolating the position-lock from the stack.
    const s = makeState({
      turn: 5,
      p0: { monsters: [mon(card(0, '9', '♠'), 'set', 1, { setTurn: 3 })] },
    });
    const r = applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0());
    expect(r.state.players[0].monsters[0]?.position).toBe('attack');
    expect(r.state.stack).toHaveLength(0); // 9 = no effect, no trigger
    // The flip consumes this turn's position change: neither offered nor allowed.
    expect(legalActions(r.state, 0).some((a) => a.type === 'changePosition')).toBe(false);
    expect(() =>
      applyAction(r.state, { type: 'changePosition', player: 0, zoneIndex: 0 }, rng0()),
    ).toThrow(/position already changed/);
  });

  it('cannot manually flip the turn the monster was set', () => {
    const s = makeState({ turn: 5, p0: { monsters: [mon(card(0, 'A', '♠'), 'set', 1, { setTurn: 5 })] } });
    expect(() => applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0())).toThrow(
      /turn it was set/,
    );
  });

  it('declining a manual flip skips the effect and returns to the main phase (ratified 2026-07)', () => {
    const s = makeState({
      turn: 5,
      p0: { monsters: [mon(card(0, '4', '♠'), 'set', 1, { setTurn: 3 })], deck: fillerDeck(0, 5) },
    });
    let r = applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0());
    expect(r.state.pending).toMatchObject({ type: 'flipDecision', player: 0, effect: 'default:4' });
    r = flipChoice(r.state, rng0(), 'decline');
    expect(types(r.events)).toContain('FlipDeclined');
    expect(r.state.stack).toHaveLength(0); // no trigger queued
    expect(r.state.players[0].hand).toHaveLength(0); // the 4's draw never happened
    expect(r.state.players[0].monsters[0]?.position).toBe('attack'); // still flipped up
    expect(r.state.pending).toBeNull();
    // control is back with the active player mid-main-phase
    expect(r.state.phase).toBe('main1');
  });

  it('a defender may decline the flip effect of a monster flipped by an attack', () => {
    // Attacked set 6 would bounce the attacker; declining lets combat proceed.
    const s = makeState({
      phase: 'battle',
      p0: { monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '6', '♦'), 'set', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    // both pass; attack resolves, the 6 flips, and its controller is offered the effect
    r = run(r.state, rng0(), { type: 'pass', player: 0 }, { type: 'pass', player: 1 });
    expect(r.state.pending).toMatchObject({ type: 'flipDecision', player: 1, effect: 'default:6' });
    r = flipChoice(r.state, rng0(), 'decline'); // don't bounce — take the fight
    r = resolveStack(r.state, rng0()); // combat resolves: 7 > 6, the 6 is destroyed
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.players[0].monsters[0]?.card.id).toBe('0:7♠'); // attacker survives
  });

  it('4 draws a card; 3 reveals the opponent hand; 7 discards a random opponent card', () => {
    const s = makeState({
      turn: 5,
      p0: {
        monsters: [
          mon(card(0, '4', '♠'), 'set', 1, { setTurn: 3 }),
          mon(card(0, '3', '♥'), 'set', 2, { setTurn: 3 }),
          mon(card(0, '7', '♣'), 'set', 3, { setTurn: 3 }),
        ],
      },
      p1: { hand: [card(1, '2', '♦'), card(1, '9', '♣')] },
    });
    let r = resolveStack(
      applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0()).state,
      rng0(),
    );
    expect(r.state.players[0].hand).toHaveLength(1); // drew 1

    const r3 = resolveStack(
      applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 1 }, rng0()).state,
      rng0(),
    );
    // reveal is information only: emitted as an event, no state change
    expect(r3.state.players[1].hand).toHaveLength(2);

    const r7 = resolveStack(
      applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 2 }, rng0()).state,
      rng0(),
    );
    expect(r7.state.players[1].hand).toHaveLength(1);
    expect(r7.state.players[1].graveyard).toHaveLength(1);
  });

  it('5 mills two from the opponent deck and can end the game on deck-out', () => {
    const s = makeState({
      turn: 5,
      p0: {
        monsters: [mon(card(0, '5', '♠'), 'set', 1, { setTurn: 3 })],
        bank: [card(0, 'K', '♠')],
      },
      p1: { deck: [card(1, '2', '♦'), card(1, '9', '♣')], bank: [card(1, '4', '♥')] },
    });
    let r = applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.players[1].graveyard).toHaveLength(2);
    expect(r.state.players[1].deck).toHaveLength(0);
    // M2.5 §2: milling to zero does NOT end the game — p1's next draw phase does.
    expect(r.state.phase).not.toBe('gameOver');
    const ended = run(
      r.state,
      rng0(),
      { type: 'nextPhase', player: 0 }, // → battle
      { type: 'nextPhase', player: 0 }, // → main2
      { type: 'nextPhase', player: 0 }, // → end → p1's draw phase finds nothing
    );
    expect(ended.state.phase).toBe('gameOver');
    expect(ended.state.result?.winner).toBe(0); // K-high beats 4-high
  });

  it('8 destroys all attack-position monsters on both sides; defense survives', () => {
    const s = makeState({
      turn: 5,
      p0: {
        monsters: [
          mon(card(0, '8', '♠'), 'set', 1, { setTurn: 3 }),
          mon(card(0, '6', '♥'), 'attack', 2),
          mon(card(0, '5', '♦'), 'defense', 3),
        ],
      },
      p1: { monsters: [mon(card(1, '9', '♣'), 'attack', 4), mon(card(1, '2', '♦'), 'set', 5)] },
    });
    let r = applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    // the flipped 8 itself is in attack (manual flip) → destroyed too
    expect(r.state.players[0].monsters[0]).toBeNull();
    expect(r.state.players[0].monsters[1]).toBeNull();
    expect(r.state.players[0].monsters[2]).not.toBeNull(); // defense survives
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.players[1].monsters[1]).not.toBeNull(); // set survives
  });

  it('2 flips the battle position of any monster; face-down→face-up chains that flip effect', () => {
    const s = makeState({
      turn: 5,
      p0: { monsters: [mon(card(0, '2', '♠'), 'set', 1, { setTurn: 3 })] },
      p1: { monsters: [mon(card(1, '4', '♦'), 'set', 2, { setTurn: 2 })] },
    });
    let r = applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0());
    // Activate the declinable flip; the 2 then asks for its position-flip target.
    r = flipChoice(r.state, rng0(), 'activate');
    expect(r.state.pending).toMatchObject({ type: 'flipTarget', player: 0 });
    r = applyAction(r.state, { type: 'chooseFlipTarget', player: 0, monsterUid: 2 }, rng0());
    r = resolveStack(r.state, rng0()); // resolves the 2 → flips the set 4 → chains its trigger → draw
    expect(r.state.players[1].monsters[0]?.position).toBe('attack'); // position flip: set → face-up attack
    expect(r.state.players[1].hand).toHaveLength(1); // their 4 drew THEM a card
    expect(types(r.events).filter((t) => t === 'FlipTriggered').length).toBeGreaterThanOrEqual(1);
  });

  it('attacked set 6 can bounce the attacker: combat fizzles', () => {
    const s = makeState({
      phase: 'battle',
      p0: { monsters: [mon(card(0, '7', '♠'), 'attack', 1)] },
      p1: { monsters: [mon(card(1, '6', '♦'), 'set', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0()); // attack resolves: flip the 6, trigger needs a target
    expect(r.state.pending).toMatchObject({ type: 'flipTarget', player: 1 });
    r = applyAction(r.state, { type: 'chooseFlipTarget', player: 1, monsterUid: 1 }, rng0());
    r = resolveStack(r.state, rng0()); // flip resolves (bounce), then combat fizzles
    expect(r.state.players[0].monsters[0]).toBeNull();
    expect(r.state.players[0].hand.map((c) => c.id)).toContain('0:7♠'); // back in hand
    expect(r.state.players[1].monsters[0]?.position).toBe('defense'); // survived, face-up
    expect(r.state.players[0].bank).toHaveLength(0);
    expect(r.state.pending).toBeNull(); // no wall punish, no bank trigger
  });

  it('attacked set A pumps to 11 and wall-punishes a 7 attacker', () => {
    const s = makeState({
      phase: 'battle',
      p0: {
        monsters: [mon(card(0, '7', '♠'), 'attack', 1)],
        bank: [card(0, '9', '♥')],
      },
      p1: { monsters: [mon(card(1, 'A', '♦'), 'set', 2)] },
    });
    let r = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    r = resolveStack(r.state, rng0());
    expect(r.state.players[0].monsters[0]).toBeNull(); // 7 < 11
    expect(r.state.players[0].bank).toHaveLength(0); // wall-punished
    expect(effectivePower(r.state.players[1].monsters[0]!)).toBe(11);
  });

  it('♠ can negate a flip effect on the stack', () => {
    const s = makeState({
      turn: 6,
      p0: { monsters: [mon(card(0, '4', '♠'), 'set', 1, { setTurn: 4 })], deck: fillerDeck(0, 5) },
      p1: { spellTraps: [{ card: card(1, 'K', '♠'), setTurn: 4 }] },
    });
    let r = applyAction(s, { type: 'flipMonster', player: 0, zoneIndex: 0 }, rng0());
    r = flipChoice(r.state, rng0(), 'activate'); // put the flip trigger on the stack
    const flipItemId = r.state.stack[0]!.id;
    r = applyAction(r.state, { type: 'pass', player: 0 }, rng0());
    r = run(
      r.state,
      rng0(),
      { type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 0 }, mode: 'suit', targetStackItemId: flipItemId },
      { type: 'pass', player: 1 },
      { type: 'pass', player: 0 },
    );
    expect(r.state.stack).toHaveLength(0);
    expect(r.state.players[0].hand).toHaveLength(0); // the 4's draw never happened
    expect(r.state.players[0].monsters[0]?.position).toBe('attack'); // stays face-up
    expect(types(r.events)).toContain('EffectNegated');
  });
});
