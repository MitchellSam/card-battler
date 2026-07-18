// applyAction: the pure event-sourced reducer. Consumes coarse actions, emits
// fine-grained events. Never mutates the input state; all randomness flows
// through the injected SeededRNG.

import {
  effectiveFlipRank,
  effectivePower,
  isMonsterCard,
  isNumberRank,
  isSettableSpell,
  monsterBasePower,
  numberValue,
  polyValue,
  sacrificeCost,
  suitWeight,
} from './cards.js';
import { hasAnyActivation } from './legal.js';
import { showdown } from './poker.js';
import { shuffle, type SeededRNG } from './rng.js';
import { performAnte } from './setup.js';
import {
  IllegalActionError,
  type Action,
  type DistributiveOmit,
  type GameCard,
  type GameEvent,
  type GameState,
  type Monster,
  type PlayerId,
  type PlayerState,
  type StackItem,
  type Suit,
} from './types.js';

interface Ctx {
  s: GameState;
  events: GameEvent[];
  rng: SeededRNG;
}

const other = (p: PlayerId): PlayerId => (1 - p) as PlayerId;

// ---------------------------------------------------------------------------
// State cloning. Hand-written instead of structuredClone for sim throughput
// (~10x): GameCard objects are immutable for the life of a game (the engine
// only moves them between zones), so clones share card references and copy
// every mutable container around them. config and result are never mutated
// after creation and are shared too.
// ---------------------------------------------------------------------------

function cloneMonster(m: Monster): Monster {
  const c: Monster = { ...m, tempAdds: m.tempAdds.map((b) => ({ ...b })) };
  if (m.tempSet) c.tempSet = { ...m.tempSet };
  return c;
}

function clonePlayer(ps: PlayerState): PlayerState {
  return {
    deck: ps.deck.slice(),
    hand: ps.hand.slice(),
    monsters: ps.monsters.map((m) => (m ? cloneMonster(m) : null)),
    spellTraps: ps.spellTraps.map((st) => (st ? { ...st } : null)),
    graveyard: ps.graveyard.slice(),
    bank: ps.bank.slice(),
    removed: ps.removed.slice(),
    mulliganed: ps.mulliganed,
  };
}

function cloneStackItem(item: StackItem): StackItem {
  const c = { ...item };
  if ('targetSTZone' in c && c.targetSTZone) c.targetSTZone = { ...c.targetSTZone };
  if ('graveTarget' in c && c.graveTarget) c.graveTarget = { ...c.graveTarget };
  return c;
}

function cloneState(s: GameState): GameState {
  return {
    ...s,
    players: [clonePlayer(s.players[0]), clonePlayer(s.players[1])],
    stack: s.stack.map(cloneStackItem),
    pendingWindow: s.pendingWindow ? { ...s.pendingWindow } : null,
    pending: s.pending ? { ...s.pending } : null,
    poly: s.poly ? { ...s.poly, cardIds: s.poly.cardIds.slice() } : null,
  };
}

function fail(message: string, action?: Action): never {
  throw new IllegalActionError(message, action);
}

interface MonsterLoc {
  player: PlayerId;
  zone: number;
  m: Monster;
}

function findMonster(s: GameState, uid: number | undefined): MonsterLoc | null {
  if (uid === undefined) return null;
  for (const p of [0, 1] as PlayerId[]) {
    const zones = s.players[p].monsters;
    for (let zone = 0; zone < zones.length; zone++) {
      const m = zones[zone];
      if (m && m.uid === uid) return { player: p, zone, m };
    }
  }
  return null;
}

/**
 * Effect draws (4-flip, Joker): partial where possible, and NEVER end the game
 * (M2.5 §2 — the game ends only at a draw phase; see drawPhase).
 */
function drawCards(ctx: Ctx, player: PlayerId, count: number): void {
  const ps = ctx.s.players[player];
  const drawn: GameCard[] = [];
  for (let i = 0; i < count; i++) {
    const card = ps.deck.shift();
    if (!card) break;
    ps.hand.push(card);
    drawn.push(card);
  }
  if (drawn.length > 0)
    ctx.events.push({
      type: 'CardsDrawn',
      player,
      count: drawn.length,
      cardIds: drawn.map((c) => c.id),
    });
}

/** Mills never end the game mid-turn either (M2.5 §2); short mills mill less. */
function millCards(ctx: Ctx, player: PlayerId, count: number): void {
  const ps = ctx.s.players[player];
  const milled = ps.deck.splice(0, count);
  ps.graveyard.push(...milled);
  if (milled.length > 0)
    ctx.events.push({ type: 'CardsMilled', player, cardIds: milled.map((c) => c.id) });
}

function destroyMonster(ctx: Ctx, loc: MonsterLoc, cause?: string): void {
  ctx.s.players[loc.player].monsters[loc.zone] = null;
  ctx.s.players[loc.m.card.owner].graveyard.push(loc.m.card);
  ctx.events.push({
    type: 'MonsterDestroyed',
    player: loc.player,
    zoneIndex: loc.zone,
    uid: loc.m.uid,
    cardId: loc.m.card.id,
    power: effectivePower(loc.m),
    ...(cause ? { cause } : {}),
  });
}

/**
 * M2.5 §6 (no debuff floor): any monster whose effective power is ≤ 0 is
 * destroyed immediately upon the change. Not combat: no bank trigger, no
 * wall-punish. Checked after debuffs and after end-of-turn buff expiry.
 */
function destroyDebuffed(ctx: Ctx): void {
  for (const p of [0, 1] as PlayerId[]) {
    const zones = ctx.s.players[p].monsters;
    for (let zone = 0; zone < zones.length; zone++) {
      const m = zones[zone];
      if (m && effectivePower(m) <= 0) destroyMonster(ctx, { player: p, zone, m }, 'debuff');
    }
  }
}

function pushStack(ctx: Ctx, item: DistributiveOmit<StackItem, 'id'>): StackItem {
  const withId = { ...item, id: ctx.s.nextStackId++ } as StackItem;
  ctx.s.stack.push(withId);
  return withId;
}

/**
 * Put a flip trigger on the stack (respondable — ♠ can negate it). Ranks 9/10
 * have no effect and generate no trigger. 2/6 need a target, chosen by the
 * monster's controller immediately (targets are picked when the trigger is put
 * on the stack; if the target is gone at resolution the effect fizzles).
 */
function queueFlipTrigger(ctx: Ctx, loc: MonsterLoc): void {
  const rank = effectiveFlipRank(loc.m.card);
  if (rank === '9' || rank === '10') return;
  const item = pushStack(ctx, {
    kind: 'flip',
    controller: loc.player,
    monsterUid: loc.m.uid,
    effectRank: rank,
  });
  ctx.events.push({
    type: 'FlipTriggered',
    player: loc.player,
    uid: loc.m.uid,
    cardId: loc.m.card.id,
    effectRank: rank,
    stackItemId: item.id,
  });
  if (rank === '2' || rank === '6') {
    ctx.s.pending = {
      type: 'flipTarget',
      player: loc.player,
      stackItemId: item.id,
      effectRank: rank,
    };
  }
}

/**
 * Ratified (2026-07): flip effects are declinable. When a monster flips
 * face-up, its controller is offered the trigger rather than having it forced
 * onto the stack. Ranks 9/10 have no effect, so there is nothing to decline —
 * they resolve to no pending, exactly as before.
 */
