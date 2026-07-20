// Run reducer: node flows, duels-as-black-box, strikes, rewards, economy,
// sticker application, events, boss, and determinism.

import { describe, expect, it } from 'vitest';
import { EFFECT_SPECS, getEffectSpec } from '@house-rules/engine';
import { ECONOMY, RUN_CONFIG } from '../src/data/config.js';
import { PACKS } from '../src/data/packs.js';
import { STARTER_DISCOVERIES } from '../src/data/seed.js';
import {
  applyRun,
  favorUnlocked,
  finishRun,
  legalRunActions,
  newAccount,
  newRun,
  unlockedFavors,
} from '../src/reducer.js';
import { FAVORS } from '../src/data/favors.js';
import type { RunAction, RunEvent, RunState } from '../src/types.js';
import { accountWithFavors, lineMap, steps, testRun, types } from './helpers.js';

/** Walk: pickNode → startDuel → duelOutcome, for a run sitting on the map. */
function playDuelNode(run: RunState, nodeId: string, won: boolean, draw = false) {
  return steps(
    run,
    { type: 'pickNode', nodeId },
    { type: 'startDuel' },
    { type: 'duelOutcome', won, draw },
  );
}

/** Resolve any queued reward picks/appliers by skipping them (tests that only care about what follows). */
function skipRewards(run: RunState): { run: RunState; events: RunEvent[] } {
  const events: RunEvent[] = [];
  let guard = 0;
  while (
    (run.pendingChoice?.type === 'pickSticker' || run.pendingChoice?.type === 'applySticker') &&
    guard++ < 20
  ) {
    const action: RunAction =
      run.pendingChoice.type === 'pickSticker'
        ? { type: 'pickSticker', effectId: run.pendingChoice.options[0]! }
        : { type: 'applySticker', cardId: null };
    const r = applyRun(run, action);
    run = r.run;
    events.push(...r.events);
  }
  return { run, events };
}

describe('run setup', () => {
  it('newRun: 3 strikes, allowance currency, a fresh 54-card deck, seeded map', () => {
    const run = newRun(newAccount(), 7);
    expect(run.strikes).toBe(3);
    expect(run.currency).toBe(ECONOMY.startingAllowance);
    expect(run.deck).toHaveLength(54);
    expect(run.deck.every((c) => c.owner === 0 && c.stickerStack.length === 0)).toBe(true);
    expect(run.discoveryPool).toEqual(STARTER_DISCOVERIES);
    expect(run.outcome).toBe('active');
    expect(run.pendingChoice).toBeNull();
    // reachable now: every column-0 node
    const legal = legalRunActions(run);
    const picks = legal.filter((a) => a.type === 'pickNode');
    expect(picks.length).toBeGreaterThanOrEqual(2);
  });

  it('newRun is deterministic from the seed; runs serialize round-trip', () => {
    const a = newRun(newAccount(), 42);
    const b = newRun(newAccount(), 42);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });

  it('sharpie-stash favor: run starts with a common sticker to apply', () => {
    const run = newRun(accountWithFavors('sharpie-stash'), 5, ['sharpie-stash']);
    expect(run.pendingChoice?.type).toBe('applySticker');
    const effectId = (run.pendingChoice as { effectId: string }).effectId;
    expect(getEffectSpec(effectId)?.tier).toBe('common');
  });

  it('favors must be owned and at most 2 equip', () => {
    expect(() => newRun(newAccount(), 1, ['second-wind'])).toThrow();
    expect(() =>
      newRun(accountWithFavors('pack-rat', 'lucky-coin', 'do-over'), 1, [
        'pack-rat',
        'lucky-coin',
        'do-over',
      ]),
    ).toThrow();
  });
});

