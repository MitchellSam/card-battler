// applyRunAction: the pure event-sourced run reducer (M4 Part B). Never
// mutates its input; all randomness flows through the injected SeededRNG whose
// state is checkpointed into RunState.rngState so saved runs resume the same
// stream. Duels stay OUTSIDE this reducer: startDuel yields a DuelSpec, the
// shell plays it (GameSession in the browser, agents in tests) and feeds back
// duelOutcome.

import {
  EFFECT_SPECS,
  canApplySticker,
  createDeck,
  createRng,
  describeEffect,
  getEffectSpec,
  type EffectTier,
  type RulesConfig,
  type SeededRNG,
  type Suit,
} from '@house-rules/engine';
import { ECONOMY, MAP_CONFIG, RUN_CONFIG } from './data/config.js';
import { ENCOUNTERS } from './data/encounters.js';
import { EVENTS } from './data/events.js';
import { FAVORS } from './data/favors.js';
import { PACKS } from './data/packs.js';
import { SHEET_MODS } from './data/sheetMods.js';
import { STARTER_DISCOVERIES } from './data/seed.js';
import { generateMap, nodeById, reachableNodes } from './mapgen.js';
import {
  IllegalRunActionError,
  type Account,
  type BossRewardOption,
  type DuelSpec,
  type EventOutcome,
  type FavorDef,
  type FavorId,
  type PackDef,
  type RunAction,
  type RunEvent,
  type RunPending,
  type RunState,
} from './types.js';

const RUN_VERSION = 1;
const MAX_STRIKES = 3;

interface Ctx {
  run: RunState;
  events: RunEvent[];
  rng: SeededRNG;
}

function fail(message: string, action?: RunAction): never {
  throw new IllegalRunActionError(message, action);
}

/** Stable 32-bit duel seed from runSeed + nodeId — whole runs replay deterministically. */
export function duelSeedFor(runSeed: number, nodeId: string): number {
  let h = runSeed >>> 0;
  for (let i = 0; i < nodeId.length; i++) h = (Math.imul(h, 31) + nodeId.charCodeAt(i)) >>> 0;
  return h;
}

// ---------------------------------------------------------------------------
// Account & run factories
// ---------------------------------------------------------------------------

export function newAccount(): Account {
  return {
    version: RUN_VERSION,
    discoveryPool: [...STARTER_DISCOVERIES],
    allowance: ECONOMY.startingAllowance,
    banList: [],
    banSlots: ECONOMY.startingBanSlots,
    favorsOwned: [],
    runsCompleted: 0,
    runsWon: 0,
  };
}

/** REVISION 2: has this account hit the favor's unlock milestone? */
export function favorUnlocked(account: Account, favor: FavorDef): boolean {
  switch (favor.unlock.kind) {
    case 'runsCompleted':
      return account.runsCompleted >= favor.unlock.count;
    case 'runsWon':
      return account.runsWon >= favor.unlock.count;
    case 'discoveries':
      return account.discoveryPool.length >= favor.unlock.count;
  }
}

/** The favors this account may equip at run start. */
export function unlockedFavors(account: Account): FavorDef[] {
  return FAVORS.filter((f) => favorUnlocked(account, f));
}

export function newRun(account: Account, runSeed: number, favorsEquipped: FavorId[] = []): RunState {
  if (favorsEquipped.length > ECONOMY.favorSlots) fail(`at most ${ECONOMY.favorSlots} favors`);
  const unlocked = new Set([...account.favorsOwned, ...unlockedFavors(account).map((f) => f.id)]);
  for (const id of favorsEquipped) if (!unlocked.has(id)) fail(`favor not unlocked: ${id}`);
  const rng = createRng(runSeed);
  const run: RunState = {
    version: RUN_VERSION,
    runSeed,
    rngState: 0,
    act: 1,
    nodeMap: generateMap(rng),
    position: null,
    strikes: MAX_STRIKES,
    currency: account.allowance,
    deck: createDeck(0), // seat 0 is always the human
    stickersApplied: [],
    sheetStickers: {},
    sheetModsActive: [],
    tempMods: [],
    favorsEquipped: [...favorsEquipped],
    favorUses: { secondWind: false },
    discoveryPool: [...account.discoveryPool],
    discoveredThisRun: [],
    banList: [...account.banList],
    pendingChoice: null,
    queued: [],
    stats: { nodesVisited: [], duels: [], currencyCurve: [], strikesLost: 0, stickersApplied: 0 },
    outcome: 'active',
  };
  // Sharpie Stash favor: one extra random common sticker at run start.
  if (favorsEquipped.includes('sharpie-stash')) {
    const commons = discoveredOfTier(run, 'common');
    if (commons.length > 0)
      run.pendingChoice = { type: 'applySticker', effectId: commons[rng.int(commons.length)]! };
  }
  run.rngState = rng.getState();
  return run;
}