function offerFlip(ctx: Ctx, loc: MonsterLoc): void {
  const rank = effectiveFlipRank(loc.m.card);
  if (rank === '9' || rank === '10') return;
  ctx.s.pending = {
    type: 'flipDecision',
    player: loc.player,
    sourceUid: loc.m.uid,
    effectRank: rank,
  };
}

/** Whether a bank trigger for `player` has any bank-or-remove option available. */
function bankTriggerHasOption(s: GameState, player: PlayerId): boolean {
  const bankable = s.players[player].hand.some((c) => c.rank !== 'JOKER' || s.config.jokersBankable);
  const removable = s.players[other(player)].bank.length > 0;
  return bankable || removable;
}

/** Band effective power to a bank-trigger card count: 1-4 → 1, 5-7 → 2, 8+ → 3. */
function powerToCards(power: number): number {
  if (power >= 8) return 3;
  if (power >= 5) return 2;
  return 1; // includes ≤0 (e.g. a suit-tiebreak win has a 0 power margin)
}

/**
 * How many bank/remove choices a combat trigger grants. Base rule = 1; the
 * bankTriggerScaling knob (2026-07 experiment) bands EFFECTIVE POWER at trigger
 * time. 'power' uses the winner's own power; 'margin' uses the winner-minus-
 * loser difference (winnerPower alone on a direct hit, where there is no loser).
 */
function bankTriggerCards(s: GameState, winnerPower: number, loserPower?: number): number {
  switch (s.config.bankTriggerScaling) {
    case 'power':
      return powerToCards(winnerPower);
    case 'margin':
      return powerToCards(loserPower === undefined ? winnerPower : winnerPower - loserPower);
    default:
      return 1;
  }
}

function awardBankTrigger(ctx: Ctx, winner: PlayerId, count = 1): void {
  const { s, events } = ctx;
  if (!bankTriggerHasOption(s, winner)) {
    events.push({ type: 'BankTriggerSkipped', player: winner });
    return;
  }
  s.pending = { type: 'bankTrigger', player: winner, remaining: Math.max(1, count) };
  events.push({ type: 'BankTriggerAwarded', player: winner, count: Math.max(1, count) });
}

function removeBankCard(ctx: Ctx, bankOwner: PlayerId, bankIndex: number, reason: string): void {
  const bank = ctx.s.players[bankOwner].bank;
  const [card] = bank.splice(bankIndex, 1);
  if (!card) fail(`no bank card at index ${bankIndex}`);
  ctx.s.players[bankOwner].removed.push(card);
  ctx.events.push({ type: 'BankCardRemoved', player: bankOwner, cardId: card.id, reason });
}

function doWallPunish(ctx: Ctx, attacker: PlayerId): void {
  const { s, events, rng } = ctx;
  if (!s.config.wallPunish) return;
  const bank = s.players[attacker].bank;
  events.push({ type: 'WallPunish', attacker, bankEmpty: bank.length === 0 });
  if (bank.length === 0) return; // empty bank: no removal
  switch (s.config.wallPunishSelector) {
    case 'random':
      removeBankCard(ctx, attacker, rng.int(bank.length), 'wallPunish');
      break;
    case 'defender':
      s.pending = { type: 'wallPunishPick', player: other(attacker), attacker };
      break;
    case 'attacker':
      s.pending = { type: 'wallPunishPick', player: attacker, attacker };
      break;
  }
}

function endGame(ctx: Ctx, stalled: boolean): void {
  const { s, events } = ctx;
  const result = { ...showdown(s.players[0].bank, s.players[1].bank), stalled };
  s.result = result;
  s.phase = 'gameOver';
  s.pendingWindow = null;
  events.push({ type: 'GameEnded', winner: result.winner, hands: result.hands, stalled });
}

/**
 * Restore normal priority after a resolution or a completed decision:
 * active player gets priority, passes reset; if that empties everything and a
 * phase-change window is open, hand it back to the opponent (auto-closing it
 * when they have nothing to activate).
 */
function resumeFlow(ctx: Ctx): void {
  const { s } = ctx;
  if (s.phase === 'gameOver') return;
  s.passes = 0;
  s.priority = s.activePlayer;
  if (s.stack.length === 0 && !s.pending && !s.poly && s.pendingWindow) {
    const opp = other(s.activePlayer);
    if (hasAnyActivation(s, opp)) s.priority = opp;
    else executeTransition(ctx);
  }
}

function executeTransition(ctx: Ctx): void {
  const { s, events } = ctx;
  const to = s.pendingWindow?.to;
  if (!to) fail('no pending phase transition');
  s.pendingWindow = null;
  s.passes = 0;
  s.priority = s.activePlayer;
  if (to === 'battle' || to === 'main2') {
    s.phase = to;
    events.push({ type: 'PhaseChanged', phase: to, player: s.activePlayer });
    return;
  }
  s.phase = 'end';
  events.push({ type: 'PhaseChanged', phase: 'end', player: s.activePlayer });
  const ps = s.players[s.activePlayer];
  if (ps.hand.length > s.config.handLimit) {
    s.pending = { type: 'discard', player: s.activePlayer };
  } else {
    finishTurn(ctx);
  }
}

function finishTurn(ctx: Ctx): void {
  const { s, events } = ctx;
  // Expire end-of-turn buffs (Ace flip's "becomes 11", Queen's temp +N).
  for (const p of [0, 1] as PlayerId[]) {
    for (const m of s.players[p].monsters) {
      if (!m) continue;
      if (m.tempSet && m.tempSet.expiresTurn <= s.turn) delete m.tempSet;
      m.tempAdds = m.tempAdds.filter((b) => b.expiresTurn > s.turn);
    }
  }
  // A buff expiring can drop a debuffed monster to ≤ 0 power (M2.5 §6).
  destroyDebuffed(ctx);
  events.push({ type: 'TurnEnded', turn: s.turn, player: s.activePlayer });
  s.turn += 1;
  if (s.turn > s.config.maxTurns) {
    events.push({ type: 'GameStalled', turn: s.turn - 1 });
    endGame(ctx, true);
    return;
  }
  s.activePlayer = other(s.activePlayer);
  s.normalSummonUsed = false;
  s.phase = 'main1';
  s.priority = s.activePlayer;
  s.passes = 0;
  events.push({ type: 'TurnStarted', turn: s.turn, player: s.activePlayer });
  drawPhase(ctx);
}

/**
 * The draw phase is the ONLY place the game can end by deck-out (M2.5 §2):
 * draw drawPerTurn cards one at a time; a draw due from an empty deck keeps
 * whatever was already drawn and ends the game on the spot.
 */
function drawPhase(ctx: Ctx): void {
  const { s, events } = ctx;
  const player = s.activePlayer;
  const ps = s.players[player];
  const drawn: GameCard[] = [];
  for (let i = 0; i < s.config.drawPerTurn; i++) {
    const card = ps.deck.shift();
    if (!card) {
      if (drawn.length > 0)
        events.push({ type: 'CardsDrawn', player, count: drawn.length, cardIds: drawn.map((c) => c.id) });
      events.push({ type: 'DeckOut', player });
      endGame(ctx, false);
      return;
    }
    ps.hand.push(card);
    drawn.push(card);
  }
  if (drawn.length > 0)
    events.push({ type: 'CardsDrawn', player, count: drawn.length, cardIds: drawn.map((c) => c.id) });
}