describe('duel nodes', () => {
  it('pickNode duel → startDuel yields a DuelSpec on the run baseline (ante 5, greedy)', () => {
    const run = testRun({ map: lineMap('duel') });
    const r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'startDuel' });
    expect(r.run.pendingChoice?.type).toBe('duel');
    const spec = (r.run.pendingChoice as { spec: { config: typeof RUN_CONFIG } }).spec;
    expect(spec.config.ante).toBe(5);
    expect(spec.config).toEqual(RUN_CONFIG);
    const full = (r.run.pendingChoice as never as { spec: import('../src/types.js').DuelSpec }).spec;
    expect(full.agentName).toBe('greedy');
    expect(full.humanDeck).toHaveLength(54);
    expect(types(r.events)).toContain('DuelStarted');
  });

  it('duel win: currency + a pick-1-of-3 reward, then back to the map', () => {
    const run = testRun({ map: lineMap('duel', 'duel') });
    let r = playDuelNode(run, 'n0-0', true);
    expect(r.run.currency).toBe(ECONOMY.startingAllowance + 20);
    // REVISION 2: every win offers a sticker pick (unlock-enabled)
    expect(r.run.pendingChoice).toMatchObject({ type: 'pickSticker', unlock: true });
    const options = (r.run.pendingChoice as { options: string[] }).options;
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThanOrEqual(3);
    expect(options.every((id) => getEffectSpec(id)?.poolable)).toBe(true);
    const after = skipRewards(r.run);
    expect(after.run.pendingChoice).toBeNull();
    expect(after.run.stats.duels).toEqual([
      { nodeId: 'n0-0', encounterId: 'standard', won: true },
    ]);
    expect(after.run.stats.currencyCurve).toHaveLength(1);
  });

  it('picking an undiscovered reward option unlocks it (THE discovery channel)', () => {
    const account = newAccount();
    account.discoveryPool = []; // nothing from the catalog unlocked yet
    const run = testRun({ map: lineMap('duel'), account });
    run.pendingChoice = { type: 'pickSticker', options: ['needle', 'peek'], unlock: true };
    const r = steps(run, { type: 'pickSticker', effectId: 'needle' });
    expect(r.run.discoveryPool).toEqual(['needle']);
    expect(r.run.discoveredThisRun).toEqual(['needle']);
    expect(types(r.events)).toContain('EffectDiscovered');
    // picking an already-unlocked (or pre-discovered default) effect does not re-discover
    const run2 = testRun({ map: lineMap('duel') });
    run2.pendingChoice = { type: 'pickSticker', options: ['peek', 'default:4'], unlock: true };
    const r2 = steps(run2, { type: 'pickSticker', effectId: 'default:4' });
    expect(types(r2.events)).not.toContain('EffectDiscovered');
  });

  it('duel loss: 1 strike; 3 losses end the run at the summary', () => {
    let run = testRun({ map: lineMap('duel', 'duel', 'duel') });
    run = playDuelNode(run, 'n0-0', false).run;
    expect(run.strikes).toBe(2);
    expect(run.outcome).toBe('active');
    run = playDuelNode(run, 'n1-0', false).run;
    expect(run.strikes).toBe(1);
    const r = playDuelNode(run, 'n2-0', false);
    expect(r.run.strikes).toBe(0);
    expect(r.run.outcome).toBe('lost');
    expect(types(r.events)).toContain('RunLost');
    expect(legalRunActions(r.run)).toEqual([]);
  });

  it('a drawn duel costs no strike and grants no reward', () => {
    const run = testRun({ map: lineMap('duel') });
    const r = playDuelNode(run, 'n0-0', false, true);
    expect(r.run.strikes).toBe(3);
    expect(r.run.currency).toBe(ECONOMY.startingAllowance);
    expect(types(r.events)).toContain('DuelDrawn');
  });

  it('second-wind favor: the first loss costs no strike, the second does', () => {
    let run = testRun({
      map: lineMap('duel', 'duel'),
      account: accountWithFavors('second-wind'),
      favors: ['second-wind'],
    });
    const r1 = playDuelNode(run, 'n0-0', false);
    expect(r1.run.strikes).toBe(3);
    expect(types(r1.events)).toContain('SecondWindUsed');
    const r2 = playDuelNode(r1.run, 'n1-0', false);
    expect(r2.run.strikes).toBe(2);
  });

  it('elite: +1 ante cheat is a VISIBLE override; win offers a richer pick', () => {
    const run = testRun({ map: lineMap('elite') });
    let r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'startDuel' });
    const spec = (r.run.pendingChoice as { spec: import('../src/types.js').DuelSpec }).spec;
    expect(spec.config.overrides).toEqual([null, { ante: 6 }]);
    expect(spec.scrawls.length).toBeGreaterThan(0);
    r = steps(r.run, { type: 'duelOutcome', won: true });
    expect(r.run.pendingChoice).toMatchObject({ type: 'pickSticker', unlock: true });
  });
});