/** Merge a finished run back into the account (spec §8: discoveries carry over). */
export function finishRun(account: Account, run: RunState): Account {
  if (run.outcome === 'active') fail('run is still active');
  const next: Account = {
    ...account,
    discoveryPool: [...new Set([...account.discoveryPool, ...run.discoveredThisRun])],
    runsCompleted: account.runsCompleted + 1,
    runsWon: account.runsWon + (run.outcome === 'won' ? 1 : 0),
  };
  // REVISION 2: favors unlock from milestones — recompute against the new counts.
  next.favorsOwned = [
    ...new Set([...account.favorsOwned, ...unlockedFavors(next).map((f) => f.id)]),
  ];
  return next;
}

// ---------------------------------------------------------------------------
// Sticker pools & grace degradation
// ---------------------------------------------------------------------------

const TIERS: EffectTier[] = ['common', 'uncommon', 'rare'];

/** Is this effect unlocked for this run? Base-game defaults always are. */
function isDiscovered(run: RunState, id: string): boolean {
  const spec = getEffectSpec(id);
  return spec !== undefined && (spec.preDiscovered || run.discoveryPool.includes(id));
}

/** ALL implemented poolable effects of a tier (win offers), minus the ban list. */
function implementedOfTier(run: RunState, tier: EffectTier): string[] {
  return EFFECT_SPECS.filter(
    (s) => s.poolable && s.tier === tier && !run.banList.includes(s.id),
  ).map((s) => s.id);
}

/** Unlocked poolable effects of a tier (packs / grants / treasure picks). */
function discoveredOfTier(run: RunState, tier: EffectTier): string[] {
  return implementedOfTier(run, tier).filter((id) => isDiscovered(run, id));
}

/**
 * Grace degradation (Part B): any tier reference resolves to the best
 * available tier ≤ it — "guaranteed rare" honestly yields an uncommon until
 * rares exist.
 */
function graceTierBy(pool: (tier: EffectTier) => string[], tier: EffectTier): EffectTier | null {
  for (let i = TIERS.indexOf(tier); i >= 0; i--)
    if (pool(TIERS[i]!).length > 0) return TIERS[i]!;
  return null;
}

function graceTier(run: RunState, tier: EffectTier): EffectTier | null {
  return graceTierBy((t) => discoveredOfTier(run, t), tier);
}

/** Weighted tier roll (packs, win-reward picks). */
function rollWeightedTier(weights: Record<EffectTier, number>, rng: SeededRNG): EffectTier {
  const total = TIERS.reduce((s, t) => s + weights[t], 0);
  let roll = rng.float() * total;
  for (const t of TIERS) {
    roll -= weights[t];
    if (roll <= 0) return t;
  }
  return 'common';
}

function bestAvailableTier(run: RunState): EffectTier | null {
  return graceTier(run, 'rare');
}

function rollPackTier(run: RunState, pack: PackDef, rng: SeededRNG): EffectTier | null {
  if (pack.guarantee === 'best-available') return bestAvailableTier(run);
  return graceTier(run, rollWeightedTier(pack.weights, rng));
}

/**
 * REVISION 2: the every-win reward — pick-1-of-`count`, each option's tier
 * rolled with the encounter's weights, drawn from ALL implemented effects
 * (already-discovered included; undiscovered picks unlock — see pickSticker).
 */
function offerRewardPick(
  ctx: Ctx,
  pick: { count: number; weights: Record<EffectTier, number> },
): void {
  const { run, rng } = ctx;
  const options: string[] = [];
  for (let i = 0; i < pick.count; i++) {
    const tier = graceTierBy((t) => implementedOfTier(run, t), rollWeightedTier(pick.weights, rng));
    if (!tier) continue;
    const pool = implementedOfTier(run, tier).filter((id) => !options.includes(id));
    if (pool.length === 0) continue;
    options.push(pool[rng.int(pool.length)]!);
  }
  if (options.length === 0) return;
  ctx.events.push({ type: 'RewardOffered', options });
  pushPending(ctx, { type: 'pickSticker', options, unlock: true });
}

/** Random discovered effect of the (graced) tier → StickerGranted + applySticker pending. */
function grantSticker(ctx: Ctx, tier: EffectTier): void {
  const graced = graceTier(ctx.run, tier);
  if (!graced) return; // nothing discovered at all — cannot happen with the seed 9
  const pool = discoveredOfTier(ctx.run, graced);
  const effectId = pool[ctx.rng.int(pool.length)]!;
  ctx.events.push({ type: 'StickerGranted', effectId, tier: graced, requestedTier: tier });
  pushPending(ctx, { type: 'applySticker', effectId });
}