// ---------------------------------------------------------------------------
// Stack resolution
// ---------------------------------------------------------------------------

function resolveTop(ctx: Ctx): void {
  const { s, events } = ctx;
  const item = s.stack.pop();
  if (!item) fail('resolveTop on empty stack');
  events.push({ type: 'StackResolved', stackItemId: item.id, kind: item.kind });
  switch (item.kind) {
    case 'spell':
      resolveSpell(ctx, item);
      break;
    case 'joker':
      drawCards(ctx, item.controller, 2);
      s.players[item.controller].graveyard.push(item.card);
      break;
    case 'flip':
      resolveFlip(ctx, item);
      break;
    case 'attack':
      resolveAttack(ctx, item);
      break;
    case 'combat':
      resolveCombat(ctx, item.attackerUid, item.targetUid);
      break;
  }
  resumeFlow(ctx);
}

function fizzle(ctx: Ctx, item: StackItem, reason: string): void {
  ctx.events.push({ type: 'EffectFizzled', stackItemId: item.id, kind: item.kind, reason });
}

function suitEffectOf(suit: Suit): 'negate' | 'revive' | 'snipe' | 'poly' {
  switch (suit) {
    case '♠':
      return 'negate';
    case '♥':
      return 'revive';
    case '♣':
      return 'snipe';
    case '♦':
      return 'poly';
  }
}

function resolveSpell(ctx: Ctx, item: Extract<StackItem, { kind: 'spell' }>): void {
  const { s, events } = ctx;
  const ctrl = item.controller;
  switch (item.effect) {
    case 'J-rank': {
      const loc = findMonster(s, item.targetMonsterUid);
      if (!loc) fizzle(ctx, item, 'target left the field');
      else destroyMonster(ctx, loc);
      break;
    }
    case 'Q-rank': {
      const loc = findMonster(s, item.targetMonsterUid);
      if (!loc || loc.player !== ctrl || loc.m.position === 'set')
        fizzle(ctx, item, 'target invalid');
      else {
        if (s.config.queenBuffDuration === 'permanent') loc.m.power += item.amount!;
        else loc.m.tempAdds.push({ value: item.amount!, expiresTurn: s.turn });
        events.push({
          type: 'PowerChanged',
          uid: loc.m.uid,
          power: effectivePower(loc.m),
          delta: item.amount,
        });
      }
      break;
    }
    case 'K-rank': {
      const loc = findMonster(s, item.targetMonsterUid);
      if (!loc || loc.player === ctrl || loc.m.position === 'set')
        fizzle(ctx, item, 'target invalid');
      else {
        loc.m.power -= item.amount!;
        events.push({
          type: 'PowerChanged',
          uid: loc.m.uid,
          power: effectivePower(loc.m),
          delta: -item.amount!,
        });
        destroyDebuffed(ctx);
      }
      break;
    }
    case 'negate': {
      const idx = s.stack.findIndex((i) => i.id === item.targetStackItemId);
      if (idx < 0) fizzle(ctx, item, 'target no longer on stack');
      else {
        const [negated] = s.stack.splice(idx, 1);
        if (negated && (negated.kind === 'spell' || negated.kind === 'joker'))
          s.players[negated.controller].graveyard.push(negated.card);
        events.push({
          type: 'EffectNegated',
          stackItemId: item.targetStackItemId,
          by: item.card.id,
        });
      }
      break;
    }
    case 'revive': {
      const target = item.graveTarget!;
      const gy = s.players[target.player].graveyard;
      const gi = gy.findIndex((c) => c.id === target.cardId);
      const zone = s.players[ctrl].monsters.findIndex((m) => m === null);
      const card = gi >= 0 ? gy[gi]! : null;
      if (!card || !isMonsterCard(card) || zone < 0) {
        fizzle(ctx, item, 'revive target or zone unavailable');
        break;
      }
      gy.splice(gi, 1);
      const monster: Monster = {
        uid: s.nextUid++,
        card,
        position: item.summonPosition ?? 'attack', // face-up; Heart explicitly triggers no flip effect
        power: monsterBasePower(card),
        tempAdds: [],
        summonedTurn: s.turn,
        attackedTurn: -1,
        posChangedTurn: -1,
      };
      s.players[ctrl].monsters[zone] = monster;
      events.push({
        type: 'MonsterSpecialSummoned',
        player: ctrl,
        zoneIndex: zone,
        uid: monster.uid,
        cardId: card.id,
        position: monster.position,
      });
      break;
    }
    case 'snipe': {
      const t = item.targetSTZone!;
      const st = s.players[t.player].spellTraps[t.zoneIndex];
      if (!st) fizzle(ctx, item, 'target set card gone');
      else {
        s.players[t.player].spellTraps[t.zoneIndex] = null;
        s.players[st.card.owner].graveyard.push(st.card);
        events.push({
          type: 'SetCardDestroyed', // revealed on the way to the graveyard
          player: t.player,
          zoneIndex: t.zoneIndex,
          cardId: st.card.id,
        });
      }
      break;
    }
    case 'poly': {
      const loc = findMonster(s, item.targetMonsterUid);
      if (!loc || loc.player !== ctrl || loc.m.position === 'set') {
        fizzle(ctx, item, 'poly target invalid');
        break;
      }
      s.players[ctrl].graveyard.push(item.card);
      startPoly(ctx, ctrl, loc.m.uid);
      return; // card already moved to graveyard
    }
  }
  s.players[ctrl].graveyard.push(item.card);
}

function resolveFlip(ctx: Ctx, item: Extract<StackItem, { kind: 'flip' }>): void {
  const { s, events, rng } = ctx;
  const loc = findMonster(s, item.monsterUid);
  if (!loc || loc.m.position === 'set') {
    fizzle(ctx, item, 'flipped monster left the field');
    return;
  }
  const ctrl = item.controller;
  const opp = other(ctrl);
  switch (item.effectRank) {
    case 'A':
      loc.m.tempSet = { value: 11, expiresTurn: s.turn };
      events.push({ type: 'PowerChanged', uid: loc.m.uid, power: effectivePower(loc.m) });
      break;
    case '2': {
      const tloc = findMonster(s, item.targetMonsterUid);
      if (!tloc) {
        fizzle(ctx, item, 'position-flip target gone');
        break;
      }
      if (tloc.m.position === 'set') {
        // Ratified (M2.5 §12): face-down defense → face-up ATTACK, and the
        // face-down→face-up transition triggers its flip effect.
        tloc.m.position = 'attack';
        events.push({
          type: 'MonsterFlipped',
          player: tloc.player,
          uid: tloc.m.uid,
          cardId: tloc.m.card.id,
          by: 'effect',
        });
        offerFlip(ctx, tloc);
      } else {
        tloc.m.position = tloc.m.position === 'attack' ? 'defense' : 'attack';
        events.push({
          type: 'PositionChanged',
          player: tloc.player,
          uid: tloc.m.uid,
          position: tloc.m.position,
          by: 'effect',
        });
      }
      break;
    }
    case '3':
      events.push({
        type: 'HandRevealed',
        player: opp,
        cardIds: s.players[opp].hand.map((c) => c.id),
      });
      break;
    case '4':
      drawCards(ctx, ctrl, 1);
      break;
    case '5':
      millCards(ctx, opp, 2);
      break;
    case '6': {
      const tloc = findMonster(s, item.targetMonsterUid);
      if (!tloc) {
        fizzle(ctx, item, 'bounce target gone');
        break;
      }
      s.players[tloc.player].monsters[tloc.zone] = null;
      s.players[tloc.m.card.owner].hand.push(tloc.m.card);
      events.push({
        type: 'MonsterReturnedToHand',
        player: tloc.player,
        uid: tloc.m.uid,
        cardId: tloc.m.card.id,
      });
      break;
    }
    case '7': {
      const hand = s.players[opp].hand;
      if (hand.length > 0) {
        const idx = rng.int(hand.length);
        const [card] = hand.splice(idx, 1);
        s.players[opp].graveyard.push(card!);
        events.push({ type: 'CardDiscarded', player: opp, cardId: card!.id, random: true });
      }
      break;
    }
    case '8': {
      for (const p of [0, 1] as PlayerId[]) {
        const zones = s.players[p].monsters;
        for (let zone = 0; zone < zones.length; zone++) {
          const m = zones[zone];
          if (m && m.position === 'attack') destroyMonster(ctx, { player: p, zone, m });
        }
      }
      break;
    }
    default:
      break; // 9 / 10 never reach the stack
  }
}