describe('stickers', () => {
  it('apply-on-acquisition: pick a card OR a Cheat Sheet suit slot, or skip', () => {
    const run = testRun({ map: lineMap('elite') });
    let r = playDuelNode(run, 'n0-0', true);
    const options = (r.run.pendingChoice as { options: string[] }).options;
    r = steps(r.run, { type: 'pickSticker', effectId: options[0]! });
    const effectId = (r.run.pendingChoice as { effectId: string }).effectId;
    expect(effectId).toBe(options[0]);
    const legal = legalRunActions(r.run).filter((a) => a.type === 'applySticker');
    // deck cards, the 4 sheet slots, and skip are all offered
    expect(legal.some((a) => a.type === 'applySticker' && a.cardId === null && !a.sheetSuit)).toBe(true);
    expect(legal.filter((a) => a.type === 'applySticker' && a.sheetSuit)).toHaveLength(4);
    const target = legal.find((a) => a.type === 'applySticker' && a.cardId !== null)!;
    r = steps(r.run, target);
    const card = r.run.deck.find((c) => c.id === (target as { cardId: string }).cardId)!;
    expect(card.stickerStack).toEqual([effectId]);
    expect(r.run.stickersApplied).toEqual([{ effectId, cardId: card.id }]);
    expect(r.run.stats.stickersApplied).toBe(1);
  });

  it('a sticker on the Cheat Sheet becomes YOUR suit spell in the next duel', () => {
    const run = testRun({ map: lineMap('duel') });
    run.pendingChoice = { type: 'applySticker', effectId: 'skim' };
    let r = steps(run, { type: 'applySticker', cardId: null, sheetSuit: '♦' });
    expect(r.run.sheetStickers).toEqual({ '♦': 'skim' });
    expect(r.run.stickersApplied).toEqual([{ effectId: 'skim', cardId: 'sheet:♦' }]);
    r = steps(r.run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'startDuel' });
    const spec = (r.run.pendingChoice as { spec: import('../src/types.js').DuelSpec }).spec;
    expect(spec.config.suitOverrides).toEqual([{ '♦': 'skim' }, null]); // yours only
    expect(spec.scrawls.some((s) => s.includes('♦'))).toBe(true);
  });

  it('skipping forfeits the sticker', () => {
    const run = testRun({ map: lineMap('elite') });
    const r = playDuelNode(run, 'n0-0', true);
    const after = skipRewards(r.run).run; // pick then skip the apply
    expect(after.deck.every((c) => c.stickerStack.length === 0)).toBe(true);
    expect(after.pendingChoice).toBeNull();
  });

  it('treasure: pick 1 of 3 discovered effects, then slot it', () => {
    const run = testRun({ map: lineMap('treasure') });
    let r = steps(run, { type: 'pickNode', nodeId: 'n0-0' });
    expect(r.run.pendingChoice?.type).toBe('pickSticker');
    const options = (r.run.pendingChoice as { options: string[] }).options;
    expect(options).toHaveLength(3);
    expect(new Set(options).size).toBe(3);
    r = steps(r.run, { type: 'pickSticker', effectId: options[0]! });
    expect(r.run.pendingChoice).toEqual({ type: 'applySticker', effectId: options[0] });
  });
});