/** Sample n distinct discovered effects (for treasure / Yard Sale picks). */
function sampleDiscovered(ctx: Ctx, n: number): string[] {
  const pool = TIERS.flatMap((t) => discoveredOfTier(ctx.run, t));
  const out: string[] = [];
  while (out.length < n && pool.length > 0) out.push(pool.splice(ctx.rng.int(pool.length), 1)[0]!);
  return out;
}

/** Sample n distinct discovered effects of ONE tier (pack pull choices). */
function sampleOfTier(ctx: Ctx, tier: EffectTier, n: number): string[] {
  const pool = discoveredOfTier(ctx.run, tier);
  const out: string[] = [];
  while (out.length < n && pool.length > 0) out.push(pool.splice(ctx.rng.int(pool.length), 1)[0]!);
  return out;
}

// ---------------------------------------------------------------------------
// Pending queue: pendingChoice is the head; suspended pendings wait in queued.
// ---------------------------------------------------------------------------

function pushPending(ctx: Ctx, p: RunPending): void {
  if (ctx.run.pendingChoice === null) ctx.run.pendingChoice = p;
  else ctx.run.queued.push(p);
}

/** Resolve the head pending; when everything is drained the node is done. */
function completePending(ctx: Ctx): void {
  const { run } = ctx;
  run.pendingChoice = run.queued.shift() ?? null;
  if (run.pendingChoice !== null || run.outcome !== 'active') return;
  // Node fully resolved: sample the instrumentation curve; finish after boss.
  run.stats.currencyCurve.push(run.currency);
  if (run.bossRewardTaken !== undefined) {
    run.outcome = 'won';
    ctx.events.push({ type: 'RunWon', discoveries: run.discoveredThisRun });
  }
}

function gainCurrency(ctx: Ctx, amount: number, why: string): void {
  ctx.run.currency += amount;
  ctx.events.push({ type: 'CurrencyGained', amount, why });
}

function spendCurrency(ctx: Ctx, amount: number, why: string, action?: RunAction): void {
  if (ctx.run.currency < amount) fail(`cannot afford ${why} (${amount})`, action);
  ctx.run.currency -= amount;
  ctx.events.push({ type: 'CurrencySpent', amount, why });
}

// ---------------------------------------------------------------------------
// Duels
// ---------------------------------------------------------------------------

function buildDuelSpec(run: RunState, nodeId: string, encounterId: string): DuelSpec {
  const enc = ENCOUNTERS[encounterId];
  if (!enc) fail(`unknown encounter: ${encounterId}`);
  const config: RulesConfig = { ...RUN_CONFIG };
  const scrawls: string[] = [];
  for (const modId of run.sheetModsActive) {
    const mod = SHEET_MODS.find((m) => m.id === modId);
    if (mod) {
      Object.assign(config, mod.patch);
      scrawls.push(mod.scrawl);
    }
  }
  for (const tm of run.tempMods) {
    Object.assign(config, tm.patch);
    scrawls.push(tm.label);
  }
  if (enc.humanOverrides || enc.aiOverrides) {
    config.overrides = [enc.humanOverrides ?? null, enc.aiOverrides ?? null];
    if (enc.scrawl) scrawls.push(enc.scrawl);
  }
  // REVISION 2: Cheat Sheet suit stickers change YOUR suit spells only.
  const sheetSuits = Object.keys(run.sheetStickers) as Suit[];
  if (sheetSuits.length > 0) {
    config.suitOverrides = [{ ...run.sheetStickers }, null];
    for (const suit of sheetSuits)
      scrawls.push(`MY ${suit} IS "${describeEffect(run.sheetStickers[suit]!).name}" NOW. —Sam`);
  }
  // Rematches (a survived boss loss) get a fresh but still deterministic seed.
  const attempt = run.stats.duels.filter((d) => d.nodeId === nodeId).length;
  return {
    config,
    humanDeck: structuredClone(run.deck),
    agentName: enc.agentName,
    duelSeed: duelSeedFor(run.runSeed, `${nodeId}#${attempt}`),
    nodeId,
    encounterId,
    scrawls,
    doOver: run.favorsEquipped.includes('do-over'),
  };
}