function resolveAttack(ctx: Ctx, item: Extract<StackItem, { kind: 'attack' }>): void {
  const { s, events } = ctx;
  const aloc = findMonster(s, item.attackerUid);
  if (!aloc || aloc.m.position !== 'attack') {
    // Ratified (M2.5 §12): attacker destroyed / bounced / turned before the
    // attack resolves — the attack is interrupted and spent (no re-declaration).
    fizzle(ctx, item, 'attacker no longer in attack position');
    return;
  }
  if (item.target === 'direct') {
    const defender = other(item.controller);
    const interceptors = s.players[defender].monsters.filter((m) => m !== null);
    if (interceptors.length === 0) {
      events.push({ type: 'CombatResolved', direct: true, attacker: item.controller });
      awardBankTrigger(ctx, item.controller, bankTriggerCards(s, effectivePower(aloc.m)));
      return;
    }
    // M2.5 §8: monsters that appeared under a direct attack intercept it.
    if (interceptors.length === 1) {
      interceptAttack(ctx, item.controller, item.attackerUid, interceptors[0]!.uid);
      return;
    }
    // RULES-GAP: (provisional, M2.5 §8) multiple monsters appeared — the
    // DEFENDER chooses which one intercepts.
    s.pending = {
      type: 'interceptor',
      player: defender,
      attackerUid: item.attackerUid,
      attacker: item.controller,
    };
    return;
  }
  const tloc = findMonster(s, item.target);
  if (!tloc) {
    fizzle(ctx, item, 'attack target left the field');
    return;
  }
  attackMonster(ctx, item.controller, item.attackerUid, tloc);
}

/** Resolve an attack against a specific monster: flip-then-combat if it's set. */
function attackMonster(ctx: Ctx, attackingPlayer: PlayerId, attackerUid: number, tloc: MonsterLoc): void {
  const { events } = ctx;
  if (tloc.m.position === 'set') {
    // Flip it face-up first; its flip effect triggers and resolves, THEN combat.
    tloc.m.position = 'defense';
    events.push({
      type: 'MonsterFlipped',
      player: tloc.player,
      uid: tloc.m.uid,
      cardId: tloc.m.card.id,
      by: 'attack',
    });
    pushStack(ctx, {
      kind: 'combat',
      controller: attackingPlayer,
      attackerUid,
      targetUid: tloc.m.uid,
    });
    offerFlip(ctx, tloc);
    return;
  }
  resolveCombat(ctx, attackerUid, tloc.m.uid);
}

function interceptAttack(ctx: Ctx, attackingPlayer: PlayerId, attackerUid: number, interceptorUid: number): void {
  const tloc = findMonster(ctx.s, interceptorUid)!;
  ctx.events.push({
    type: 'AttackIntercepted',
    attacker: attackingPlayer,
    attackerUid,
    interceptorUid,
  });
  attackMonster(ctx, attackingPlayer, attackerUid, tloc);
}

function resolveCombat(ctx: Ctx, attackerUid: number, targetUid: number): void {
  const { s, events } = ctx;
  const aloc = findMonster(s, attackerUid);
  if (!aloc || aloc.m.position !== 'attack') {
    events.push({ type: 'CombatResolved', fizzled: true, reason: 'attacker gone' });
    return;
  }
  const tloc = findMonster(s, targetUid);
  if (!tloc) {
    events.push({ type: 'CombatResolved', fizzled: true, reason: 'target gone' });
    return;
  }
  const ap = effectivePower(aloc.m);
  const dp = effectivePower(tloc.m);
  let cmp = ap - dp;
  if (cmp === 0) cmp = suitWeight(aloc.m.card.suit) - suitWeight(tloc.m.card.suit);
  const defenderPosition = tloc.m.position;
  events.push({
    type: 'CombatResolved',
    attacker: aloc.player,
    attackerUid,
    targetUid,
    attackerPower: ap,
    defenderPower: dp,
    defenderPosition,
  });

  if (cmp === 0) {
    // M2.5 §9: mirror combat (identical power AND suit — naturally only the
    // twin card from the other deck): both destroyed regardless of the
    // defender's position; a tie is neither a win nor a loss, so no bank
    // trigger and no wall-punish.
    destroyMonster(ctx, tloc);
    destroyMonster(ctx, aloc);
    return;
  }
  if (defenderPosition === 'attack') {
    if (cmp > 0) {
      const count = bankTriggerCards(s, ap, dp); // attacker won by (ap − dp)
      destroyMonster(ctx, tloc);
      awardBankTrigger(ctx, aloc.player, count);
    } else {
      const count = bankTriggerCards(s, dp, ap); // defender won by (dp − ap)
      destroyMonster(ctx, aloc);
      awardBankTrigger(ctx, tloc.player, count); // winner of an attack-vs-attack fight gets the choice regardless of who declared
    }
    return;
  }
  // Attack vs defense (set monsters were flipped face-up before combat)
  if (cmp > 0) {
    destroyMonster(ctx, tloc); // no bank trigger against a wall
  } else {
    destroyMonster(ctx, aloc);
    doWallPunish(ctx, aloc.player);
  }
}

// ---------------------------------------------------------------------------
// Polymerization (♦): blackjack sub-state-machine inside the stack
// ---------------------------------------------------------------------------

/**
 * M2.5 §5: the blackjack total STARTS at the target monster's card value —
 * number = face value (Ace: caster chooses 1/11 via the polyAce pending),
 * face card (Recast typeOverride only) = 10. The target's card is not drawn
 * or milled; it contributes value and remains the monster being fused.
 */
