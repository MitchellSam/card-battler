// M1 exit criterion + acceptance: ONE seeded scripted game, start to finish,
// exercising in-game:
//   summons · sacrifice summons (1-sac and 2-sac, attack and set) · set/flip
//   ALL TEN flip effects (A,2,3,4,5,6,7,8,9,10 — 9/10 assert NO trigger)
//   combat vs attack and defense · wall-punish (bank card removed)
//   bank triggers with BOTH choices (bank and remove) · stack with a resolving ♠ negate
//   Polymerization STAND and BUST paths · Joker · Q buff via response window
//   ♥ revive · deck-out ending · showdown scored through a tie-break
//     (both banks partial, equal category, equal top rank — second card decides)
//
// RNG discipline: exactly two seeded rolls occur (wall-punish on a 1-card bank
// → index 0; 7-flip discard from a 4-card hand → index 2 under seed 2025).

import { describe, expect, it } from 'vitest';
import { effectivePower } from '../src/cards.js';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { createRng } from '../src/rng.js';
import { setupGame } from '../src/setup.js';
import type { Action, GameCard, GameEvent, PlayerId, Rank, Suit } from '../src/types.js';
import { card } from './helpers.js';

const c = (owner: PlayerId, rank: Rank, suit: Suit | null = null) => card(owner, rank, suit);

// index 0..4 = opening hand, rest = library top→bottom
const P0_DECK: GameCard[] = [
  c(0, '4', '♠'), c(0, '7', '♠'), c(0, 'J', '♥'), c(0, 'K', '♦'), c(0, 'JOKER'),
  c(0, '2', '♣'),  // joker draw, banked T1, wall-punished away T7
  c(0, 'A', '♠'),  // joker draw
  c(0, 'Q', '♥'),  // T3
  c(0, '5', '♣'),  // T5
  c(0, '8', '♠'), c(0, '6', '♠'), // poly #1 hits: 7 (target) + 8 + 6 = 21 → STAND
  c(0, '9', '♥'),  // T7
  c(0, '10', '♠'), // T9
  c(0, 'J', '♦'),  // T11 → poly #2
  c(0, '9', '♠'), c(0, '5', '♥'), // poly #2 hits: 7 + 9 + 5 = 21
  c(0, '7', '♥'),  // poly #2 third HIT → 28 BUST
  c(0, '7', '♦'),  // T13
  c(0, '10', '♦'), // T15
  c(0, '3', '♣'),  // T17
  c(0, '2', '♠'),  // T19
  c(0, '8', '♣'),  // T21
  c(0, '2', '♥'),  // T23
  c(0, '3', '♦'),  // T25
  c(0, 'A', '♥'),  // T27
  c(0, '4', '♦'),  // T29
  c(0, '10', '♥'), // T31
  c(0, '6', '♣'),  // T33
  c(0, '5', '♠'),  // T35 — last card: deck-out
];
const P1_DECK: GameCard[] = [
  c(1, '5', '♦'), c(1, '9', '♦'), c(1, 'J', '♠'), c(1, '2', '♥'), c(1, 'Q', '♣'),
  c(1, '8', '♦'),  // T2
  c(1, '6', '♦'),  // T4 → Q-buff discard
  c(1, '4', '♥'),  // T6
  c(1, 'K', '♥'),  // 4-flip draw T7; eaten by the 7-flip T15
  c(1, '3', '♥'),  // T8
  c(1, '4', '♦'),  // T10
  c(1, 'J', '♣'), c(1, '4', '♣'), // milled by the 5-flip T10
  c(1, 'A', '♥'),  // T12
  c(1, '10', '♣'), // T14 → banked T24
  c(1, '2', '♦'),  // T16
  c(1, '3', '♦'),  // T18
  c(1, '6', '♥'),  // T20
  c(1, 'A', '♣'),  // T22
  c(1, '4', '♠'),  // T24 — p1's workhorse
  c(1, '2', '♠'),  // T26
  c(1, '3', '♣'),  // T28
  c(1, 'A', '♦'),  // T30
  c(1, '5', '♣'),  // T32
  c(1, '5', '♥'),  // T34
  c(1, '6', '♣'),  // T36 — p1's last card; p0's T37 draw phase finds an empty deck
];

