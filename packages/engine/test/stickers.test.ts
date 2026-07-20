// REVISION 2: slotless stickers + context-free effects. Every implemented
// effect gets at least one scripted test; the drift test pins name/text to the
// engine registry through the effective-effect path; cross-context tests prove
// one effect definition resolves as flip AND spell.

import { describe, expect, it } from 'vitest';
import { effectivePower } from '../src/cards.js';
import {
  EFFECT_SPECS,
  canApplySticker,
  describeEffect,
  effectiveCardEffect,
  effectiveFlipEffect,
  effectiveSuitEffect,
  getEffectSpec,
} from '../src/effects.js';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { deserialize, serialize } from '../src/serialize.js';
import { viewFor } from '../src/view.js';
import type { EffectId, GameCard, Rank } from '../src/types.js';
import { card, makeState, mon, resolveStack, rng0, run, types } from './helpers.js';

function stickered(c: GameCard, ...ids: EffectId[]): GameCard {
  return { ...c, stickerStack: ids };
}

/** flipMonster zone 0 for p0, activate the flip decision. */
function flipZone0(state: ReturnType<typeof makeState>) {
  return run(
    state,
    rng0(),
    { type: 'flipMonster', player: 0, zoneIndex: 0 },
    { type: 'flipChoice', player: 0, choice: 'activate' },
  );
}

describe('sticker registry / drift fix', () => {
  it('every spec has an id, tier, non-empty name/text; describeEffect matches', () => {
    expect(EFFECT_SPECS.length).toBeGreaterThanOrEqual(26); // 9 catalog + 17 defaults
    for (const spec of EFFECT_SPECS) {
      expect(spec.id.length).toBeGreaterThan(0);
      expect(['common', 'uncommon', 'rare']).toContain(spec.tier);
      expect(spec.name.length).toBeGreaterThan(0);
      expect(spec.text.length).toBeGreaterThan(0);
      expect(describeEffect(spec.id)).toEqual({ name: spec.name, text: spec.text });
    }
  });

  it('the tooltip path resolves a stickered card to the STICKER text, not the default', () => {
    const c = stickered(card(0, '5', '♠'), 'peek');
    const eff = effectiveFlipEffect(c);
    expect(eff).toBe('peek');
    expect(describeEffect(eff).text).toBe(getEffectSpec('peek')!.text);
    expect(describeEffect(eff).text).not.toBe(describeEffect('default:5').text);
    // unstickered cards keep the engine-owned default text
    expect(effectiveFlipEffect(card(0, '5', '♠'))).toBe('default:5');
    expect(describeEffect('default:5').text).toContain('mill 2');
  });

  it('describeEffect covers every default id (all ranks, suits, JOKER)', () => {
    for (const rank of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'JOKER'])
      expect(describeEffect(`default:${rank}`).text.length).toBeGreaterThan(0);
    for (const suit of ['♠', '♥', '♣', '♦'])
      expect(describeEffect(`default:${suit}`).text.length).toBeGreaterThan(0);
    expect(() => describeEffect('nonsense')).toThrow();
  });

  it('slotless: any sticker fits any card except Jokers (REVISION 2)', () => {
    const peek = getEffectSpec('peek')!;
    const leverage = getEffectSpec('leverage')!;
    const poly = getEffectSpec('default:♦')!;
    for (const rank of ['A', '2', '5', '9', '10', 'J', 'Q', 'K']) {
      const c = card(0, rank as Rank, '♠');
      expect(canApplySticker(c, peek)).toBe(true);
      expect(canApplySticker(c, leverage)).toBe(true);
      expect(canApplySticker(c, poly)).toBe(true);
    }
    expect(canApplySticker(card(0, 'JOKER', null), peek)).toBe(false);
  });

  it('a face-card sticker replaces the RANK spell; the suit spell comes from the Cheat Sheet', () => {
    const j = stickered(card(0, 'J', '♦'), 'peek');
    expect(effectiveCardEffect(j)).toBe('peek'); // rank slot covered
    // suit effect: printed default, unless the player's sheet is stickered
    expect(effectiveSuitEffect(undefined, 0, '♦')).toBe('default:♦');
    const overrides: [Partial<Record<'♦', string>>, null] = [{ '♦': 'skim' }, null];
    expect(effectiveSuitEffect(overrides, 0, '♦')).toBe('skim');
    expect(effectiveSuitEffect(overrides, 1, '♦')).toBe('default:♦'); // only YOURS
  });

  it('defaults are poolable pre-discovered stickers; effect-less 9/10 are not poolable', () => {
    expect(getEffectSpec('default:4')!.poolable).toBe(true);
    expect(getEffectSpec('default:4')!.preDiscovered).toBe(true);
    expect(getEffectSpec('default:♦')!.poolable).toBe(true);
    expect(getEffectSpec('default:9')!.poolable).toBe(false);
    expect(getEffectSpec('default:10')!.poolable).toBe(false);
    expect(getEffectSpec('peek')!.preDiscovered).toBe(false);
  });
});