function startPoly(ctx: Ctx, caster: PlayerId, targetUid: number): void {
  const { s, events } = ctx;
  const target = findMonster(s, targetUid)!;
  s.poly = { caster, targetUid, total: 0, dealsRemaining: 0, cardIds: [] };
  events.push({ type: 'PolyStarted', caster, targetUid });
  if (target.m.card.rank === 'A') {
    s.pending = { type: 'polyAce', player: caster };
    return; // resumes via handlePolyAce → continuePoly
  }
  s.poly.total = polyValue(target.m.card.rank);
  continuePoly(ctx);
}

function polyDeal(ctx: Ctx): 'dealt' | 'pendingAce' | 'deckEmpty' {
  const { s, events } = ctx;
  const poly = s.poly!;
  const ps = s.players[poly.caster];
  let card = ps.deck.shift();
  // M2.5 §7: a Joker drawn as a Poly hit is shuffled back in and the hit redrawn.
  while (card && card.rank === 'JOKER') {
    ps.deck.push(card);
    events.push({ type: 'PolyJokerReshuffled', player: poly.caster, cardId: card.id });
    shuffle(ps.deck, ctx.rng);
    // RULES-GAP: (provisional, M2.5 §7) if the deck contains no non-Joker cards
    // the hit fails and the caster is forced to STAND on the current total.
    if (ps.deck.every((c) => c.rank === 'JOKER')) return 'deckEmpty';
    card = ps.deck.shift();
  }
  if (!card) return 'deckEmpty';
  ps.graveyard.push(card); // all drawn cards go to the caster's graveyard regardless of outcome
  poly.cardIds.push(card.id);
  events.push({ type: 'PolyCardDrawn', player: poly.caster, cardId: card.id });
  if (card.rank === 'A') {
    // Caster chooses 1 or 11 at the moment it is drawn (irrevocable).
    s.pending = { type: 'polyAce', player: poly.caster };
    return 'pendingAce';
  }
  poly.total += polyValue(card.rank);
  return 'dealt';
}

function continuePoly(ctx: Ctx): void {
  const { s } = ctx;
  const poly = s.poly!;
  while (poly.dealsRemaining > 0) {
    poly.dealsRemaining--;
    const outcome = polyDeal(ctx);
    if (outcome === 'pendingAce') return; // resumes via the polyAce decision
    if (outcome === 'deckEmpty') {
      // M2.5 §2: mid-Poly deck-out forces a STAND on the current total; the
      // game itself only ends at the next failed draw phase.
      polyStandFinish(ctx);
      return;
    }
    if (poly.total > 21) {
      polyBust(ctx);
      return;
    }
  }
  if (poly.total > 21) {
    polyBust(ctx);
    return;
  }
  s.pending = { type: 'polyHitStand', player: poly.caster };
}

function polyBust(ctx: Ctx): void {
  const { s, events } = ctx;
  const poly = s.poly!;
  events.push({ type: 'PolyBust', caster: poly.caster, total: poly.total });
  const loc = findMonster(s, poly.targetUid);
  if (loc) destroyMonster(ctx, loc); // BUST: target monster destroyed, effect fails
  endPoly(ctx);
}

function polyStandFinish(ctx: Ctx): void {
  const { s, events } = ctx;
  const poly = s.poly!;
  const loc = findMonster(s, poly.targetUid);
  if (loc) {
    const newPower = Math.ceil(poly.total / 2); // exact 21 → 11
    loc.m.power = newPower;
    delete loc.m.tempSet; // "power BECOMES n permanently" replaces temp effects
    loc.m.tempAdds = [];
    events.push({
      type: 'PolyStand',
      caster: poly.caster,
      total: poly.total,
      uid: loc.m.uid,
      power: newPower,
    });
  } else {
    events.push({ type: 'PolyStand', caster: poly.caster, total: poly.total, targetGone: true });
  }
  endPoly(ctx);
}