describe('shop', () => {
  it('buy a pack → pick 1 of 3 → sticker application → back in the shop; packs restock', () => {
    const run = testRun({ map: lineMap('shop'), currency: 100 });
    let r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'buyPack', pack: 'cornerStore' });
    expect(r.run.currency).toBe(100 - PACKS.cornerStore.cost);
    expect(types(r.events)).toContain('PackOpened');
    // a pull offers pick-1-of-`choices` within the rolled tier
    expect(r.run.pendingChoice?.type).toBe('pickSticker');
    const options = (r.run.pendingChoice as { options: string[] }).options;
    expect(options.length).toBeGreaterThan(1);
    expect(options.length).toBeLessThanOrEqual(PACKS.cornerStore.choices);
    const tiers = new Set(options.map((id) => getEffectSpec(id)!.tier));
    expect(tiers.size).toBe(1); // all choices come from the one rolled tier
    r = steps(r.run, { type: 'pickSticker', effectId: options[0]! });
    expect(r.run.pendingChoice?.type).toBe('applySticker');
    const apply = legalRunActions(r.run).find(
      (a) => a.type === 'applySticker' && a.cardId !== null,
    )!;
    r = steps(r.run, apply);
    expect(r.run.pendingChoice?.type).toBe('shop'); // suspended shop restored
    // no per-visit stock limit by default (playtest feedback) — rebuy works
    r = steps(r.run, { type: 'buyPack', pack: 'cornerStore' });
    expect(r.run.currency).toBe(100 - 2 * PACKS.cornerStore.cost);
    expect(r.run.pendingChoice?.type).toBe('pickSticker');
  });

  it('trade binder guarantee resolves to the best implemented+discovered tier (grace)', () => {
    const run = testRun({ map: lineMap('shop'), currency: 100 });
    const r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'buyPack', pack: 'tradeBinder' });
    const granted = r.events.find((e) => e.type === 'StickerGranted')!;
    expect(granted.tier).toBe('uncommon'); // "rare" honestly degrades until rares exist
  });

  it('trim: costs currency, removes a picked card, floor 40 enforced', () => {
    const run = testRun({ map: lineMap('shop'), currency: 100 });
    let r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'buySingle', item: 'trim' });
    expect(r.run.pendingChoice?.type).toBe('removeCard');
    const cardId = r.run.deck[0]!.id;
    r = steps(r.run, { type: 'pickCard', cardId });
    expect(r.run.deck).toHaveLength(53);
    expect(r.run.deck.some((c) => c.id === cardId)).toBe(false);
    expect(r.run.pendingChoice?.type).toBe('shop');

    // at the floor the trim is not even offered
    const floored = testRun({ map: lineMap('shop'), currency: 100 });
    floored.deck = floored.deck.slice(0, ECONOMY.removalFloor);
    const r2 = steps(floored, { type: 'pickNode', nodeId: 'n0-0' });
    expect(
      legalRunActions(r2.run).some((a) => a.type === 'buySingle' && a.item === 'trim'),
    ).toBe(false);
  });

  it('favors are NOT sold in shops (between-run progression); pack-rat still discounts packs', () => {
    // no favor purchases in the shop's legal actions
    const inShop = steps(testRun({ map: lineMap('shop'), currency: 200 }), {
      type: 'pickNode',
      nodeId: 'n0-0',
    });
    expect(
      legalRunActions(inShop.run).every(
        (a) => !(a.type === 'buySingle' && (a as { item: string }).item !== 'trim'),
      ),
    ).toBe(true);
    // pack-rat equipped from the account loadout discounts packs
    const run = testRun({
      map: lineMap('shop'),
      currency: 200,
      account: accountWithFavors('pack-rat'),
      favors: ['pack-rat'],
    });
    let r = steps(run, { type: 'pickNode', nodeId: 'n0-0' });
    const before = r.run.currency;
    r = steps(r.run, { type: 'buyPack', pack: 'cornerStore' });
    expect(before - r.run.currency).toBe(Math.round(PACKS.cornerStore.cost * 0.85));
  });

  it('favor milestones: unlocks accrue as runs finish', () => {
    let account = newAccount();
    expect(unlockedFavors(account)).toEqual([]); // fresh save: nothing unlocked
    // finish one (lost) run → runsCompleted 1 → sharpie-stash unlocks
    const lost = steps(testRun({}), { type: 'abandonRun' }).run;
    account = finishRun(account, lost);
    expect(account.favorsOwned).toContain('sharpie-stash');
    expect(favorUnlocked(account, FAVORS.find((f) => f.id === 'do-over')!)).toBe(false);
    // equipping an un-unlocked favor is rejected
    expect(() => newRun(account, 1, ['do-over'])).toThrow();
    expect(() => newRun(account, 1, ['sharpie-stash'])).not.toThrow();
  });

  it('lucky-coin favor: bonus currency on shop entry', () => {
    const run = testRun({
      map: lineMap('shop'),
      account: accountWithFavors('lucky-coin'),
      favors: ['lucky-coin'],
    });
    const r = steps(run, { type: 'pickNode', nodeId: 'n0-0' });
    expect(r.run.currency).toBe(ECONOMY.startingAllowance + ECONOMY.luckyCoinBonus);
  });
});