function handleDuelOutcome(ctx: Ctx, action: Extract<RunAction, { type: 'duelOutcome' }>): void {
  const { run, events, rng } = ctx;
  if (run.pendingChoice?.type !== 'duel') fail('no duel in progress', action);
  const spec = run.pendingChoice.spec;
  const enc = ENCOUNTERS[spec.encounterId]!;
  run.pendingChoice = null;
  run.tempMods = []; // one-duel patches are consumed win or lose
  run.stats.duels.push({
    nodeId: spec.nodeId,
    encounterId: spec.encounterId,
    won: action.won,
    ...(action.stats?.turns !== undefined ? { turns: action.stats.turns } : {}),
    ...(action.stats?.seconds !== undefined ? { seconds: action.stats.seconds } : {}),
  });

  if (action.draw) {
    // Neither a win nor a loss (see the RULES-GAP note on the action type).
    events.push({ type: 'DuelDrawn', nodeId: spec.nodeId });
    if (spec.encounterId === 'boss') {
      pushPending(ctx, { type: 'startDuel', nodeId: spec.nodeId, encounterId: 'boss' });
      return;
    }
    if (run.pendingChoice === null) completePending(ctx);
    return;
  }
  if (!action.won) {
    events.push({ type: 'DuelLost', nodeId: spec.nodeId });
    if (run.favorsEquipped.includes('second-wind') && !run.favorUses.secondWind) {
      run.favorUses.secondWind = true;
      events.push({ type: 'SecondWindUsed' });
    } else {
      run.strikes -= 1; // flat, boss included (ratified)
      run.stats.strikesLost += 1;
      events.push({ type: 'StrikeLost', strikes: run.strikes });
      if (run.strikes <= 0) {
        run.outcome = 'lost';
        events.push({ type: 'RunLost', at: spec.nodeId });
        return;
      }
    }
    if (spec.encounterId === 'boss') {
      // RULES-GAP: (provisional) the docs are silent on what follows a
      // survivable boss loss; the boss is the only exit, so the conservative
      // completable reading is an immediate rematch.
      pushPending(ctx, { type: 'startDuel', nodeId: spec.nodeId, encounterId: 'boss' });
      return;
    }
    if (run.pendingChoice === null) completePending(ctx);
    return;
  }

  events.push({ type: 'DuelWon', nodeId: spec.nodeId });
  gainCurrency(ctx, enc.rewardCurrency, spec.encounterId);
  // REVISION 2: every win pays a pick-1-of-N sticker choice; picking an
  // undiscovered option is the discovery channel.
  offerRewardPick(ctx, enc.rewardPick);
  if (spec.encounterId === 'boss') {
    // Pick-1-of-3 with ≥1 sheet mod, plus the currency already granted.
    const inactive = SHEET_MODS.filter((m) => !run.sheetModsActive.includes(m.id));
    const mods = inactive.length > 0 ? inactive : SHEET_MODS;
    const options: BossRewardOption[] = [
      { kind: 'sheetMod', modId: mods[rng.int(mods.length)]!.id },
      { kind: 'sticker', tier: bestAvailableTier(run) ?? 'common' },
      { kind: 'currency', amount: ECONOMY.bossCurrencyOption },
    ];
    events.push({ type: 'BossRewardOffered', options });
    pushPending(ctx, { type: 'bossReward', options });
    return;
  }
  if (run.pendingChoice === null) completePending(ctx);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function requirementMet(run: RunState, req: string): boolean {
  switch (req) {
    case 'strikesBelowMax':
      return run.strikes < MAX_STRIKES;
    case 'hasAnySticker':
      return run.deck.some((c) => c.stickerStack.length > 0);
    case 'hasCommonSticker':
      return run.deck.some((c) => {
        const top = c.stickerStack[c.stickerStack.length - 1];
        return top !== undefined && getEffectSpec(top)?.tier === 'common';
      });
    case 'deckAboveFloor':
      return run.deck.length > ECONOMY.removalFloor;
    default:
      return false;
  }
}

function applyOutcome(ctx: Ctx, o: EventOutcome): void {
  const { run, events, rng } = ctx;
  switch (o.kind) {
    case 'gainCurrency':
      gainCurrency(ctx, o.amount, 'event');
      break;
    case 'loseCurrency': {
      const lost = Math.min(run.currency, o.amount);
      run.currency -= lost;
      events.push({ type: 'CurrencyLost', amount: lost });
      break;
    }
    case 'grantSticker':
      grantSticker(ctx, o.tier);
      break;
    case 'grantPack':
      openPack(ctx, PACKS[o.pack]);
      break;
    case 'pickSticker': {
      const options = sampleDiscovered(ctx, o.count);
      if (options.length > 0) pushPending(ctx, { type: 'pickSticker', options });
      break;
    }
    case 'removeCard':
      if (run.deck.length > ECONOMY.removalFloor)
        pushPending(ctx, { type: 'removeCard', remaining: o.count });
      break;
    case 'restoreStrike':
      run.strikes = Math.min(MAX_STRIKES, run.strikes + o.amount);
      events.push({ type: 'StrikeRestored', strikes: run.strikes });
      break;
    case 'moveSticker':
      pushPending(ctx, { type: 'moveSticker' });
      break;
    case 'duplicateSticker':
      pushPending(ctx, { type: 'duplicateSticker' });
      break;
    case 'eliteDuel':
      pushPending(ctx, { type: 'startDuel', nodeId: run.position!, encounterId: o.encounterId });
      break;
    case 'tempMod':
      run.tempMods.push({ patch: o.patch, label: o.label });
      events.push({ type: 'TempModApplied', label: o.label });
      break;
    case 'random':
      for (const inner of rng.float() < o.chance ? o.win : o.lose) applyOutcome(ctx, inner);
      break;
  }
}

function handleEventChoice(ctx: Ctx, action: Extract<RunAction, { type: 'eventChoice' }>): void {
  const { run, events } = ctx;
  if (run.pendingChoice?.type !== 'event') fail('no event pending', action);
  const def = EVENTS.find((e) => e.id === (run.pendingChoice as { eventId: string }).eventId);
  if (!def) fail('unknown event');
  const choice = def.choices.find((c) => c.id === action.choiceId);
  if (!choice) fail(`no such choice: ${action.choiceId}`, action);
  for (const req of choice.requires ?? [])
    if (!requirementMet(run, req)) fail(`requirement not met: ${req}`, action);
  run.pendingChoice = null;
  if (choice.cost) spendCurrency(ctx, choice.cost, def.id, action);
  for (const o of choice.outcomes) applyOutcome(ctx, o);
  events.push({ type: 'EventResolved', eventId: def.id, choiceId: choice.id });
  if (run.pendingChoice === null) completePending(ctx);
}

// ---------------------------------------------------------------------------
// Shop & packs
// ---------------------------------------------------------------------------

function packCost(run: RunState, pack: PackDef): number {
  const discount = run.favorsEquipped.includes('pack-rat') ? ECONOMY.packRatDiscount : 0;
  return Math.round(pack.cost * (1 - discount));
}

function openPack(ctx: Ctx, pack: PackDef): void {
  const pulls =
    1 +
    (pack.id === 'tradeBinder' && ctx.run.favorsEquipped.includes('trade-binder-regular') ? 1 : 0);
  ctx.events.push({ type: 'PackOpened', pack: pack.id, pulls });
  for (let i = 0; i < pulls; i++) {
    const tier = rollPackTier(ctx.run, pack, ctx.rng);
    if (!tier) continue;
    // Playtest feedback: a pull is pick-1-of-`choices` within the rolled tier
    // (falls back to a straight grant when the tier pool is that small).
    const options = sampleOfTier(ctx, tier, Math.max(1, pack.choices));
    if (options.length === 0) continue;
    ctx.events.push({ type: 'StickerGranted', tier, options });
    if (options.length === 1) pushPending(ctx, { type: 'applySticker', effectId: options[0]! });
    else pushPending(ctx, { type: 'pickSticker', options });
  }
}

function handleBuyPack(ctx: Ctx, action: Extract<RunAction, { type: 'buyPack' }>): void {
  const { run } = ctx;
  if (run.pendingChoice?.type !== 'shop') fail('not in a shop', action);
  const shop = run.pendingChoice;
  const pack = PACKS[action.pack];
  if (!pack) fail(`unknown pack: ${action.pack}`, action);
  if (
    pack.stockPerVisit !== undefined &&
    shop.bought.filter((k) => k === pack.id).length >= pack.stockPerVisit
  )
    fail('pack sold out for this visit', action);
  spendCurrency(ctx, packCost(run, pack), pack.id, action);
  shop.bought.push(pack.id);
  // Suspend the shop while the pulled sticker(s) get applied, then return.
  run.pendingChoice = null;
  openPack(ctx, pack);
  if (run.pendingChoice === null) run.pendingChoice = shop;
  else run.queued.push(shop);
}

function handleBuySingle(ctx: Ctx, action: Extract<RunAction, { type: 'buySingle' }>): void {
  const { run } = ctx;
  if (run.pendingChoice?.type !== 'shop') fail('not in a shop', action);
  const shop = run.pendingChoice;
  // REVISION 2: favors are between-run progression, never sold in-run — the
  // only single left is the Trim.
  if (shop.bought.includes('trim')) fail('already trimmed here', action);
  if (run.deck.length <= ECONOMY.removalFloor) fail('deck at the removal floor', action);
  spendCurrency(ctx, ECONOMY.trimCost, 'trim', action);
  shop.bought.push('trim');
  run.pendingChoice = null;
  pushPending(ctx, { type: 'removeCard', remaining: 1 });
  run.queued.push(shop);
}

// ---------------------------------------------------------------------------
// Sticker manipulation pendings
// ---------------------------------------------------------------------------

function deckCard(run: RunState, cardId: string) {
  const card = run.deck.find((c) => c.id === cardId);
  if (!card) fail(`no such deck card: ${cardId}`);
  return card;
}

function handleApplySticker(ctx: Ctx, action: Extract<RunAction, { type: 'applySticker' }>): void {
  const { run, events } = ctx;
  if (run.pendingChoice?.type !== 'applySticker') fail('no sticker to apply', action);
  const { effectId } = run.pendingChoice;
  if (action.sheetSuit !== undefined) {
    // REVISION 2: a sticker over the Cheat Sheet's suit entry replaces that
    // suit's spell for YOUR casts (kid sticks over the printed rule).
    const spec = getEffectSpec(effectId);
    if (!spec) fail(`unknown effect: ${effectId}`, action);
    run.sheetStickers[action.sheetSuit] = effectId;
    run.stickersApplied.push({ effectId, cardId: `sheet:${action.sheetSuit}` });
    run.stats.stickersApplied += 1;
    events.push({ type: 'StickerApplied', effectId, sheetSuit: action.sheetSuit });
  } else if (action.cardId === null) {
    events.push({ type: 'StickerSkipped', effectId });
  } else {
    const card = deckCard(run, action.cardId);
    const spec = getEffectSpec(effectId);
    if (!spec) fail(`unknown effect: ${effectId}`, action);
    if (!canApplySticker(card, spec)) fail(`sticker does not fit ${card.id}`, action);
    card.stickerStack.push(effectId); // permanent for the run
    run.stickersApplied.push({ effectId, cardId: card.id });
    run.stats.stickersApplied += 1;
    events.push({ type: 'StickerApplied', effectId, cardId: card.id });
  }
  completePending(ctx);
}

function handlePickCard(ctx: Ctx, action: Extract<RunAction, { type: 'pickCard' }>): void {
  const { run, events } = ctx;
  if (run.pendingChoice?.type !== 'removeCard') fail('no removal pending', action);
  if (run.deck.length <= ECONOMY.removalFloor) fail('deck at the removal floor', action);
  const card = deckCard(run, action.cardId);
  run.deck.splice(run.deck.indexOf(card), 1);
  events.push({ type: 'CardTrimmed', cardId: card.id });
  const remaining = run.pendingChoice.remaining - 1;
  if (remaining > 0 && run.deck.length > ECONOMY.removalFloor) {
    run.pendingChoice = { type: 'removeCard', remaining };
    return;
  }
  completePending(ctx);
}

function handleMoveSticker(ctx: Ctx, action: Extract<RunAction, { type: 'moveSticker' }>): void {
  const { run, events } = ctx;
  if (run.pendingChoice?.type !== 'moveSticker') fail('no sticker move pending', action);
  const from = deckCard(run, action.fromCardId);
  const to = deckCard(run, action.toCardId);
  if (from.id === to.id) fail('move requires two different cards', action);
  const effectId = from.stickerStack[from.stickerStack.length - 1];
  if (!effectId) fail('source card has no sticker', action);
  const def = getEffectSpec(effectId);
  if (!def || !canApplySticker(to, def)) fail('sticker does not fit the destination', action);
  from.stickerStack.pop();
  to.stickerStack.push(effectId);
  const rec = run.stickersApplied.find((s) => s.cardId === from.id && s.effectId === effectId);
  if (rec) rec.cardId = to.id;
  events.push({ type: 'StickerMoved', effectId, fromCardId: from.id, toCardId: to.id });
  completePending(ctx);
}

function handleDuplicateSticker(
  ctx: Ctx,
  action: Extract<RunAction, { type: 'duplicateSticker' }>,
): void {
  const { run, events } = ctx;
  if (run.pendingChoice?.type !== 'duplicateSticker') fail('no duplicate pending', action);
  const from = deckCard(run, action.fromCardId);
  const to = deckCard(run, action.toCardId);
  if (from.id === to.id) fail('duplicate requires two different cards', action);
  const effectId = from.stickerStack[from.stickerStack.length - 1];
  if (!effectId) fail('source card has no sticker', action);
  const def = getEffectSpec(effectId);
  if (!def || def.tier !== 'common') fail('only common stickers can be copied', action);
  if (!canApplySticker(to, def)) fail('sticker does not fit the destination', action);
  to.stickerStack.push(effectId);
  run.stickersApplied.push({ effectId, cardId: to.id });
  run.stats.stickersApplied += 1;
  events.push({ type: 'StickerDuplicated', effectId, fromCardId: from.id, toCardId: to.id });
  completePending(ctx);
}

// ---------------------------------------------------------------------------
// Top-level dispatch
// ---------------------------------------------------------------------------

function handlePickNode(ctx: Ctx, action: Extract<RunAction, { type: 'pickNode' }>): void {
  const { run, events } = ctx;
  if (run.pendingChoice !== null) fail('resolve the current choice first', action);
  const reachable = reachableNodes(run.nodeMap, run.position);
  const node = reachable.find((n) => n.id === action.nodeId);
  if (!node) fail(`node not reachable: ${action.nodeId}`, action);
  run.position = node.id;
  run.stats.nodesVisited.push(node.id);
  events.push({ type: 'NodeEntered', nodeId: node.id, nodeType: node.type });
  switch (node.type) {
    case 'duel':
    case 'elite':
    case 'boss':
      run.pendingChoice = { type: 'startDuel', nodeId: node.id, encounterId: node.encounterId! };
      break;
    case 'event':
      run.pendingChoice = { type: 'event', nodeId: node.id, eventId: node.eventId! };
      break;
    case 'shop':
      if (run.favorsEquipped.includes('lucky-coin'))
        gainCurrency(ctx, ECONOMY.luckyCoinBonus, 'lucky-coin');
      run.pendingChoice = { type: 'shop', nodeId: node.id, bought: [] };
      break;
    case 'treasure': {
      const options = sampleDiscovered(ctx, MAP_CONFIG.treasureOptions);
      if (options.length > 0) run.pendingChoice = { type: 'pickSticker', options };
      else completePending(ctx);
      break;
    }
  }
}

export function applyRunAction(
  state: RunState,
  action: RunAction,
  rng: SeededRNG,
): { run: RunState; events: RunEvent[] } {
  if (state.outcome !== 'active') fail('run is over', action);
  const run = structuredClone(state);
  const events: RunEvent[] = [];
  const ctx: Ctx = { run, events, rng };
  switch (action.type) {
    case 'pickNode':
      handlePickNode(ctx, action);
      break;
    case 'startDuel': {
      if (run.pendingChoice?.type !== 'startDuel') fail('no duel to start', action);
      const { nodeId, encounterId } = run.pendingChoice;
      const spec = buildDuelSpec(run, nodeId, encounterId);
      run.pendingChoice = { type: 'duel', spec };
      events.push({ type: 'DuelStarted', spec });
      break;
    }
    case 'duelOutcome':
      handleDuelOutcome(ctx, action);
      break;
    case 'eventChoice':
      handleEventChoice(ctx, action);
      break;
    case 'buyPack':
      handleBuyPack(ctx, action);
      break;
    case 'buySingle':
      handleBuySingle(ctx, action);
      break;
    case 'skipShop':
      if (run.pendingChoice?.type !== 'shop') fail('not in a shop', action);
      run.pendingChoice = null;
      completePending(ctx);
      break;
    case 'applySticker':
      handleApplySticker(ctx, action);
      break;
    case 'pickSticker': {
      if (run.pendingChoice?.type !== 'pickSticker') fail('no sticker pick pending', action);
      if (!run.pendingChoice.options.includes(action.effectId))
        fail('effect not among the options', action);
      // REVISION 2: picking an undiscovered effect from a win offer UNLOCKS it.
      if (run.pendingChoice.unlock && !isDiscovered(run, action.effectId)) {
        run.discoveryPool.push(action.effectId);
        run.discoveredThisRun.push(action.effectId);
        events.push({ type: 'EffectDiscovered', effectId: action.effectId });
      }
      run.pendingChoice = { type: 'applySticker', effectId: action.effectId };
      break;
    }
    case 'pickCard':
      handlePickCard(ctx, action);
      break;
    case 'moveSticker':
      handleMoveSticker(ctx, action);
      break;
    case 'duplicateSticker':
      handleDuplicateSticker(ctx, action);
      break;
    case 'pickReward': {
      if (run.pendingChoice?.type !== 'bossReward') fail('no boss reward pending', action);
      const option = run.pendingChoice.options[action.index];
      if (!option) fail('no such reward option', action);
      run.pendingChoice = null;
      run.bossRewardTaken = option;
      events.push({ type: 'BossRewardTaken', option });
      if (option.kind === 'sheetMod') {
        run.sheetModsActive.push(option.modId);
        events.push({ type: 'SheetModGained', modId: option.modId });
      } else if (option.kind === 'currency') {
        gainCurrency(ctx, option.amount, 'bossReward');
      } else {
        grantSticker(ctx, option.tier);
      }
      if (run.pendingChoice === null) completePending(ctx);
      break;
    }
    case 'abandonRun':
      run.outcome = 'lost';
      run.pendingChoice = null;
      events.push({ type: 'RunAbandoned' });
      break;
    default: {
      const never: never = action;
      fail(`unknown action ${(never as RunAction).type}`);
    }
  }
  run.rngState = rng.getState();
  return { run, events };
}

/** Convenience wrapper: resumes the run's own RNG stream (rngState). */
export function applyRun(state: RunState, action: RunAction): { run: RunState; events: RunEvent[] } {
  return applyRunAction(state, action, createRng(state.rngState));
}

// ---------------------------------------------------------------------------
// Legal actions (mirrors every handler's predicate)
// ---------------------------------------------------------------------------

export function legalRunActions(run: RunState): RunAction[] {
  if (run.outcome !== 'active') return [];
  const acts: RunAction[] = [];
  const pending = run.pendingChoice;
  if (pending === null) {
    for (const n of reachableNodes(run.nodeMap, run.position))
      acts.push({ type: 'pickNode', nodeId: n.id });
    acts.push({ type: 'abandonRun' });
    return acts;
  }
  switch (pending.type) {
    case 'startDuel':
      acts.push({ type: 'startDuel' });
      break;
    case 'duel':
      acts.push({ type: 'duelOutcome', won: true });
      acts.push({ type: 'duelOutcome', won: false });
      acts.push({ type: 'duelOutcome', won: false, draw: true });
      break;
    case 'event': {
      const def = EVENTS.find((e) => e.id === pending.eventId);
      for (const choice of def?.choices ?? []) {
        if (choice.cost !== undefined && run.currency < choice.cost) continue;
        if ((choice.requires ?? []).some((r) => !requirementMet(run, r))) continue;
        acts.push({ type: 'eventChoice', choiceId: choice.id });
      }
      break;
    }
    case 'shop': {
      for (const pack of Object.values(PACKS)) {
        const sold = pending.bought.filter((k) => k === pack.id).length;
        const inStock = pack.stockPerVisit === undefined || sold < pack.stockPerVisit;
        if (inStock && run.currency >= packCost(run, pack))
          acts.push({ type: 'buyPack', pack: pack.id });
      }
      if (
        !pending.bought.includes('trim') &&
        run.currency >= ECONOMY.trimCost &&
        run.deck.length > ECONOMY.removalFloor
      )
        acts.push({ type: 'buySingle', item: 'trim' });
      acts.push({ type: 'skipShop' });
      break;
    }
    case 'applySticker': {
      const def = getEffectSpec(pending.effectId);
      if (def) {
        for (const card of run.deck)
          if (canApplySticker(card, def)) acts.push({ type: 'applySticker', cardId: card.id });
        // REVISION 2: the Cheat Sheet's four suit entries are targets too.
        for (const sheetSuit of ['♠', '♥', '♣', '♦'] as Suit[])
          acts.push({ type: 'applySticker', cardId: null, sheetSuit });
      }
      acts.push({ type: 'applySticker', cardId: null }); // skip (forfeit)
      break;
    }
    case 'pickSticker':
      for (const effectId of pending.options) acts.push({ type: 'pickSticker', effectId });
      break;
    case 'removeCard':
      if (run.deck.length > ECONOMY.removalFloor)
        for (const card of run.deck) acts.push({ type: 'pickCard', cardId: card.id });
      break;
    case 'moveSticker': {
      for (const from of run.deck) {
        const top = from.stickerStack[from.stickerStack.length - 1];
        if (!top) continue;
        const def = getEffectSpec(top);
        if (!def) continue;
        for (const to of run.deck)
          if (to.id !== from.id && canApplySticker(to, def))
            acts.push({ type: 'moveSticker', fromCardId: from.id, toCardId: to.id });
      }
      break;
    }
    case 'duplicateSticker': {
      for (const from of run.deck) {
        const top = from.stickerStack[from.stickerStack.length - 1];
        if (!top) continue;
        const def = getEffectSpec(top);
        if (!def || def.tier !== 'common') continue;
        for (const to of run.deck)
          if (to.id !== from.id && canApplySticker(to, def))
            acts.push({ type: 'duplicateSticker', fromCardId: from.id, toCardId: to.id });
      }
      break;
    }
    case 'bossReward':
      pending.options.forEach((_, index) => acts.push({ type: 'pickReward', index }));
      break;
  }
  acts.push({ type: 'abandonRun' });
  return acts;
}