function endPoly(ctx: Ctx): void {
  ctx.s.poly = null;
  ctx.s.pending = null;
  resumeFlow(ctx);
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

function requireNoPending(s: GameState, action: Action): void {
  if (s.pending || s.poly) fail('a pending decision must be resolved first', action);
}

function requireMainAction(s: GameState, action: Action & { player: PlayerId }): void {
  requireNoPending(s, action);
  if (s.phase !== 'main1' && s.phase !== 'main2') fail(`not a main phase (${s.phase})`, action);
  if (s.activePlayer !== action.player) fail('not your turn', action);
  if (s.stack.length > 0) fail('stack must be empty (sorcery speed)', action);
  if (s.pendingWindow) fail('phase change in progress', action);
}

function handleMulligan(ctx: Ctx, action: Extract<Action, { type: 'mulligan' }>): void {
  const { s, events, rng } = ctx;
  if (s.phase !== 'mulligan') fail('not in mulligan phase', action);
  const ps = s.players[action.player];
  if (ps.mulliganed) fail('already mulliganed', action);
  const indices = [...new Set(action.discardHandIndices)].sort((a, b) => b - a);
  if (indices.length !== action.discardHandIndices.length) fail('duplicate indices', action);
  const returned: GameCard[] = [];
  for (const i of indices) {
    const card = ps.hand[i];
    if (!card) fail(`no hand card at index ${i}`, action);
    ps.hand.splice(i, 1);
    returned.push(card);
  }
  if (returned.length > 0) {
    if (s.config.mulliganStyle === 'shuffle') {
      ps.deck.push(...returned);
      shuffle(ps.deck, rng);
    } else {
      ps.deck.push(...shuffle(returned, rng)); // to the bottom, order by RNG
    }
    drawCards(ctx, action.player, returned.length);
  }
  ps.mulliganed = true;
  events.push({ type: 'MulliganTaken', player: action.player, count: returned.length });
  if (s.players[0].mulliganed && s.players[1].mulliganed) {
    performAnte(s, rng, events); // M2.5 §11: ante fires once, after mulligans
    s.phase = 'main1';
    s.priority = s.activePlayer;
    events.push({ type: 'TurnStarted', turn: 1, player: s.activePlayer });
    // Canonical: first player skips their turn-1 draw phase (compensation).
    if (s.config.firstTurnDraw) drawPhase(ctx);
  }
}

function handleSummon(ctx: Ctx, action: Extract<Action, { type: 'summon' }>): void {
  const { s, events } = ctx;
  requireMainAction(s, action);
  if (s.normalSummonUsed) fail('normal summon already used this turn', action);
  const ps = s.players[action.player];
  const card = ps.hand[action.handIndex];
  if (!card) fail('no such hand card', action);
  if (!isMonsterCard(card)) fail('not a monster card', action);
  if (action.zoneIndex < 0 || action.zoneIndex >= ps.monsters.length) fail('bad zone', action);
  const cost = sacrificeCost(card);
  const sacs = [...new Set(action.sacrificeZoneIndices ?? [])];
  if (sacs.length !== (action.sacrificeZoneIndices ?? []).length) fail('duplicate sacrifice', action);
  if (sacs.length !== cost) fail(`summon requires exactly ${cost} sacrifice(s)`, action);
  for (const z of sacs) if (!ps.monsters[z]) fail(`no monster to sacrifice in zone ${z}`, action);
  if (ps.monsters[action.zoneIndex] !== null && !sacs.includes(action.zoneIndex))
    fail('target zone occupied', action);
  for (const z of sacs) {
    const sac = ps.monsters[z]!;
    ps.monsters[z] = null;
    // Sacrificing a set monster does NOT trigger its flip effect (YGO convention).
    s.players[sac.card.owner].graveyard.push(sac.card);
    events.push({ type: 'MonsterSacrificed', player: action.player, uid: sac.uid, cardId: sac.card.id });
  }
  ps.hand.splice(action.handIndex, 1);
  const monster: Monster = {
    uid: s.nextUid++,
    card,
    position: action.mode === 'attack' ? 'attack' : 'set',
    power: monsterBasePower(card),
    tempAdds: [],
    summonedTurn: s.turn,
    ...(action.mode === 'set' ? { setTurn: s.turn } : {}),
    attackedTurn: -1,
    posChangedTurn: -1,
  };
  ps.monsters[action.zoneIndex] = monster;
  s.normalSummonUsed = true;
  events.push({
    type: action.mode === 'attack' ? 'MonsterSummoned' : 'MonsterSet',
    player: action.player,
    zoneIndex: action.zoneIndex,
    uid: monster.uid,
    // Set monsters are face-down: identity stays out of the public view (viewFor masks it).
    cardId: card.id,
  });
}

function handleSetSpell(ctx: Ctx, action: Extract<Action, { type: 'setSpell' }>): void {
  const { s, events } = ctx;
  requireMainAction(s, action);
  const ps = s.players[action.player];
  const card = ps.hand[action.handIndex];
  if (!card) fail('no such hand card', action);
  if (!isSettableSpell(card)) fail('only face cards can be set (Jokers cannot)', action);
  if (action.zoneIndex < 0 || action.zoneIndex >= ps.spellTraps.length) fail('bad zone', action);
  if (ps.spellTraps[action.zoneIndex] !== null) fail('zone occupied', action);
  ps.hand.splice(action.handIndex, 1);
  ps.spellTraps[action.zoneIndex] = { card, setTurn: s.turn };
  events.push({ type: 'SpellSet', player: action.player, zoneIndex: action.zoneIndex, cardId: card.id });
}

function handleFlipMonster(ctx: Ctx, action: Extract<Action, { type: 'flipMonster' }>): void {
  const { s, events } = ctx;
  requireMainAction(s, action);
  const ps = s.players[action.player];
  const m = ps.monsters[action.zoneIndex];
  if (!m) fail('no monster in zone', action);
  if (m.position !== 'set') fail('monster is not set', action);
  // Ratified (M2.5 §12): "always allowed" = exempt from the once-per-turn
  // position-change limit, but never the turn it was set.
  if ((m.setTurn ?? 0) >= s.turn) fail('cannot flip the turn it was set', action);
  m.position = 'attack';
  // Ratified (2026-07): a monster flipped face-up cannot switch to defense the
  // same turn — the manual flip consumes this turn's position change.
  m.posChangedTurn = s.turn;
  events.push({
    type: 'MonsterFlipped',
    player: action.player,
    uid: m.uid,
    cardId: m.card.id,
    by: 'manual',
  });
  // Declinable: offer the flip to the controller (no-op stack-wise for 9/10).
  offerFlip(ctx, { player: action.player, zone: action.zoneIndex, m });
  s.passes = 0;
  s.priority = action.player; // controller keeps priority for the decision / trigger
}

function handleChangePosition(ctx: Ctx, action: Extract<Action, { type: 'changePosition' }>): void {
  const { s, events } = ctx;
  requireMainAction(s, action);
  const m = s.players[action.player].monsters[action.zoneIndex];
  if (!m) fail('no monster in zone', action);
  if (m.position === 'set') fail('use flipMonster for set monsters', action);
  if (m.summonedTurn === s.turn) fail('cannot change position the turn it was summoned', action);
  if (m.attackedTurn === s.turn) fail('cannot change position after attacking', action);
  if (m.posChangedTurn === s.turn) fail('position already changed this turn', action);
  m.position = m.position === 'attack' ? 'defense' : 'attack';
  m.posChangedTurn = s.turn;
  events.push({
    type: 'PositionChanged',
    player: action.player,
    uid: m.uid,
    position: m.position,
    by: 'manual',
  });
}

function handleCastSpell(ctx: Ctx, action: Extract<Action, { type: 'castSpell' }>): void {
  const { s, events } = ctx;
  const player = action.player;
  const ps = s.players[player];
  let card: GameCard;
  if (action.source.from === 'hand') {
    requireMainAction(s, action); // sorcery speed: own turn, main phase, empty stack
    const c = ps.hand[action.source.handIndex];
    if (!c) fail('no such hand card', action);
    if (!isSettableSpell(c)) fail('not a castable face card', action);
    card = c;
  } else {
    requireNoPending(s, action);
    if (s.phase === 'mulligan') fail('game not started', action);
    if (s.priority !== player) fail('you do not have priority', action);
    const st = ps.spellTraps[action.source.zoneIndex];
    if (!st) fail('no set card in zone', action);
    if (st.setTurn >= s.turn) fail('cannot activate the turn it was set', action);
    card = st.card;
  }

  const effect =
    action.mode === 'rank'
      ? (`${card.rank}-rank` as 'J-rank' | 'Q-rank' | 'K-rank')
      : suitEffectOf(card.suit!);

  // Validate targets & costs at cast time (fizzles if invalid at resolution).
  let amount: number | undefined;
  let discarded: GameCard | undefined;
  const target = findMonster(s, action.targetMonsterUid);
  switch (effect) {
    case 'J-rank':
      if (!target) fail('J: no target monster', action);
      break;
    case 'Q-rank':
    case 'K-rank': {
      if (!target || target.m.position === 'set') fail(`${effect}: bad target`, action);
      if (effect === 'Q-rank' && target.player !== player) fail('Q targets your monster', action);
      if (effect === 'K-rank' && target.player === player) fail("K targets opponent's monster", action);
      const di = action.discardHandIndex;
      if (di === undefined) fail('Q/K require a number-card discard', action);
      if (action.source.from === 'hand' && di === action.source.handIndex)
        fail('cannot discard the spell itself', action);
      const dc = ps.hand[di];
      if (!dc || !isNumberRank(dc.rank)) fail('discard must be a number card', action);
      // M2.5 §4: an Ace discarded as Q/K fuel is 1 or 11, caster's choice at cast time.
      if (dc.rank === 'A') {
        if (action.aceValue !== 1 && action.aceValue !== 11)
          fail('discarding an Ace requires aceValue 1 or 11', action);
        amount = action.aceValue;
      } else {
        if (action.aceValue !== undefined) fail('aceValue is only legal with an Ace discard', action);
        amount = numberValue(dc.rank);
      }
      discarded = dc;
      break;
    }
    case 'negate': {
      const t = s.stack.find((i) => i.id === action.targetStackItemId);
      if (!t || (t.kind !== 'spell' && t.kind !== 'joker' && t.kind !== 'flip'))
        fail('negate: target must be a card/effect on the stack', action);
      break;
    }
    case 'revive': {
      const gt = action.graveTarget;
      if (!gt) fail('revive: no graveyard target', action);
      const gc = s.players[gt.player].graveyard.find((c) => c.id === gt.cardId);
      if (!gc || !isMonsterCard(gc)) fail('revive: target is not a monster in that graveyard', action);
      if (!ps.monsters.some((m) => m === null)) fail('revive: no free monster zone', action);
      if (!action.summonPosition) fail('revive: choose a face-up position', action);
      break;
    }
    case 'snipe': {
      const t = action.targetSTZone;
      if (!t) fail('snipe: no target', action);
      if (
        action.source.from === 'zone' &&
        t.player === player &&
        t.zoneIndex === action.source.zoneIndex
      )
        fail('snipe: cannot target itself', action);
      if (!s.players[t.player].spellTraps[t.zoneIndex]) fail('snipe: zone is empty', action);
      break;
    }
    case 'poly':
      if (!target || target.player !== player || target.m.position === 'set')
        fail('poly: target one face-up monster you control', action);
      break;
  }

  // Pay cost, then move the card to the stack.
  if (discarded) {
    ps.hand.splice(ps.hand.indexOf(discarded), 1);
    ps.graveyard.push(discarded);
    events.push({ type: 'CardDiscarded', player, cardId: discarded.id, cost: true });
  }
  if (action.source.from === 'hand') {
    ps.hand.splice(ps.hand.indexOf(card), 1);
  } else {
    ps.spellTraps[action.source.zoneIndex] = null;
  }
  const item = pushStack(ctx, {
    kind: 'spell',
    controller: player,
    card,
    effect,
    ...(action.targetMonsterUid !== undefined ? { targetMonsterUid: action.targetMonsterUid } : {}),
    ...(action.targetStackItemId !== undefined
      ? { targetStackItemId: action.targetStackItemId }
      : {}),
    ...(action.targetSTZone ? { targetSTZone: action.targetSTZone } : {}),
    ...(action.graveTarget ? { graveTarget: action.graveTarget } : {}),
    ...(action.summonPosition ? { summonPosition: action.summonPosition } : {}),
    ...(amount !== undefined ? { amount } : {}),
  });
  s.passes = 0;
  s.priority = player; // caster retains priority
  events.push({
    type: action.source.from === 'hand' ? 'SpellCast' : 'SpellActivated',
    player,
    cardId: card.id,
    effect,
    stackItemId: item.id,
    ...(amount !== undefined ? { amount } : {}), // Q/K fuel value (11 ⇒ Ace-as-11)
  });
}

function handleCastJoker(ctx: Ctx, action: Extract<Action, { type: 'castJoker' }>): void {
  const { s, events } = ctx;
  requireMainAction(s, action);
  const ps = s.players[action.player];
  const card = ps.hand[action.handIndex];
  if (!card || card.rank !== 'JOKER') fail('not a Joker', action);
  ps.hand.splice(action.handIndex, 1);
  const item = pushStack(ctx, { kind: 'joker', controller: action.player, card });
  s.passes = 0;
  s.priority = action.player;
  events.push({ type: 'JokerCast', player: action.player, cardId: card.id, stackItemId: item.id });
}

function handleDeclareAttack(ctx: Ctx, action: Extract<Action, { type: 'declareAttack' }>): void {
  const { s, events } = ctx;
  requireNoPending(s, action);
  if (s.phase !== 'battle') fail('not battle phase', action);
  if (s.activePlayer !== action.player) fail('not your turn', action);
  if (s.stack.length > 0) fail('stack must be empty to declare an attack', action);
  if (s.pendingWindow) fail('phase change in progress', action);
  const ps = s.players[action.player];
  const attacker = ps.monsters[action.attackerZone];
  if (!attacker) fail('no attacker in zone', action);
  if (attacker.position !== 'attack') fail('attacker must be in face-up attack position', action);
  if (attacker.attackedTurn === s.turn) fail('this monster already attacked', action);
  const opp = s.players[other(action.player)];
  let target: number | 'direct';
  if (action.direct) {
    if (opp.monsters.some((m) => m !== null))
      fail('direct attacks are only legal when the opponent controls zero monsters', action);
    target = 'direct';
  } else {
    const tm = action.targetZone !== undefined ? opp.monsters[action.targetZone] : null;
    if (!tm) fail('no target monster in that zone', action);
    target = tm.uid;
  }
  attacker.attackedTurn = s.turn;
  const item = pushStack(ctx, {
    kind: 'attack',
    controller: action.player,
    attackerUid: attacker.uid,
    target,
  });
  s.passes = 0;
  s.priority = action.player;
  events.push({
    type: 'AttackDeclared',
    player: action.player,
    attackerUid: attacker.uid,
    target,
    stackItemId: item.id,
  });
}

function handleNextPhase(ctx: Ctx, action: Extract<Action, { type: 'nextPhase' }>): void {
  const { s } = ctx;
  requireNoPending(s, action);
  if (s.activePlayer !== action.player) fail('not your turn', action);
  if (s.stack.length > 0) fail('stack must be empty', action);
  if (s.pendingWindow) fail('phase change already in progress', action);
  let to: 'battle' | 'main2' | 'end' | null =
    s.phase === 'main1' ? 'battle' : s.phase === 'battle' ? 'main2' : s.phase === 'main2' ? 'end' : null;
  if (!to) fail(`cannot advance from phase ${s.phase}`, action);
  // M2.5 §3: the first player's turn 1 has no Battle Phase — main1 skips to main2.
  if (to === 'battle' && s.turn === 1 && !s.config.firstTurnBattle) to = 'main2';
  s.pendingWindow = { to };
  // Opponent gets a response window; auto-close it if they cannot act.
  const opp = other(action.player);
  if (hasAnyActivation(s, opp)) {
    s.priority = opp;
    s.passes = 0;
  } else {
    executeTransition(ctx);
  }
}

function handlePass(ctx: Ctx, action: Extract<Action, { type: 'pass' }>): void {
  const { s, events } = ctx;
  requireNoPending(s, action);
  if (s.priority !== action.player) fail('you do not have priority', action);
  events.push({ type: 'PriorityPassed', player: action.player });
  if (s.stack.length > 0) {
    s.passes += 1;
    if (s.passes >= 2) resolveTop(ctx);
    else s.priority = other(action.player);
    return;
  }
  if (s.pendingWindow) {
    executeTransition(ctx);
    return;
  }
  fail('nothing to pass on', action);
}

function handleDiscardCard(ctx: Ctx, action: Extract<Action, { type: 'discardCard' }>): void {
  const { s, events } = ctx;
  if (s.pending?.type !== 'discard' || s.pending.player !== action.player)
    fail('no discard pending for you', action);
  const ps = s.players[action.player];
  const card = ps.hand[action.handIndex];
  if (!card) fail('no such hand card', action);
  ps.hand.splice(action.handIndex, 1);
  ps.graveyard.push(card);
  events.push({ type: 'CardDiscarded', player: action.player, cardId: card.id, handLimit: true });
  if (ps.hand.length > s.config.handLimit) return; // keep discarding
  s.pending = null;
  finishTurn(ctx);
}

function handleBankChoice(ctx: Ctx, action: Extract<Action, { type: 'bankChoice' }>): void {
  const { s, events } = ctx;
  if (s.pending?.type !== 'bankTrigger' || s.pending.player !== action.player)
    fail('no bank trigger pending for you', action);
  const pending = s.pending;
  const ps = s.players[action.player];
  switch (action.choice) {
    case 'bank': {
      const card = action.handIndex !== undefined ? ps.hand[action.handIndex] : undefined;
      if (!card) fail('no such hand card', action);
      if (card.rank === 'JOKER' && !s.config.jokersBankable)
        fail('Jokers cannot be banked', action);
      ps.hand.splice(ps.hand.indexOf(card), 1);
      ps.bank.push(card);
      events.push({ type: 'CardBanked', player: action.player, cardId: card.id });
      break;
    }
    case 'remove': {
      if (action.bankIndex === undefined) fail('bankIndex required', action);
      removeBankCard(ctx, other(action.player), action.bankIndex, 'bankTrigger');
      break;
    }
    case 'decline':
      if (!s.config.bankTriggerDeclinable) fail('bank trigger cannot be declined', action);
      // Declining forfeits the whole trigger, including any scaled remainder.
      events.push({ type: 'BankTriggerDeclined', player: action.player });
      s.pending = null;
      resumeFlow(ctx);
      return;
  }
  // A bank/remove consumes one grant; a scaled trigger may still owe more.
  const remaining = pending.remaining - 1;
  if (remaining > 0 && bankTriggerHasOption(s, action.player)) {
    s.pending = { type: 'bankTrigger', player: action.player, remaining };
    return;
  }
  s.pending = null;
  resumeFlow(ctx);
}

function handleFlipChoice(ctx: Ctx, action: Extract<Action, { type: 'flipChoice' }>): void {
  const { s, events } = ctx;
  if (s.pending?.type !== 'flipDecision' || s.pending.player !== action.player)
    fail('no flip decision pending for you', action);
  const { sourceUid } = s.pending;
  s.pending = null;
  if (action.choice === 'decline') {
    events.push({ type: 'FlipDeclined', player: action.player, uid: sourceUid });
    resumeFlow(ctx);
    return;
  }
  // Activate: put the trigger on the stack now (queueFlipTrigger sets the
  // flipTarget pending itself for 2/6, in which case we must not resume yet).
  const loc = findMonster(s, sourceUid);
  if (loc) queueFlipTrigger(ctx, loc);
  if (!s.pending) resumeFlow(ctx);
}

function handleChooseFlipTarget(ctx: Ctx, action: Extract<Action, { type: 'chooseFlipTarget' }>): void {
  const { s } = ctx;
  if (s.pending?.type !== 'flipTarget' || s.pending.player !== action.player)
    fail('no flip target pending for you', action);
  const item = s.stack.find((i) => i.id === (s.pending as { stackItemId: number }).stackItemId);
  if (!item || item.kind !== 'flip') fail('flip trigger vanished', action);
  if (!findMonster(s, action.monsterUid)) fail('no such monster on field', action);
  item.targetMonsterUid = action.monsterUid;
  s.pending = null;
  resumeFlow(ctx);
}

function handleChooseInterceptor(ctx: Ctx, action: Extract<Action, { type: 'chooseInterceptor' }>): void {
  const { s } = ctx;
  if (s.pending?.type !== 'interceptor' || s.pending.player !== action.player)
    fail('no interceptor choice pending for you', action);
  const loc = findMonster(s, action.monsterUid);
  if (!loc || loc.player !== action.player) fail('interceptor must be your monster', action);
  const { attacker, attackerUid } = s.pending;
  s.pending = null;
  const aloc = findMonster(s, attackerUid);
  if (!aloc || aloc.m.position !== 'attack') {
    ctx.events.push({ type: 'EffectFizzled', kind: 'attack', reason: 'attacker no longer in attack position' });
  } else {
    interceptAttack(ctx, attacker, attackerUid, action.monsterUid);
  }
  resumeFlow(ctx);
}

function handleWallPunishPick(ctx: Ctx, action: Extract<Action, { type: 'wallPunishPick' }>): void {
  const { s } = ctx;
  if (s.pending?.type !== 'wallPunishPick' || s.pending.player !== action.player)
    fail('no wall-punish pick pending for you', action);
  const attacker = s.pending.attacker;
  if (!s.players[attacker].bank[action.bankIndex]) fail('no such bank card', action);
  removeBankCard(ctx, attacker, action.bankIndex, 'wallPunish');
  s.pending = null;
  resumeFlow(ctx);
}

function handlePolyHit(ctx: Ctx, action: Extract<Action, { type: 'polyHit' }>): void {
  const { s } = ctx;
  if (s.pending?.type !== 'polyHitStand' || s.pending.player !== action.player)
    fail('no poly decision pending for you', action);
  s.pending = null;
  s.poly!.dealsRemaining = 1;
  continuePoly(ctx);
}

function handlePolyStand(ctx: Ctx, action: Extract<Action, { type: 'polyStand' }>): void {
  const { s } = ctx;
  if (s.pending?.type !== 'polyHitStand' || s.pending.player !== action.player)
    fail('no poly decision pending for you', action);
  s.pending = null;
  polyStandFinish(ctx);
}

function handlePolyAce(ctx: Ctx, action: Extract<Action, { type: 'polyAce' }>): void {
  const { s } = ctx;
  if (s.pending?.type !== 'polyAce' || s.pending.player !== action.player)
    fail('no ace decision pending for you', action);
  if (action.value !== 1 && action.value !== 11) fail('ace is 1 or 11', action);
  s.pending = null;
  s.poly!.total += action.value;
  continuePoly(ctx);
}

// ---------------------------------------------------------------------------

export function applyAction(
  state: GameState,
  action: Action,
  rng: SeededRNG,
): { state: GameState; events: GameEvent[] } {
  if (state.phase === 'gameOver') fail('game is over', action);
  if (action.player !== 0 && action.player !== 1) fail('bad player id', action);
  const s = cloneState(state);
  const events: GameEvent[] = [];
  const ctx: Ctx = { s, events, rng };
  switch (action.type) {
    case 'mulligan':
      handleMulligan(ctx, action);
      break;
    case 'summon':
      handleSummon(ctx, action);
      break;
    case 'setSpell':
      handleSetSpell(ctx, action);
      break;
    case 'flipMonster':
      handleFlipMonster(ctx, action);
      break;
    case 'changePosition':
      handleChangePosition(ctx, action);
      break;
    case 'castSpell':
      handleCastSpell(ctx, action);
      break;
    case 'castJoker':
      handleCastJoker(ctx, action);
      break;
    case 'declareAttack':
      handleDeclareAttack(ctx, action);
      break;
    case 'nextPhase':
      handleNextPhase(ctx, action);
      break;
    case 'pass':
      handlePass(ctx, action);
      break;
    case 'discardCard':
      handleDiscardCard(ctx, action);
      break;
    case 'bankChoice':
      handleBankChoice(ctx, action);
      break;
    case 'flipChoice':
      handleFlipChoice(ctx, action);
      break;
    case 'chooseFlipTarget':
      handleChooseFlipTarget(ctx, action);
      break;
    case 'chooseInterceptor':
      handleChooseInterceptor(ctx, action);
      break;
    case 'wallPunishPick':
      handleWallPunishPick(ctx, action);
      break;
    case 'polyHit':
      handlePolyHit(ctx, action);
      break;
    case 'polyStand':
      handlePolyStand(ctx, action);
      break;
    case 'polyAce':
      handlePolyAce(ctx, action);
      break;
    default: {
      const never: never = action;
      fail(`unknown action ${(never as Action).type}`);
    }
  }
  return { state: s, events };
}