describe('events', () => {
  it('recess: restores a strike only when one is missing', () => {
    let run = testRun({ map: lineMap('duel', { type: 'event', eventId: 'recess' }) });
    // at full strikes the rest choice is not legal
    const fresh = testRun({ map: lineMap({ type: 'event', eventId: 'recess' }) });
    const r0 = steps(fresh, { type: 'pickNode', nodeId: 'n0-0' });
    expect(
      legalRunActions(r0.run).some((a) => a.type === 'eventChoice' && a.choiceId === 'rest'),
    ).toBe(false);
    // lose a strike, then rest
    run = playDuelNode(run, 'n0-0', false).run;
    let r = steps(run, { type: 'pickNode', nodeId: 'n1-0' });
    r = steps(r.run, { type: 'eventChoice', choiceId: 'rest' });
    expect(r.run.strikes).toBe(3);
    expect(types(r.events)).toContain('StrikeRestored');
  });

  it('the bully: paying the toll costs currency; fighting spawns a handicapped elite duel', () => {
    const map = lineMap({ type: 'event', eventId: 'the-bully' });
    const pay = steps(
      testRun({ map }),
      { type: 'pickNode', nodeId: 'n0-0' },
      { type: 'eventChoice', choiceId: 'pay' },
    );
    expect(pay.run.currency).toBe(ECONOMY.startingAllowance - 15);
    expect(pay.run.pendingChoice).toBeNull();

    let fight = steps(
      testRun({ map }),
      { type: 'pickNode', nodeId: 'n0-0' },
      { type: 'eventChoice', choiceId: 'fight' },
      { type: 'startDuel' },
    );
    const spec = (fight.run.pendingChoice as { spec: import('../src/types.js').DuelSpec }).spec;
    expect(spec.config.overrides).toEqual([{ ante: 4 }, { ante: 6 }]); // your handicap is visible too
    fight = steps(fight.run, { type: 'duelOutcome', won: true });
    expect(fight.run.currency).toBe(ECONOMY.startingAllowance + 45);
    expect(fight.run.pendingChoice?.type).toBe('pickSticker'); // the win reward pick
  });

  it('swap meet: gated on having a sticker; moves the sticker between cards', () => {
    const map = lineMap({ type: 'event', eventId: 'swap-meet' });
    const bare = steps(testRun({ map }), { type: 'pickNode', nodeId: 'n0-0' });
    expect(
      legalRunActions(bare.run).some((a) => a.type === 'eventChoice' && a.choiceId === 'swap'),
    ).toBe(false);

    const run = testRun({ map });
    const five = run.deck.find((c) => c.rank === '5')!;
    five.stickerStack.push('peek');
    run.stickersApplied.push({ effectId: 'peek', cardId: five.id });
    let r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'eventChoice', choiceId: 'swap' });
    expect(r.run.pendingChoice?.type).toBe('moveSticker');
    const dest = r.run.deck.find((c) => c.rank === '7')!;
    r = steps(r.run, { type: 'moveSticker', fromCardId: five.id, toCardId: dest.id });
    expect(r.run.deck.find((c) => c.id === five.id)!.stickerStack).toEqual([]);
    expect(r.run.deck.find((c) => c.id === dest.id)!.stickerStack).toEqual(['peek']);
    expect(r.run.stickersApplied).toEqual([{ effectId: 'peek', cardId: dest.id }]);
  });

  it('double down: copies a COMMON sticker onto a second card', () => {
    const map = lineMap({ type: 'event', eventId: 'double-down' });
    const run = testRun({ map });
    const five = run.deck.find((c) => c.rank === '5')!;
    five.stickerStack.push('rally');
    let r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'eventChoice', choiceId: 'copy' });
    const dest = r.run.deck.find((c) => c.rank === '3')!;
    r = steps(r.run, { type: 'duplicateSticker', fromCardId: five.id, toCardId: dest.id });
    expect(r.run.deck.find((c) => c.id === dest.id)!.stickerStack).toEqual(['rally']);
    expect(r.run.deck.find((c) => c.id === five.id)!.stickerStack).toEqual(['rally']);
  });

  it('mystery box: the curse is a one-duel config patch consumed by the next duel', () => {
    // find a seed whose box roll comes up cursed (deterministic per seed)
    for (let seed = 1; seed < 40; seed++) {
      const map = lineMap({ type: 'event', eventId: 'mystery-box' }, 'duel');
      const run = testRun({ map, seed });
      let r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'eventChoice', choiceId: 'open' });
      if (!types(r.events).includes('TempModApplied')) continue;
      expect(r.run.tempMods).toHaveLength(1);
      r = steps(r.run, { type: 'pickNode', nodeId: 'n1-0' }, { type: 'startDuel' });
      const spec = (r.run.pendingChoice as { spec: import('../src/types.js').DuelSpec }).spec;
      expect(spec.config.handLimit).toBe(4); // cursed
      expect(spec.scrawls.some((s) => s.includes('CURSED'))).toBe(true);
      r = steps(r.run, { type: 'duelOutcome', won: true });
      expect(r.run.tempMods).toEqual([]); // consumed
      return;
    }
    throw new Error('no seed produced a cursed mystery box');
  });

  it('overtrim removes two cards', () => {
    const map = lineMap({ type: 'event', eventId: 'overtrim' });
    let r = steps(
      testRun({ map }),
      { type: 'pickNode', nodeId: 'n0-0' },
      { type: 'eventChoice', choiceId: 'trim2' },
    );
    const [a, b] = [r.run.deck[0]!.id, r.run.deck[1]!.id];
    r = steps(r.run, { type: 'pickCard', cardId: a }, { type: 'pickCard', cardId: b });
    expect(r.run.deck).toHaveLength(52);
    expect(r.run.pendingChoice).toBeNull();
  });
});