describe('cross-context resolution (one definition, any trigger)', () => {
  it('a sticker on a FACE card casts as its rank spell (peek on a Jack)', () => {
    const state = makeState({
      p0: { hand: [stickered(card(0, 'J', '♠'), 'peek')] },
    });
    const casts = legalActions(state, 0).filter(
      (a) => a.type === 'castSpell' && a.mode === 'rank',
    );
    expect(casts).toHaveLength(1); // peek needs no target
    let r = run(state, rng0(), casts[0]!);
    expect(r.state.stack.at(-1)).toMatchObject({ kind: 'spell', effect: 'peek' });
    r = resolveStack(r.state, rng0());
    expect(r.state.pending).toEqual({ type: 'peekArrange', player: 0, count: 3 });
  });

  it('a DEFAULT effect as a sticker: draw-1 on a 9 fires on flip', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '9', '♠'), 'default:4'), 'set', 1)] },
    });
    const r = resolveStack(flipZone0(state).state, rng0());
    expect(r.state.players[0].hand).toHaveLength(1); // drew 1
    expect(types(r.events)).toContain('CardsDrawn');
  });

  it('a Cheat Sheet suit sticker replaces YOUR suit spell only (skim over ♦ Poly)', () => {
    const state = makeState({
      config: { suitOverrides: [{ '♦': 'skim' }, null] },
      p0: {
        hand: [card(0, 'J', '♦')],
        monsters: [mon(card(0, '5', '♠'), 'attack', 1)],
      },
      p1: { hand: [card(1, 'J', '♦')] },
    });
    // p0's ♦ is now skim (no target); poly would have required a target
    const suitCasts = legalActions(state, 0).filter(
      (a) => a.type === 'castSpell' && a.mode === 'suit',
    );
    expect(suitCasts).toHaveLength(1);
    let r = run(state, rng0(), suitCasts[0]!);
    expect(r.state.stack.at(-1)).toMatchObject({ kind: 'spell', effect: 'skim' });
    r = resolveStack(r.state, rng0());
    expect(r.state.players[0].graveyard.map((c) => c.id)).toContain('0:filler-0'); // milled
    // the AI's sheet is untouched: its ♦ still enumerates as Poly (own face-up target)
    const s2 = makeState({
      config: { suitOverrides: [{ '♦': 'skim' }, null] },
      activePlayer: 1,
      p1: { hand: [card(1, 'J', '♦')], monsters: [mon(card(1, '5', '♠'), 'attack', 9)] },
    });
    const aiSuit = legalActions(s2, 1).filter((a) => a.type === 'castSpell' && a.mode === 'suit');
    expect(aiSuit).toEqual([
      expect.objectContaining({ mode: 'suit', targetMonsterUid: 9 }),
    ]);
  });

  it('a fuel effect as a FLIP: default:Q on a 5 prompts for discard + target, then buffs', () => {
    const state = makeState({
      p0: {
        hand: [card(0, '7', '♥')],
        monsters: [
          mon(stickered(card(0, '5', '♠'), 'default:Q'), 'set', 1),
          mon(card(0, '3', '♣'), 'attack', 2),
        ],
      },
    });
    let r = flipZone0(state);
    expect(r.state.pending).toMatchObject({ type: 'flipTarget', effect: 'default:Q' });
    const legal = legalActions(r.state, 0);
    // targets: the flipped 5 (now face-up) and the 3 — each with the one discard
    expect(legal.every((a) => a.type === 'chooseFlipTarget' && a.discardHandIndex === 0)).toBe(true);
    const pick = legal.find((a) => a.type === 'chooseFlipTarget' && a.monsterUid === 2)!;
    r = run(r.state, rng0(), pick);
    expect(r.state.players[0].hand).toHaveLength(0); // fuel paid at pick time
    r = resolveStack(r.state, rng0());
    expect(effectivePower(r.state.players[0].monsters[1]!)).toBe(10); // 3 + 7
  });

  it("an 'own monster' effect as a SPELL picks its subject: default:A on a Queen", () => {
    const state = makeState({
      p0: {
        hand: [stickered(card(0, 'Q', '♥'), 'default:A')],
        monsters: [mon(card(0, '2', '♠'), 'attack', 1)],
      },
    });
    const casts = legalActions(state, 0).filter(
      (a) => a.type === 'castSpell' && a.mode === 'rank',
    );
    expect(casts).toEqual([expect.objectContaining({ targetMonsterUid: 1 })]);
    let r = run(state, rng0(), casts[0]!);
    r = resolveStack(r.state, rng0());
    expect(effectivePower(r.state.players[0].monsters[0]!)).toBe(11);
  });

  it('Poly as a flip effect: ♦ default stickered onto a 6 blackjacks a friendly monster', () => {
    const state = makeState({
      p0: {
        deck: [card(0, '8', '♠', 'd1'), card(0, '9', '♠', 'd2'), card(0, '4', '♦', 'd3')],
        monsters: [
          mon(stickered(card(0, '6', '♣'), 'default:♦'), 'set', 1),
          mon(card(0, '4', '♥'), 'attack', 2),
        ],
      },
    });
    let r = flipZone0(state);
    expect(r.state.pending).toMatchObject({ type: 'flipTarget', effect: 'default:♦' });
    r = run(r.state, rng0(), { type: 'chooseFlipTarget', player: 0, monsterUid: 2 });
    r = resolveStack(r.state, rng0());
    expect(r.state.poly).not.toBeNull(); // blackjack sub-game running
    expect(r.state.poly!.total).toBe(4); // starts at the TARGET's card value
    r = run(r.state, rng0(), { type: 'polyStand', player: 0 });
    expect(effectivePower(r.state.players[0].monsters[1]!)).toBe(2); // ⌈4/2⌉
  });
});

