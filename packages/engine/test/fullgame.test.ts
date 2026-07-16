// M1 exit criterion: a complete scripted game plays start-to-finish via unit
// tests alone. Stacked (preset) decks, every action explicit, final showdown
// asserted. Exercises: mulligan, summons & sacrifice tiers, set monsters,
// manual + attacked flips, the 2-flip chain, joker, ♠ negate, ♥ revive from
// the graveyard, Q buff via response window, Polymerization, attack/defense
// combat, direct attacks, bank triggers (bank / auto-skip), hand-limit
// discard, deck-out, and the poker showdown.

import { describe, expect, it } from 'vitest';
import { effectivePower } from '../src/cards.js';
import { applyAction } from '../src/reducer.js';
import { createRng } from '../src/rng.js';
import { setupGame } from '../src/setup.js';
import type { Action, GameCard, GameEvent, PlayerId, Rank, Suit } from '../src/types.js';
import { card } from './helpers.js';

const c = (owner: PlayerId, rank: Rank, suit: Suit | null = null) => card(owner, rank, suit);

// index 0..4 = opening hand, rest = library top→bottom
const P0_DECK: GameCard[] = [
  c(0, '4', '♠'), c(0, '7', '♠'), c(0, 'J', '♥'), c(0, 'K', '♦'), c(0, 'JOKER'),
  c(0, '10', '♠'), c(0, 'A', '♠'), c(0, 'Q', '♥'), c(0, '5', '♣'), c(0, '8', '♠'),
  c(0, 'K', '♠'), c(0, '9', '♥'), c(0, '2', '♠'), c(0, '3', '♠'), c(0, '6', '♠'),
  c(0, 'J', '♦'), c(0, '10', '♥'), c(0, '5', '♠'),
];
const P1_DECK: GameCard[] = [
  c(1, '5', '♦'), c(1, '9', '♦'), c(1, 'J', '♠'), c(1, '2', '♥'), c(1, 'Q', '♣'),
  c(1, '8', '♦'), c(1, '6', '♦'), c(1, '4', '♥'), c(1, 'K', '♥'), c(1, '10', '♦'),
  c(1, '3', '♦'), c(1, '7', '♥'), c(1, 'A', '♦'), c(1, '6', '♥'), c(1, '9', '♣'),
  c(1, '4', '♦'), c(1, '2', '♦'), c(1, '7', '♦'),
];