describe('boss', () => {
  it("the Grown-Up's cheat is data-driven, visible, and scrawled", () => {
    const run = testRun({ map: lineMap('duel') }); // boss node auto-appended
    let r = playDuelNode(run, 'n0-0', true);
    r = skipRewards(r.run);
    r = steps(r.run, { type: 'pickNode', nodeId: 'boss' }, { type: 'startDuel' });
    const spec = (r.run.pendingChoice as { spec: import('../src/types.js').DuelSpec }).spec;
    expect(spec.config.overrides).toEqual([null, { drawPerTurn: 3 }]);
    expect(spec.scrawls.join(' ')).toContain('HE DRAWS 3');
  });

  it('boss win → win pick, then pick-1-of-3 with ≥1 sheet mod → run WON; discoveries merge', () => {
    const account = newAccount();
    account.discoveryPool = []; // nothing from the catalog unlocked yet
    const run = testRun({ map: lineMap('duel'), account });
    let r = playDuelNode(run, 'n0-0', true);
    // resolve the win pick, PICKING any undiscovered catalog option (discovery)
    while (r.run.pendingChoice?.type === 'pickSticker' || r.run.pendingChoice?.type === 'applySticker') {
      if (r.run.pendingChoice.type === 'pickSticker') {
        const opts = r.run.pendingChoice.options;
        const fresh = opts.find((id) => !getEffectSpec(id)!.preDiscovered);
        r = steps(r.run, { type: 'pickSticker', effectId: fresh ?? opts[0]! });
      } else {
        r = steps(r.run, { type: 'applySticker', cardId: null });
      }
    }
    r = steps(r.run, { type: 'pickNode', nodeId: 'boss' }, { type: 'startDuel' }, {
      type: 'duelOutcome',
      won: true,
    });
    // boss win: the standard win pick comes first, then the boss pick-1-of-3
    r = skipRewards(r.run);
    expect(r.run.pendingChoice?.type).toBe('bossReward');
    const options = (r.run.pendingChoice as { options: { kind: string }[] }).options;
    expect(options).toHaveLength(3);
    expect(options.some((o) => o.kind === 'sheetMod')).toBe(true);
    const modIndex = options.findIndex((o) => o.kind === 'sheetMod');
    r = steps(r.run, { type: 'pickReward', index: modIndex });
    expect(r.run.outcome).toBe('won');
    expect(types(r.events)).toContain('RunWon');
    expect(r.run.sheetModsActive).toHaveLength(1);

    const after = finishRun(account, r.run);
    expect(after.runsCompleted).toBe(1);
    expect(after.runsWon).toBe(1);
    expect(after.discoveryPool.length).toBeGreaterThanOrEqual(run.discoveredThisRun.length);
  });

  it('boss loss with strikes left → strike + immediate rematch with a fresh duel seed', () => {
    const run = testRun({ map: lineMap('duel') });
    let r = playDuelNode(run, 'n0-0', true);
    r = skipRewards(r.run);
    r = steps(r.run, { type: 'pickNode', nodeId: 'boss' }, { type: 'startDuel' });
    const firstSeed = (r.run.pendingChoice as { spec: { duelSeed: number } }).spec.duelSeed;
    r = steps(r.run, { type: 'duelOutcome', won: false });
    expect(r.run.strikes).toBe(2);
    expect(r.run.pendingChoice?.type).toBe('startDuel');
    r = steps(r.run, { type: 'startDuel' });
    const secondSeed = (r.run.pendingChoice as { spec: { duelSeed: number } }).spec.duelSeed;
    expect(secondSeed).not.toBe(firstSeed);
  });

  it('sheet mods patch the whole duel config symmetrically', () => {
    const run = testRun({ map: lineMap('duel') });
    run.sheetModsActive = ['high-stakes', 'fast-rules'];
    const r = steps(run, { type: 'pickNode', nodeId: 'n0-0' }, { type: 'startDuel' });
    const spec = (r.run.pendingChoice as { spec: import('../src/types.js').DuelSpec }).spec;
    expect(spec.config.ante).toBe(8);
    expect(spec.config.drawPerTurn).toBe(3);
    expect(spec.scrawls).toHaveLength(2);
    expect(spec.config.overrides).toBeUndefined(); // symmetric: no per-seat cheat
  });
});