describe('seed commons (flip-context behaviour)', () => {
  it('peek: look at top 3, rearrange in any order (declinable, view-gated)', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '5', '♠'), 'peek'), 'set', 1)] },
    });
    let r = flipZone0(state);
    expect(r.state.stack.at(-1)).toMatchObject({ kind: 'flip', effect: 'peek' });
    r = resolveStack(r.state, rng0());
    expect(r.state.pending).toEqual({ type: 'peekArrange', player: 0, count: 3 });
    expect(types(r.events)).toContain('DeckPeeked');

    // controller sees the peeked cards; the opponent does not
    expect(viewFor(r.state, 0).you.deckTop?.map((c) => c.id)).toEqual([
      '0:filler-0',
      '0:filler-1',
      '0:filler-2',
    ]);
    expect(viewFor(r.state, 1).opponent.deckTop).toBeUndefined();

    // all 6 permutations are legal; nothing else is
    const legal = legalActions(r.state, 0);
    expect(legal).toHaveLength(6);
    expect(legal.every((a) => a.type === 'peekArrange')).toBe(true);

    r = run(r.state, rng0(), { type: 'peekArrange', player: 0, order: [2, 0, 1] });
    expect(r.state.players[0].deck.slice(0, 4).map((c) => c.id)).toEqual([
      '0:filler-2',
      '0:filler-0',
      '0:filler-1',
      '0:filler-3',
    ]);
    expect(r.state.pending).toBeNull();
  });

  it('peek: a bad order (not a permutation) is rejected', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '5', '♠'), 'peek'), 'set', 1)] },
    });
    const r = resolveStack(flipZone0(state).state, rng0());
    expect(() =>
      applyAction(r.state, { type: 'peekArrange', player: 0, order: [0, 0, 1] }, rng0()),
    ).toThrow();
    expect(() =>
      applyAction(r.state, { type: 'peekArrange', player: 0, order: [0, 1] }, rng0()),
    ).toThrow();
  });

  it('skim: mill 1 from own deck, then draw 1', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '4', '♠'), 'skim'), 'set', 1)] },
    });
    const r = resolveStack(flipZone0(state).state, rng0());
    expect(r.state.players[0].graveyard.map((c) => c.id)).toEqual(['0:filler-0']);
    expect(r.state.players[0].hand.map((c) => c.id)).toEqual(['0:filler-1']);
    expect(r.state.players[0].deck).toHaveLength(6);
  });

  it('rally: your OTHER face-up attack monsters get +1 until end of turn', () => {
    const state = makeState({
      p0: {
        monsters: [
          mon(stickered(card(0, '3', '♠'), 'rally'), 'set', 1),
          mon(card(0, '5', '♥'), 'attack', 2),
          mon(card(0, '4', '♣'), 'defense', 3),
        ],
      },
      p1: { monsters: [mon(card(1, '6', '♠'), 'attack', 4)] },
    });
    const r = resolveStack(flipZone0(state).state, rng0());
    const p0 = r.state.players[0].monsters;
    expect(effectivePower(p0[0]!)).toBe(3); // itself: unchanged
    expect(effectivePower(p0[1]!)).toBe(6); // other attacker: +1
    expect(effectivePower(p0[2]!)).toBe(4); // defense: unchanged
    expect(effectivePower(r.state.players[1].monsters[0]!)).toBe(6); // opponent: unchanged
    expect(p0[1]!.tempAdds[0]).toEqual({ value: 1, expiresTurn: r.state.turn });
  });

  it('doorstop: survives losing combat as a flipped defender; attacker survives too', () => {
    const state = makeState({
      phase: 'battle',
      activePlayer: 1,
      p0: { monsters: [mon(stickered(card(0, '3', '♠'), 'doorstop'), 'set', 1)] },
      p1: { monsters: [mon(card(1, '9', '♥'), 'attack', 2)] },
    });
    let r = run(state, rng0(), { type: 'declareAttack', player: 1, attackerZone: 0, targetZone: 0 });
    r = resolveStack(r.state, rng0()); // auto-activates the doorstop flip, then combat
    expect(types(r.events)).toContain('CombatSurvived');
    expect(r.state.players[0].monsters[0]).not.toBeNull(); // 3 survived the 9
    expect(r.state.players[0].monsters[0]!.position).toBe('defense');
    expect(r.state.players[1].monsters[0]).not.toBeNull();
  });

  it('doorstop: a protected attacker that loses is not destroyed and the winner gets NO bank trigger', () => {
    // RULES-GAP reading under test: no destruction ⇒ no bank trigger.
    const state = makeState({
      turn: 5,
      p0: {
        monsters: [mon(stickered(card(0, '3', '♠'), 'doorstop'), 'set', 1)],
      },
      p1: { monsters: [mon(card(1, '9', '♥'), 'attack', 2)], hand: [card(1, '2', '♦')] },
    });
    // p0 flips doorstop in main1 (immune for turn 5), then attacks the bigger 9.
    let r = flipZone0(state);
    r = resolveStack(r.state, rng0());
    expect(r.state.players[0].monsters[0]!.combatImmuneTurn).toBe(5);
    r = run(r.state, rng0(), { type: 'nextPhase', player: 0 });
    expect(r.state.phase).toBe('battle');
    r = run(r.state, rng0(), { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 });
    r = resolveStack(r.state, rng0());
    expect(types(r.events)).toContain('CombatSurvived');
    expect(r.state.players[0].monsters[0]).not.toBeNull(); // survived
    expect(r.state.pending).toBeNull(); // no bank trigger for the defender
  });

  it('doorstop: immunity expires with the turn and round-trips', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '3', '♠'), 'doorstop'), 'set', 1)] },
    });
    const r = resolveStack(flipZone0(state).state, rng0());
    const m = r.state.players[0].monsters[0]!;
    expect(m.combatImmuneTurn).toBe(r.state.turn); // next turn's combat ignores it
    const s2 = deserialize(serialize(r.state));
    expect(s2.players[0].monsters[0]!.combatImmuneTurn).toBe(r.state.turn);
  });

  it('needle: opponent reveals hand, controller picks the discard', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '7', '♠'), 'needle'), 'set', 1)] },
      p1: { hand: [card(1, 'K', '♠'), card(1, '3', '♥')] },
    });
    const r = resolveStack(flipZone0(state).state, rng0());
    expect(types(r.events)).toContain('HandRevealed');
    expect(r.state.pending).toEqual({ type: 'needlePick', player: 0 });
    const legal = legalActions(r.state, 0);
    expect(legal).toHaveLength(2);
    const r2 = run(r.state, rng0(), { type: 'needlePick', player: 0, handIndex: 1 });
    expect(r2.state.players[1].hand.map((c) => c.id)).toEqual(['1:K♠']);
    expect(r2.state.players[1].graveyard.map((c) => c.id)).toEqual(['1:3♥']);
  });

  it('needle: empty opponent hand reveals nothing to pick and just resolves', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '7', '♠'), 'needle'), 'set', 1)] },
    });
    const r = resolveStack(flipZone0(state).state, rng0());
    expect(r.state.pending).toBeNull();
  });

  it('scavenge: a random graveyard card returns to hand', () => {
    const state = makeState({
      p0: {
        monsters: [mon(stickered(card(0, '6', '♠'), 'scavenge'), 'set', 1)],
        graveyard: [card(0, 'A', '♠'), card(0, '2', '♠'), card(0, '3', '♠')],
      },
    });
    const r = resolveStack(flipZone0(state).state, rng0());
    expect(types(r.events)).toContain('CardRecovered');
    expect(r.state.players[0].hand).toHaveLength(1);
    expect(r.state.players[0].graveyard).toHaveLength(2);
  });

  it('warning-shot: reveals an opposing face-down WITHOUT its flip effect; stays in defense', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '8', '♠'), 'warning-shot'), 'set', 1)] },
      p1: {
        monsters: [mon(card(1, 'A', '♦'), 'set', 2), mon(card(1, '6', '♠'), 'attack', 3)],
      },
    });
    let r = flipZone0(state);
    expect(r.state.pending).toMatchObject({ type: 'flipTarget', effect: 'warning-shot' });
    // only the OPPOSING face-down monster is a legal target
    const legal = legalActions(r.state, 0);
    expect(legal).toEqual([{ type: 'chooseFlipTarget', player: 0, monsterUid: 2 }]);
    r = run(r.state, rng0(), { type: 'chooseFlipTarget', player: 0, monsterUid: 2 });
    r = resolveStack(r.state, rng0());
    const revealed = r.state.players[1].monsters[0]!;
    expect(revealed.position).toBe('defense'); // face-up defense (RULES-GAP: conservative)
    // the revealed Ace's flip effect did NOT trigger: no pending, no tempSet
    expect(r.state.pending).toBeNull();
    expect(revealed.tempSet).toBeUndefined();
  });

  it('warning-shot: with no opposing face-down monster the trigger fizzles', () => {
    const state = makeState({
      p0: { monsters: [mon(stickered(card(0, '8', '♠'), 'warning-shot'), 'set', 1)] },
      p1: { monsters: [mon(card(1, '6', '♠'), 'attack', 2)] },
    });
    let r = flipZone0(state);
    expect(r.state.pending).toBeNull(); // no targets: nothing to pick
    r = resolveStack(r.state, rng0());
    expect(types(r.events)).toContain('EffectFizzled');
  });
});