describe('full scripted game (acceptance)', () => {
  it('plays 35 turns: every flip effect, both bank choices, poly stand+bust, wall-punish, negate, deck-out, tie-break', () => {
    const rng = createRng(2025);
    // The script was authored under M1 pacing; pin the legacy knobs the story
    // depends on — including bankTriggerScaling 'off' (one card per trigger),
    // since the scripted bank sequence and final showdown predate the ratified
    // 'margin' default. Scaling has its own coverage in bank-scaling.test.ts.
    // Game-end semantics, Poly, partial-hand scoring etc. are the ratified M2.5
    // rules and ARE exercised below.
    let s = setupGame(rng, {
      decks: [P0_DECK, P1_DECK],
      firstPlayer: 0,
      config: { drawPerTurn: 1, firstTurnBattle: true, bankTriggerScaling: 'off' },
    }).state;
    const events: GameEvent[] = [];
    const step = (a: Action) => {
      const r = applyAction(s, a, rng);
      s = r.state;
      events.push(...r.events);
      return r.events;
    };
    const pass = (p: PlayerId) => step({ type: 'pass', player: p });
    const next = (p: PlayerId) => step({ type: 'nextPhase', player: p });
    const idle = (p: PlayerId) => { next(p); next(p); next(p); };
    // Ratified (2026-07): flip effects are declinable — activate each one to
    // put its trigger on the stack (9/10 have no effect and offer no decision).
    const activate = (p: PlayerId) => step({ type: 'flipChoice', player: p, choice: 'activate' });

    step({ type: 'mulligan', player: 0, discardHandIndices: [] });
    step({ type: 'mulligan', player: 1, discardHandIndices: [] });

    // T1 (p0): summon 4♠ [uid1], Joker draws 2, direct attack, bank 2♣
    step({ type: 'summon', player: 0, handIndex: 0, zoneIndex: 0, mode: 'attack' });
    step({ type: 'castJoker', player: 0, handIndex: 3 });
    pass(0); pass(1);
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 0, direct: true });
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 3 }); // 2♣
    expect(s.players[0].bank.map((x) => x.id)).toEqual(['0:2♣']);
    next(0); next(0);

    // T2 (p1): set 2♥ [uid2], set J♠ face-down
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'set' });
    step({ type: 'setSpell', player: 1, handIndex: 2, zoneIndex: 0 });
    idle(1);

    // T3 (p0): sac-summon 7♠ [uid3]; J♥ NEGATED by set J♠; set Q♥; attack into the 2-flip
    step({ type: 'summon', player: 0, handIndex: 0, zoneIndex: 0, mode: 'attack', sacrificeZoneIndices: [0] });
    step({ type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 2 });
    const jId = s.stack[0]!.id;
    pass(0);
    step({ type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 0 }, mode: 'suit', targetStackItemId: jId });
    pass(1); pass(0); // ♠ negate resolves
    expect(events.some((e) => e.type === 'EffectNegated')).toBe(true);
    expect(s.players[1].monsters[0]).not.toBeNull();
    step({ type: 'setSpell', player: 0, handIndex: 2, zoneIndex: 0 }); // Q♥
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 });
    pass(0); pass(1); // 2♥ flips: [flip 2 ✓]
    activate(1); // p1 uses the 2's position-flip
    step({ type: 'chooseFlipTarget', player: 1, monsterUid: 3 }); // flip the attacker's position
    pass(0); pass(1); // 7♠ → defense
    pass(0); pass(1); // combat fizzles
    expect(s.players[0].monsters[0]?.position).toBe('defense');
    next(0); next(0);

    // T4 (p1): sac 2♥ → 5♦ [uid4]; set Q♣; p0 holds a set card so windows open
    step({ type: 'summon', player: 1, handIndex: 0, zoneIndex: 0, mode: 'attack', sacrificeZoneIndices: [0] });
    step({ type: 'setSpell', player: 1, handIndex: 1, zoneIndex: 0 });
    next(1); pass(0); next(1); pass(0); next(1); pass(0);

    // T5 (p0): reposition 7♠; set A♠ [uid5]; POLY #1 → the total starts at the
    // TARGET's value (7♠ → 7, M2.5 §5), two hits reach 21 → STAND
    step({ type: 'changePosition', player: 0, zoneIndex: 0 });
    step({ type: 'summon', player: 0, handIndex: 1, zoneIndex: 1, mode: 'set' });
    step({ type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'suit', targetMonsterUid: 3 }); // K♦
    pass(0); pass(1);
    expect(s.poly?.total).toBe(7); // target 7♠, nothing dealt yet
    step({ type: 'polyHit', player: 0 }); // 8♠ → 15
    step({ type: 'polyHit', player: 0 }); // 6♠ → 21
    expect(s.poly?.total).toBe(21);
    step({ type: 'polyStand', player: 0 });
    expect(s.players[0].monsters[0]?.power).toBe(11); // [poly STAND ✓] ceil(21/2)
    next(0);
    step({ type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 0 }, mode: 'rank', targetMonsterUid: 4, discardHandIndex: 2 }); // Q♣: discard 6♦, 5♦ +6
    pass(1); pass(0);
    expect(effectivePower(s.players[1].monsters[0]!)).toBe(11);
    expect(s.phase).toBe('battle');
    next(0); next(0);
    expect(effectivePower(s.players[1].monsters[0]!)).toBe(5); // buff expired

    // T6 (p1): 5♦ to defense (the wall); set 4♥ [uid6]
    step({ type: 'changePosition', player: 1, zoneIndex: 0 });
    step({ type: 'summon', player: 1, handIndex: 2, zoneIndex: 1, mode: 'set' });
    next(1); pass(0); next(1); pass(0); next(1); pass(0);

    // T7 (p0): ♥ revive 4♠ [uid7]; flip A♠ to 11 [flip A ✓]; 4♠ dies to the wall
    // (WALL-PUNISH removes the banked 2♣); A♠ breaks the wall; 7♠ flips the 4♥ [flip 4 ✓]
    step({
      type: 'castSpell', player: 0, source: { from: 'zone', zoneIndex: 0 }, mode: 'suit',
      graveTarget: { player: 0, cardId: '0:4♠' }, summonPosition: 'attack',
    });
    pass(0); pass(1);
    step({ type: 'flipMonster', player: 0, zoneIndex: 1 });
    activate(0); // flip A♠ → 11
    pass(0); pass(1);
    expect(effectivePower(s.players[0].monsters[1]!)).toBe(11);
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 2, targetZone: 0 }); // 4♠(4) into 5♦(5) in defense
    pass(0); pass(1);
    expect(s.players[0].monsters[2]).toBeNull(); // attacker destroyed
    expect(s.players[0].bank).toHaveLength(0); // [wall-punish ✓] 2♣ removed
    expect(s.players[0].removed.map((x) => x.id)).toEqual(['0:2♣']);
    step({ type: 'declareAttack', player: 0, attackerZone: 1, targetZone: 0 }); // A♠(11) breaks the wall
    pass(0); pass(1);
    expect(s.pending).toBeNull(); // defense kill: no bank trigger
    step({ type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 1 }); // 7♠(9) into set 4♥
    pass(0); pass(1); // attack resolves; the 4♥ flips
    activate(1); // p1 uses the 4's draw → [flip 4 ✓]
    pass(0); pass(1); // resolves: p1 draws K♥
    pass(0); pass(1); // combat: 9 > 4
    expect(s.players[1].hand.map((x) => x.id)).toContain('1:K♥');
    next(0); next(0);

    // T8 (p1): set 3♥ [uid8]
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'set' });
    idle(1);

    // T9 (p0): sac A♠ → SET 5♣ [uid9]; 7♠ flips the 3♥ [flip 3 ✓]
    step({ type: 'summon', player: 0, handIndex: 0, zoneIndex: 1, mode: 'set', sacrificeZoneIndices: [1] });
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 });
    pass(0); pass(1); // attack resolves; the 3♥ flips
    activate(1); // p1 uses the 3's reveal → [flip 3 ✓]
    pass(0); pass(1); // reveal resolves
    pass(0); pass(1); // combat: 9 > 3
    expect(events.some((e) => e.type === 'HandRevealed')).toBe(true);
    next(0); next(0);

    // T10 (p1): 4♦ [uid10] rams p0's SET 5♣: flip 5 MILLS p1 [flip 5 ✓], then the
    // wall kills the attacker; wall-punish vs an empty bank removes nothing
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'attack' });
    next(1);
    step({ type: 'declareAttack', player: 1, attackerZone: 0, targetZone: 1 });
    pass(1); pass(0); // attack resolves; the 5♣ flips
    activate(0); // p0 uses the 5's mill → [flip 5 ✓]
    pass(1); pass(0); // mill 2 resolves
    pass(1); pass(0); // combat: 4 < 5
    expect(s.players[1].graveyard.map((x) => x.id)).toEqual(
      expect.arrayContaining(['1:J♣', '1:4♣']),
    );
    expect(s.players[1].monsters[0]).toBeNull();
    expect(s.players[1].removed).toHaveLength(0); // empty-bank punish: nothing removed
    next(1); next(1);

    // T11 (p0): POLY #2 on 7♠ (card value 7 again — Poly reads the CARD, not the
    // rewritten power): 7 → 16 → 21, then a greedy third HIT → 28 BUST destroys 7♠
    step({ type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 2 }, mode: 'suit', targetMonsterUid: 3 }); // J♦
    pass(0); pass(1);
    expect(s.poly?.total).toBe(7);
    step({ type: 'polyHit', player: 0 }); // 9♠ → 16
    step({ type: 'polyHit', player: 0 }); // 5♥ → 21
    const bustEvents = step({ type: 'polyHit', player: 0 }); // 7♥ → 28
    expect(bustEvents.some((e) => e.type === 'PolyBust')).toBe(true); // [poly BUST ✓]
    expect(s.players[0].monsters[0]).toBeNull();
    idle(0);

    // T12 (p1): summon A♥ [uid11]
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'attack' });
    idle(1);

    // T13 (p0): sac SET 5♣ → SET 7♦ [uid12]
    step({ type: 'summon', player: 0, handIndex: 2, zoneIndex: 1, mode: 'set', sacrificeZoneIndices: [1] });
    idle(0);

    // T14 (p1): draw 10♣, hold
    idle(1);

    // T15 (p0): manual flip 7♦ → [flip 7 ✓] random discard eats p1's K♥ (seed 2025);
    // 7♦ kills A♥ → bank 10♠
    step({ type: 'flipMonster', player: 0, zoneIndex: 1 });
    activate(0); // 7♦ flip → random discard [flip 7 ✓]
    pass(0); pass(1);
    expect(s.players[1].graveyard.map((x) => x.id)).toContain('1:K♥');
    expect(s.players[1].hand.map((x) => x.id)).toEqual(['1:9♦', '1:8♦', '1:10♣']);
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 1, targetZone: 0 });
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 1 }); // 10♠
    next(0); next(0);

    // T16 (p1): summon 2♦ [uid13]
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'attack' });
    idle(1);

    // T17 (p0): summon 3♣ [uid14]; 7♦ kills 2♦ → bank 10♦; 3♣ direct → bank 9♥
    step({ type: 'summon', player: 0, handIndex: 2, zoneIndex: 2, mode: 'attack' });
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 1, targetZone: 0 });
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 1 }); // 10♦
    step({ type: 'declareAttack', player: 0, attackerZone: 2, direct: true });
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }); // 9♥
    expect(s.players[0].bank.map((x) => x.id)).toEqual(['0:10♠', '0:10♦', '0:9♥']);
    next(0); next(0);

    // T18 (p1): summon 3♦ [uid15] (future sacrifice)
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'attack' });
    idle(1);

    // T19 (p0): set 2♠ [uid16] (future sacrifice)
    step({ type: 'summon', player: 0, handIndex: 0, zoneIndex: 0, mode: 'set' });
    idle(0);

    // T20 (p1): sac 3♦ → SET 6♥ [uid17]
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'set', sacrificeZoneIndices: [0] });
    idle(1);

    // T21 (p0): 7♦ attacks the set 6♥ → [flip 6 ✓] BOUNCES the attacker, combat
    // fizzles; main 2: sac 2♠+3♣ → SET 8♣ [uid18]
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 1, targetZone: 0 });
    pass(0); pass(1); // attack resolves; the 6♥ flips
    activate(1); // p1 uses the 6's bounce → [flip 6 ✓]
    step({ type: 'chooseFlipTarget', player: 1, monsterUid: 12 }); // bounce 7♦
    pass(0); pass(1); // bounce resolves
    pass(0); pass(1); // combat fizzles
    expect(s.players[0].hand.map((x) => x.id)).toContain('0:7♦');
    next(0); // → main2
    step({ type: 'summon', player: 0, handIndex: 0, zoneIndex: 1, mode: 'set', sacrificeZoneIndices: [0, 2] }); // 8♣
    next(0);

    // T22 (p1): summon A♣ [uid19]; 6♥ to attack, rams the SET 8♣ → [flip 8 ✓]
    // wipes every attack-position monster (both of p1's); 8♣ survives in defense
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 1, mode: 'attack' });
    step({ type: 'changePosition', player: 1, zoneIndex: 0 });
    next(1);
    step({ type: 'declareAttack', player: 1, attackerZone: 0, targetZone: 1 });
    pass(1); pass(0); // attack resolves; the 8♣ flips
    activate(0); // p0 uses the 8's board wipe → [flip 8 ✓]
    pass(1); pass(0); // board wipe resolves
    pass(1); pass(0); // combat fizzles (attacker died to its own trigger)
    expect(s.players[1].monsters.every((m) => m === null)).toBe(true);
    expect(s.players[0].monsters[1]?.position).toBe('defense'); // 8♣ lives
    next(1); next(1);

    // T23-T28: p0 dangles bodies; p1's 4♠ farms them for BOTH bank-trigger choices
    step({ type: 'summon', player: 0, handIndex: 1, zoneIndex: 0, mode: 'attack' }); // T23: 2♥ [uid20]
    idle(0);
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'attack' }); // T24: 4♠ [uid21]
    next(1);
    step({ type: 'declareAttack', player: 1, attackerZone: 0, targetZone: 0 });
    pass(1); pass(0);
    step({ type: 'bankChoice', player: 1, choice: 'bank', handIndex: 2 }); // [bank ✓] 10♣
    expect(s.players[1].bank.map((x) => x.id)).toEqual(['1:10♣']);
    next(1); next(1);

    step({ type: 'summon', player: 0, handIndex: 1, zoneIndex: 0, mode: 'attack' }); // T25: 3♦ [uid22]
    idle(0);
    next(1); // T26
    step({ type: 'declareAttack', player: 1, attackerZone: 0, targetZone: 0 });
    pass(1); pass(0);
    step({ type: 'bankChoice', player: 1, choice: 'bank', handIndex: 1 }); // 8♦
    next(1); next(1);

    step({ type: 'summon', player: 0, handIndex: 1, zoneIndex: 0, mode: 'attack' }); // T27: A♥ [uid23]
    idle(0);
    next(1); // T28
    step({ type: 'declareAttack', player: 1, attackerZone: 0, targetZone: 0 });
    pass(1); pass(0);
    step({ type: 'bankChoice', player: 1, choice: 'remove', bankIndex: 2 }); // [remove ✓] p0's 9♥
    expect(s.players[0].bank.map((x) => x.id)).toEqual(['0:10♠', '0:10♦']);
    expect(s.players[0].removed.map((x) => x.id)).toContain('0:9♥');
    next(1); next(1);

    // T29-T33: p0 assembles the expensive sets for the no-effect flips
    step({ type: 'summon', player: 0, handIndex: 1, zoneIndex: 0, mode: 'set' }); // T29: 4♦ [uid24]
    idle(0);
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 1, mode: 'attack' }); // T30: A♦ [uid25]
    idle(1);
    step({ type: 'summon', player: 0, handIndex: 1, zoneIndex: 1, mode: 'set', sacrificeZoneIndices: [0, 1] }); // T31: SET 10♥ [uid26]
    idle(0);
    step({ type: 'summon', player: 1, handIndex: 0, zoneIndex: 0, mode: 'set', sacrificeZoneIndices: [0, 1] }); // T32: SET 9♦ [uid27]
    idle(1);

    // T33 (p0): manual flip of the 10 → NO trigger [flip 10 ✓]; it then attacks the
    // SET 9♦, which flips with NO trigger [flip 9 ✓] and dies in defense
    const flip10Events = step({ type: 'flipMonster', player: 0, zoneIndex: 1 });
    expect(flip10Events.some((e) => e.type === 'FlipTriggered')).toBe(false);
    expect(s.stack).toHaveLength(0); // nothing to respond to
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 1, targetZone: 0 });
    pass(0); pass(1); // attack resolves: 9♦ flips silently — NO trigger joins the combat step
    expect(s.stack.map((i) => i.kind)).toEqual(['combat']);
    pass(0); pass(1); // combat: 10 > 9 in defense
    expect(s.players[1].monsters[0]).toBeNull();
    expect(
      events.filter((e) => e.type === 'FlipTriggered' && (e.effect === 'default:9' || e.effect === 'default:10')),
    ).toHaveLength(0);
    next(0); next(0);

    // T34 (p1): nothing
    idle(1);

    // T35 (p0): draws its LAST card (5♠). Under M2.5 §2 the game does NOT end
    // on an emptied deck — only a draw phase due from an empty deck ends it.
    expect(s.players[0].deck).toHaveLength(0);
    expect(s.phase).toBe('main1');
    idle(0);

    // T36 (p1): draws ITS last card (6♣); still alive.
    expect(s.players[1].deck).toHaveLength(0);
    idle(1);

    // T37 never gets an action: p0's draw phase finds an empty deck → showdown
    expect(s.phase).toBe('gameOver');
    expect(s.players[0].deck).toHaveLength(0);
    expect(legalActions(s, 0)).toHaveLength(0);
    expect(legalActions(s, 1)).toHaveLength(0);

    // Showdown under §10 partial-hand scoring: p0's two tens are a PAIR
    // (category 1) and beat p1's 10-high (category 0).
    expect(s.players[0].bank.map((x) => x.id)).toEqual(['0:10♠', '0:10♦']);
    expect(s.players[1].bank.map((x) => x.id)).toEqual(['1:10♣', '1:8♦']);
    expect(s.result?.hands[0].category).toBe(1);
    expect(s.result?.hands[0].name).toBe('pair');
    expect(s.result?.hands[1].category).toBe(0);
    expect(s.result?.winner).toBe(0);

    // Every subsystem left a trace in the event log
    for (const t of [
      'MulliganTaken', 'MonsterSummoned', 'MonsterSet', 'MonsterSacrificed', 'JokerCast',
      'SpellSet', 'SpellCast', 'SpellActivated', 'EffectNegated', 'AttackDeclared',
      'MonsterFlipped', 'FlipTriggered', 'PositionChanged', 'CombatResolved',
      'MonsterDestroyed', 'MonsterSpecialSummoned', 'MonsterReturnedToHand', 'WallPunish',
      'BankTriggerAwarded', 'CardBanked', 'BankCardRemoved',
      'PolyStarted', 'PolyCardDrawn', 'PolyStand', 'PolyBust', 'HandRevealed',
      'CardsDrawn', 'CardsMilled', 'CardDiscarded', 'PowerChanged', 'DeckOut', 'GameEnded',
    ]) {
      expect(events.some((e) => e.type === t), `expected event ${t}`).toBe(true);
    }
    // ...including one flip trigger for each effect rank that HAS an effect
    for (const rank of ['A', '2', '3', '4', '5', '6', '7', '8']) {
      expect(
        events.some((e) => e.type === 'FlipTriggered' && e.effect === `default:${rank}`),
        `expected a flip trigger for rank ${rank}`,
      ).toBe(true);
    }
  });
});