describe('misc', () => {
  it('abandonRun ends the run', () => {
    const r = steps(testRun({}), { type: 'abandonRun' });
    expect(r.run.outcome).toBe('lost');
    expect(types(r.events)).toContain('RunAbandoned');
  });

  it('every legalRunAction applies without throwing (random walk, duels stubbed)', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const pick = (n: number) => {
        // tiny deterministic LCG for the walk itself
        walkState = (Math.imul(walkState, 1664525) + 1013904223) >>> 0;
        return walkState % n;
      };
      let walkState = seed;
      let run = newRun(newAccount(), seed);
      let stepsTaken = 0;
      while (run.outcome === 'active') {
        if (++stepsTaken > 500) throw new Error(`seed ${seed}: run did not terminate`);
        const legal = legalRunActions(run);
        expect(legal.length).toBeGreaterThan(0);
        // avoid abandoning constantly: drop abandonRun unless it's the only action
        const usable = legal.filter((a) => a.type !== 'abandonRun');
        const action = (usable.length > 0 ? usable : legal)[pick(usable.length || 1)]!;
        run = applyRun(run, action).run;
      }
      expect(['won', 'lost']).toContain(run.outcome);
    }
  });

  it('registry sanity: the starter seed and every granted effect are implemented', () => {
    const ids = new Set(EFFECT_SPECS.map((d) => d.id));
    for (const id of STARTER_DISCOVERIES) expect(ids.has(id)).toBe(true);
  });
});