describe('seed uncommons (cast-context behaviour)', () => {
  it('leverage: discard a FACE card → your monster +3 until end of turn', () => {
    const state = makeState({
      p0: {
        hand: [stickered(card(0, 'Q', '♠'), 'leverage'), card(0, 'K', '♥'), card(0, '7', '♣')],
        monsters: [mon(card(0, '3', '♠'), 'attack', 1)],
      },
    });
    // number-card discard is illegal for leverage
    expect(() =>
      applyAction(
        state,
        {
          type: 'castSpell',
          player: 0,
          source: { from: 'hand', handIndex: 0 },
          mode: 'rank',
          targetMonsterUid: 1,
          discardHandIndex: 2,
        },
        rng0(),
      ),
    ).toThrow();
    // legalActions only offers face-card discards for the leverage cast
    const casts = legalActions(state, 0).filter(
      (a) => a.type === 'castSpell' && a.mode === 'rank',
    );
    expect(casts.length).toBeGreaterThan(0);
    expect(
      casts.every((a) => a.type === 'castSpell' && a.discardHandIndex === 1),
    ).toBe(true);

    let r = run(state, rng0(), {
      type: 'castSpell',
      player: 0,
      source: { from: 'hand', handIndex: 0 },
      mode: 'rank',
      targetMonsterUid: 1,
      discardHandIndex: 1,
    });
    expect(r.state.stack.at(-1)).toMatchObject({ kind: 'spell', effect: 'leverage', amount: 3 });
    r = resolveStack(r.state, rng0());
    const m = r.state.players[0].monsters[0]!;
    expect(effectivePower(m)).toBe(6); // 3 + 3
    expect(m.tempAdds[0]).toEqual({ value: 3, expiresTurn: r.state.turn }); // end-of-turn only
    expect(r.state.players[0].graveyard.map((c) => c.id)).toContain('0:K♥'); // cost paid
  });

  it("executioner's toll: destroys power ≤ 5, face-up only; > 5 and set are illegal", () => {
    const state = makeState({
      p0: { hand: [stickered(card(0, 'J', '♦'), 'executioners-toll')] },
      p1: {
        monsters: [
          mon(card(1, '5', '♠'), 'attack', 1),
          mon(card(1, '6', '♠'), 'attack', 2),
          mon(card(1, '3', '♣'), 'set', 3),
        ],
      },
    });
    const rankCasts = legalActions(state, 0).filter(
      (a) => a.type === 'castSpell' && a.mode === 'rank',
    );
    expect(rankCasts).toEqual([
      expect.objectContaining({ mode: 'rank', targetMonsterUid: 1 }),
    ]);
    for (const uid of [2, 3]) {
      expect(() =>
        applyAction(
          state,
          {
            type: 'castSpell',
            player: 0,
            source: { from: 'hand', handIndex: 0 },
            mode: 'rank',
            targetMonsterUid: uid,
          },
          rng0(),
        ),
      ).toThrow();
    }
    let r = run(state, rng0(), rankCasts[0]!);
    r = resolveStack(r.state, rng0());
    expect(r.state.players[1].monsters[0]).toBeNull();
    expect(r.state.players[1].graveyard.map((c) => c.id)).toEqual(['1:5♠']);
  });

  it("executioner's toll: fizzles at resolution if the target got pumped above 5", () => {
    // Toll cast on a 5; a set Q pumps it to 9 in response; toll fizzles.
    const state = makeState({
      p0: { hand: [stickered(card(0, 'J', '♦'), 'executioners-toll')] },
      p1: {
        hand: [card(1, '4', '♥')],
        monsters: [mon(card(1, '5', '♠'), 'attack', 1)],
        spellTraps: [{ card: card(1, 'Q', '♥'), setTurn: 2 }],
      },
    });
    let r = run(state, rng0(), {
      type: 'castSpell',
      player: 0,
      source: { from: 'hand', handIndex: 0 },
      mode: 'rank',
      targetMonsterUid: 1,
    });
    // p0 passes priority; p1 responds with the set Q (+4 to its own 5 → 9)
    r = run(r.state, rng0(), { type: 'pass', player: 0 }, {
      type: 'castSpell',
      player: 1,
      source: { from: 'zone', zoneIndex: 0 },
      mode: 'rank',
      targetMonsterUid: 1,
      discardHandIndex: 0,
    });
    r = resolveStack(r.state, rng0());
    expect(effectivePower(r.state.players[1].monsters[0]!)).toBe(9);
    expect(r.state.players[1].monsters[0]).not.toBeNull(); // toll fizzled
    expect(types(r.events)).toContain('EffectFizzled');
  });
});