describe('full scripted game', () => {
  it('plays 18 turns to deck-out and the showdown', () => {
    const rng = createRng(2026);
    let s = setupGame(rng, { decks: [P0_DECK, P1_DECK], firstPlayer: 0 }).state;
    const events: GameEvent[] = [];
    const step = (a: Action) => {
      const r = applyAction(s, a, rng);
      s = r.state;
      events.push(...r.events);
    };
    const pass = (p: PlayerId) => step({ type: 'pass', player: p });
    const next = (p: PlayerId) => step({ type: 'nextPhase', player: p });

    // --- Mulligan: both keep ---
    step({ type: 'mulligan', player: 0, discardHandIndices: [] });
    step({ type: 'mulligan', player: 1, discardHandIndices: [] });
    expect(s.phase).toBe('main1');
    expect(s.players[0].hand).toHaveLength(5); // first player skipped the draw

    // --- Turn 1 (p0): summon, Joker, direct attack, bank ---
    step({ type: 'summon', player: 0, handIndex: 0, zoneIndex: 0, mode: 'attack' }); // 4♠ (uid1)
    step({ type: 'castJoker', player: 0, handIndex: 3 });
    pass(0); pass(1); // Pot of Greed resolves: draw 10♠, A♠
    expect(s.players[0].hand.map((x) => x.rank)).toEqual(['7', 'J', 'K', '10', 'A']);
    next(0); // → battle
    expect(s.phase).toBe('battle');
    step({ type: 'declareAttack', player: 0, attackerZone: 0, direct: true });
    pass(0); pass(1);
    expect(s.pending).toEqual({ type: 'bankTrigger', player: 0 });
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 3 }); // bank 10♠
    expect(s.players[0].bank.map((x) => x.id)).toEqual(['0:10♠']);
    next(0); next(0); // → main2 → end
    expect(s.turn).toBe(2);

    // --- Turn 2 (p1): set a monster, set a trap ---
    step({ type: 'summon', player: 1, handIndex: 3, zoneIndex: 0, mode: 'set' }); // 2♥ (uid2)
    step({ type: 'setSpell', player: 1, handIndex: 2, zoneIndex: 0 }); // J♠ face-down
    next(1); next(1); next(1);
    expect(s.turn).toBe(3);

    // --- Turn 3 (p0): sacrifice summon; J destroyed... no — NEGATED; attack into the 2-flip ---
    expect(s.players[0].hand.map((x) => x.rank)).toEqual(['7', 'J', 'K', 'A', 'Q']);
    step({ type: 'summon', player: 0, handIndex: 0, zoneIndex: 0, mode: 'attack', sacrificeZoneIndices: [0] }); // 7♠ (uid3) over 4♠
    step({ type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'rank', targetMonsterUid: 2 }); // J♥ at the set 2♥
    const jId = s.stack[0]!.id;
    pass(0);
    step({ type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 0 }, mode: 'suit', targetStackItemId: jId }); // ♠ NEGATE
    pass(1); pass(0);
    expect(s.stack).toHaveLength(0);
    expect(s.players[1].monsters[0]).not.toBeNull(); // 2♥ saved
    expect(s.players[0].graveyard.map((x) => x.id)).toContain('0:J♥');
    expect(s.players[1].graveyard.map((x) => x.id)).toContain('1:J♠');
    step({ type: 'setSpell', player: 0, handIndex: 2, zoneIndex: 0 }); // set Q♥ for later
    next(0); // → battle (p1 has no activatable sets left)
    step({ type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }); // 7♠ into the set 2♥
    pass(0); pass(1); // attack resolves: 2♥ flips, its 2-effect wants a target
    expect(s.pending).toMatchObject({ type: 'flipTarget', player: 1 });
    step({ type: 'chooseFlipTarget', player: 1, monsterUid: 3 }); // flip the ATTACKER's position
    pass(0); pass(1); // 2-effect resolves: 7♠ → defense
    pass(0); pass(1); // combat fizzles: attacker no longer in attack position
    expect(s.players[0].monsters[0]?.position).toBe('defense');
    expect(s.players[1].monsters[0]?.position).toBe('defense'); // flipped face-up, survived
    next(0); next(0);
    expect(s.turn).toBe(4);

    // --- Turn 4 (p1): sacrifice the 2♥ for 5♦; set Q♣; p0 passes response windows ---
    step({ type: 'summon', player: 1, handIndex: 0, zoneIndex: 0, mode: 'attack', sacrificeZoneIndices: [0] }); // 5♦ (uid4)
    step({ type: 'setSpell', player: 1, handIndex: 1, zoneIndex: 0 }); // Q♣
    next(1);
    expect(s.pendingWindow).toEqual({ to: 'battle' });
    expect(s.priority).toBe(0); // p0's set Q♥ keeps the window open
    pass(0);
    next(1); pass(0);
    next(1); pass(0);
    expect(s.turn).toBe(5);

    // --- Turn 5 (p0): position change, set A♠, Polymerization; p1 Q-buffs in the window ---
    expect(s.players[0].hand.map((x) => x.rank)).toEqual(['K', 'A', '5']);
    step({ type: 'changePosition', player: 0, zoneIndex: 0 }); // 7♠ back to attack
    step({ type: 'summon', player: 0, handIndex: 1, zoneIndex: 1, mode: 'set' }); // A♠ (uid5)
    step({ type: 'castSpell', player: 0, source: { from: 'hand', handIndex: 0 }, mode: 'suit', targetMonsterUid: 3 }); // K♦ → Poly on 7♠
    pass(0); pass(1);
    expect(s.poly?.total).toBe(18); // dealt 8♠ + K♠
    step({ type: 'polyStand', player: 0 });
    expect(s.players[0].monsters[0]?.power).toBe(9); // ceil(18/2)
    next(0); // window: p1 responds with the set Q♣
    step({ type: 'castSpell', player: 1, source: { from: 'zone', zoneIndex: 0 }, mode: 'rank', targetMonsterUid: 4, discardHandIndex: 1 }); // discard 8♦: 5♦ +8
    pass(1); pass(0);
    expect(effectivePower(s.players[1].monsters[0]!)).toBe(13);
    expect(s.phase).toBe('battle'); // window auto-closed after the response resolved
    next(0); next(0); // no attacks into the buffed wall
    expect(s.turn).toBe(6);
    expect(effectivePower(s.players[1].monsters[0]!)).toBe(5); // Q buff expired at end of turn

    // --- Turn 6 (p1): set 4♥ ---
    step({ type: 'summon', player: 1, handIndex: 2, zoneIndex: 1, mode: 'set' }); // 4♥ (uid6)
    next(1); pass(0); next(1); pass(0); next(1); pass(0);
    expect(s.turn).toBe(7);

    // --- Turn 7 (p0): ♥ revive from own grave, flip the Ace, big battle phase ---
    step({
      type: 'castSpell', player: 0, source: { from: 'zone', zoneIndex: 0 }, mode: 'suit',
      graveTarget: { player: 0, cardId: '0:4♠' }, summonPosition: 'attack',
    }); // Q♥ revives the sacrificed 4♠
    pass(0); pass(1);
    expect(s.players[0].monsters[2]?.card.id).toBe('0:4♠'); // uid7, no flip trigger
    step({ type: 'flipMonster', player: 0, zoneIndex: 1 }); // flip A♠
    pass(0); pass(1);
    expect(effectivePower(s.players[0].monsters[1]!)).toBe(11);
    next(0); // → battle
    step({ type: 'declareAttack', player: 0, attackerZone: 1, targetZone: 0 }); // A♠(11) vs 5♦
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 1 }); // bank 9♥
    step({ type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 1 }); // 7♠(9) into set 4♥
    pass(0); pass(1); // attack resolves: 4♥ flips, its draw-1 trigger stacks
    pass(0); pass(1); // flip resolves: p1 draws K♥
    pass(0); pass(1); // combat: 9 > 4, wall destroyed, no trigger
    expect(s.players[1].monsters[1]).toBeNull();
    expect(s.players[1].hand.map((x) => x.id)).toContain('1:K♥');
    step({ type: 'declareAttack', player: 0, attackerZone: 2, direct: true }); // 4♠ direct
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }); // bank 5♣
    expect(s.players[0].bank.map((x) => x.id)).toEqual(['0:10♠', '0:9♥', '0:5♣']);
    next(0); next(0);
    expect(s.turn).toBe(8);
    expect(effectivePower(s.players[0].monsters[1]!)).toBe(1); // Ace pump expired

    // --- Turn 8 (p1): nothing playable (everything needs sacrifices) ---
    next(1); next(1); next(1);
    expect(s.turn).toBe(9);

    // --- Turn 9 (p0): direct attacks; empty-handed triggers auto-skip ---
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 0, direct: true });
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }); // bank the drawn 2♠
    step({ type: 'declareAttack', player: 0, attackerZone: 1, direct: true });
    pass(0); pass(1);
    expect(s.pending).toBeNull(); // nothing to bank, nothing to remove → skipped
    next(0); next(0);
    expect(s.turn).toBe(10);

    // --- Turn 10 (p1): set the drawn 3♦ ---
    step({ type: 'summon', player: 1, handIndex: 4, zoneIndex: 0, mode: 'set' }); // 3♦ (uid8)
    next(1); next(1); next(1);

    // --- Turn 11 (p0): attack the set 3♦ (reveal flip), bank 3♠ ---
    next(0);
    step({ type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 });
    pass(0); pass(1); // flip 3♦, its reveal-hand trigger stacks
    pass(0); pass(1); // reveal resolves (information only)
    pass(0); pass(1); // combat: 9 > 3
    expect(events.some((e) => e.type === 'HandRevealed')).toBe(true);
    expect(s.players[1].monsters[0]).toBeNull();
    step({ type: 'declareAttack', player: 0, attackerZone: 1, direct: true });
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }); // bank 3♠
    next(0); next(0);
    expect(s.turn).toBe(12);

    // --- Turns 12-18: p1 top-decks, p0 grinds the bank, decks tick down ---
    next(1); next(1); next(1); // turn 12: nothing

    next(0); // turn 13
    step({ type: 'declareAttack', player: 0, attackerZone: 0, direct: true });
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }); // bank 6♠
    next(0); next(0);

    step({ type: 'summon', player: 1, handIndex: 5, zoneIndex: 0, mode: 'attack' }); // turn 14: A♦ (uid9)
    next(1); next(1); next(1);

    next(0); // turn 15
    step({ type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }); // 7♠(9) kills A♦(1)
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }); // bank J♦
    next(0); next(0);

    next(1); next(1); next(1); // turn 16: nothing

    next(0); // turn 17
    step({ type: 'declareAttack', player: 0, attackerZone: 0, direct: true });
    pass(0); pass(1);
    step({ type: 'bankChoice', player: 0, choice: 'bank', handIndex: 0 }); // bank 10♥
    next(0); next(0);
    expect(s.turn).toBe(18);

    // --- Turn 18 (p1): over the hand limit at end of turn ---
    next(1); next(1); next(1);
    expect(s.pending).toEqual({ type: 'discard', player: 1 });
    step({ type: 'discardCard', player: 1, handIndex: 0 });

    // --- Turn 19 never happens: p0's draw empties their deck → showdown ---
    expect(s.phase).toBe('gameOver');
    expect(s.deckOut).toBe(true);
    expect(s.players[0].deck).toHaveLength(0);
    expect(s.result?.winner).toBe(0);
    expect(s.result?.hands[0].category).toBe(1); // pair of 10s
    const bestIds = s.result!.hands[0].cards.map((x) => x.id);
    expect(bestIds).toContain('0:10♠');
    expect(bestIds).toContain('0:10♥');
    expect(s.result?.hands[1].category).toBe(-1); // empty bank = partial hand
    expect(s.players[0].bank).toHaveLength(8);

    // the fine-grained event log covered every subsystem
    for (const t of [
      'MulliganTaken', 'MonsterSummoned', 'MonsterSet', 'MonsterSacrificed', 'JokerCast',
      'SpellSet', 'SpellCast', 'SpellActivated', 'EffectNegated', 'AttackDeclared',
      'MonsterFlipped', 'FlipTriggered', 'PositionChanged', 'CombatResolved',
      'MonsterDestroyed', 'MonsterSpecialSummoned', 'BankTriggerAwarded', 'CardBanked',
      'BankTriggerSkipped', 'PolyStarted', 'PolyCardDrawn', 'PolyStand', 'HandRevealed',
      'CardsDrawn', 'CardDiscarded', 'PowerChanged', 'DeckOut', 'GameEnded',
    ]) {
      expect(events.some((e) => e.type === t), `expected event ${t}`).toBe(true);
    }
  });
});
