// legalActions: full enumeration of every action a player may take right now.
// The reducer enforces the same predicates; tests assert every enumerated
// action applies without throwing (random-playout smoke test).

import {
  isMonsterCard,
  isNumberRank,
  isSettableSpell,
  sacrificeCost,
} from './cards.js';
import type {
  Action,
  GameCard,
  GameState,
  Monster,
  PlayerId,
  StackItem,
  Suit,
} from './types.js';

const other = (p: PlayerId): PlayerId => (1 - p) as PlayerId;

function fieldMonsters(s: GameState): { player: PlayerId; zone: number; m: Monster }[] {
  const out: { player: PlayerId; zone: number; m: Monster }[] = [];
  for (const p of [0, 1] as PlayerId[]) {
    s.players[p].monsters.forEach((m, zone) => {
      if (m) out.push({ player: p, zone, m });
    });
  }
  return out;
}

function negatableStackItems(s: GameState): StackItem[] {
  // ♠ counters "any card/effect on the stack": spells, jokers, flip effects.
  // Attack declarations and internal combat steps are neither cards nor effects.
  return s.stack.filter((i) => i.kind === 'spell' || i.kind === 'joker' || i.kind === 'flip');
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

/**
 * Enumerate every legal castSpell action for one face card from the given source.
 * Targets are chosen (and validated) at cast time; invalid-at-resolution fizzles.
 */
function castOptions(
  s: GameState,
  player: PlayerId,
  card: GameCard,
  source: { from: 'hand'; handIndex: number } | { from: 'zone'; zoneIndex: number },
): Action[] {
  const acts: Action[] = [];
  const ps = s.players[player];
  const all = fieldMonsters(s);
  const ownFaceUp = all.filter((x) => x.player === player && x.m.position !== 'set');
  const oppFaceUp = all.filter((x) => x.player !== player && x.m.position !== 'set');
  const numberDiscards = ps.hand
    .map((c, i) => ({ c, i }))
    .filter(
      ({ c, i }) =>
        isNumberRank(c.rank) && !(source.from === 'hand' && i === source.handIndex),
    );

  // Rank effect
  switch (card.rank) {
    case 'J':
      for (const t of all)
        acts.push({ type: 'castSpell', player, source, mode: 'rank', targetMonsterUid: t.m.uid });
      break;
    case 'Q':
      for (const t of ownFaceUp)
        for (const d of numberDiscards)
          acts.push({
            type: 'castSpell',
            player,
            source,
            mode: 'rank',
            targetMonsterUid: t.m.uid,
            discardHandIndex: d.i,
          });
      break;
    case 'K':
      for (const t of oppFaceUp)
        for (const d of numberDiscards)
          acts.push({
            type: 'castSpell',
            player,
            source,
            mode: 'rank',
            targetMonsterUid: t.m.uid,
            discardHandIndex: d.i,
          });
      break;
  }

  // Suit effect
  const suit = card.suit;
  if (!suit) return acts;
  switch (suitEffectOf(suit)) {
    case 'negate':
      for (const item of negatableStackItems(s))
        acts.push({ type: 'castSpell', player, source, mode: 'suit', targetStackItemId: item.id });
      break;
    case 'revive': {
      const hasRoom = ps.monsters.some((m) => m === null);
      if (!hasRoom) break;
      for (const gp of [0, 1] as PlayerId[]) {
        for (const gc of s.players[gp].graveyard) {
          if (!isMonsterCard(gc)) continue;
          for (const position of ['attack', 'defense'] as const)
            acts.push({
              type: 'castSpell',
              player,
              source,
              mode: 'suit',
              graveTarget: { player: gp, cardId: gc.id },
              summonPosition: position,
            });
        }
      }
      break;
    }
    case 'snipe':
      for (const tp of [0, 1] as PlayerId[]) {
        s.players[tp].spellTraps.forEach((st, zoneIndex) => {
          if (!st) return;
          if (source.from === 'zone' && tp === player && zoneIndex === source.zoneIndex) return;
          acts.push({
            type: 'castSpell',
            player,
            source,
            mode: 'suit',
            targetSTZone: { player: tp, zoneIndex },
          });
        });
      }
      break;
    case 'poly':
      for (const t of ownFaceUp)
        acts.push({ type: 'castSpell', player, source, mode: 'suit', targetMonsterUid: t.m.uid });
      break;
  }
  return acts;
}

/** Instant-speed activations of previously-set face cards, for the priority holder. */
function activationOptions(s: GameState, player: PlayerId): Action[] {
  const acts: Action[] = [];
  s.players[player].spellTraps.forEach((st, zoneIndex) => {
    if (!st || st.setTurn >= s.turn) return; // cannot activate the turn it was set
    acts.push(...castOptions(s, player, st.card, { from: 'zone', zoneIndex }));
  });
  return acts;
}

/** Used by the reducer to auto-close response windows the opponent cannot use. */
export function hasAnyActivation(s: GameState, player: PlayerId): boolean {
  return activationOptions(s, player).length > 0;
}

function mainPhaseActions(s: GameState, player: PlayerId): Action[] {
  const acts: Action[] = [];
  const ps = s.players[player];
  const ownMonsters = ps.monsters
    .map((m, zone) => ({ m, zone }))
    .filter((x): x is { m: Monster; zone: number } => x.m !== null);

  // Normal summon / set (1 per turn)
  if (!s.normalSummonUsed) {
    ps.hand.forEach((card, handIndex) => {
      if (!isMonsterCard(card)) return;
      const cost = sacrificeCost(card);
      const sacCombos: number[][] = [];
      if (cost === 0) sacCombos.push([]);
      else if (cost === 1) for (const a of ownMonsters) sacCombos.push([a.zone]);
      else
        for (let i = 0; i < ownMonsters.length; i++)
          for (let j = i + 1; j < ownMonsters.length; j++)
            sacCombos.push([ownMonsters[i]!.zone, ownMonsters[j]!.zone]);
      for (const sacrifices of sacCombos) {
        for (let zoneIndex = 0; zoneIndex < ps.monsters.length; zoneIndex++) {
          // The target zone may be one freed by a sacrifice.
          if (ps.monsters[zoneIndex] !== null && !sacrifices.includes(zoneIndex)) continue;
          for (const mode of ['attack', 'set'] as const) {
            acts.push({
              type: 'summon',
              player,
              handIndex,
              zoneIndex,
              mode,
              ...(cost > 0 ? { sacrificeZoneIndices: sacrifices } : {}),
            });
          }
        }
      }
    });
  }

  // Set a spell/trap (free action, zone cap only)
  ps.hand.forEach((card, handIndex) => {
    if (!isSettableSpell(card)) return;
    ps.spellTraps.forEach((st, zoneIndex) => {
      if (st === null) acts.push({ type: 'setSpell', player, handIndex, zoneIndex });
    });
  });

  // Cast face-card spells from hand (sorcery speed)
  ps.hand.forEach((card, handIndex) => {
    if (!isSettableSpell(card)) return;
    acts.push(...castOptions(s, player, card, { from: 'hand', handIndex }));
  });

  // Joker: Pot of Greed (sorcery, cannot be set)
  ps.hand.forEach((card, handIndex) => {
    if (card.rank === 'JOKER') acts.push({ type: 'castJoker', player, handIndex });
  });

  // Manual flip of own set monsters (not the turn they were set)
  for (const { m, zone } of ownMonsters) {
    if (m.position === 'set' && (m.setTurn ?? 0) < s.turn)
      acts.push({ type: 'flipMonster', player, zoneIndex: zone });
  }

  // Manual position change
  for (const { m, zone } of ownMonsters) {
    if (
      m.position !== 'set' &&
      m.summonedTurn !== s.turn &&
      m.attackedTurn !== s.turn &&
      m.posChangedTurn !== s.turn
    )
      acts.push({ type: 'changePosition', player, zoneIndex: zone });
  }

  return acts;
}

function battlePhaseActions(s: GameState, player: PlayerId): Action[] {
  const acts: Action[] = [];
  const opp = other(player);
  const oppMonsters = s.players[opp].monsters
    .map((m, zone) => ({ m, zone }))
    .filter((x): x is { m: Monster; zone: number } => x.m !== null);
  s.players[player].monsters.forEach((m, attackerZone) => {
    if (!m || m.position !== 'attack' || m.attackedTurn === s.turn) return;
    if (oppMonsters.length === 0) {
      acts.push({ type: 'declareAttack', player, attackerZone, direct: true });
    } else {
      for (const t of oppMonsters)
        acts.push({ type: 'declareAttack', player, attackerZone, targetZone: t.zone });
    }
  });
  return acts;
}

export function legalActions(s: GameState, player: PlayerId): Action[] {
  if (s.phase === 'gameOver') return [];
  const acts: Action[] = [];

  // Pending decisions lock out everything else.
  if (s.pending) {
    const pending = s.pending;
    if (pending.player !== player) return [];
    switch (pending.type) {
      case 'discard':
        s.players[player].hand.forEach((_, handIndex) =>
          acts.push({ type: 'discardCard', player, handIndex }),
        );
        break;
      case 'bankTrigger': {
        s.players[player].hand.forEach((card, handIndex) => {
          if (card.rank === 'JOKER' && !s.config.jokersBankable) return;
          acts.push({ type: 'bankChoice', player, choice: 'bank', handIndex });
        });
        s.players[other(player)].bank.forEach((_, bankIndex) =>
          acts.push({ type: 'bankChoice', player, choice: 'remove', bankIndex }),
        );
        if (s.config.bankTriggerDeclinable)
          acts.push({ type: 'bankChoice', player, choice: 'decline' });
        break;
      }
      case 'flipTarget':
        for (const t of fieldMonsters(s))
          acts.push({ type: 'chooseFlipTarget', player, monsterUid: t.m.uid });
        break;
      case 'wallPunishPick':
        s.players[pending.attacker].bank.forEach((_, bankIndex) =>
          acts.push({ type: 'wallPunishPick', player, bankIndex }),
        );
        break;
      case 'polyAce':
        acts.push({ type: 'polyAce', player, value: 1 });
        acts.push({ type: 'polyAce', player, value: 11 });
        break;
      case 'polyHitStand':
        acts.push({ type: 'polyHit', player });
        acts.push({ type: 'polyStand', player });
        break;
    }
    return acts;
  }

  if (s.phase === 'mulligan') {
    const ps = s.players[player];
    if (ps.mulliganed) return [];
    const n = ps.hand.length;
    for (let mask = 0; mask < 1 << n; mask++) {
      const discardHandIndices: number[] = [];
      for (let i = 0; i < n; i++) if (mask & (1 << i)) discardHandIndices.push(i);
      acts.push({ type: 'mulligan', player, discardHandIndices });
    }
    return acts;
  }

  // Non-empty stack: priority holder may respond (set-card activations) or pass.
  if (s.stack.length > 0) {
    if (s.priority !== player) return [];
    acts.push({ type: 'pass', player });
    acts.push(...activationOptions(s, player));
    return acts;
  }

  // Phase-change response window (empty stack): window holder acts or passes.
  if (s.pendingWindow) {
    if (s.priority !== player) return [];
    acts.push({ type: 'pass', player });
    acts.push(...activationOptions(s, player));
    return acts;
  }

  // Empty stack, no window: only the active player acts.
  if (player !== s.activePlayer) return [];
  if (s.phase === 'main1' || s.phase === 'main2') {
    acts.push(...mainPhaseActions(s, player));
    acts.push(...activationOptions(s, player));
    acts.push({ type: 'nextPhase', player });
  } else if (s.phase === 'battle') {
    acts.push(...battlePhaseActions(s, player));
    acts.push(...activationOptions(s, player));
    acts.push({ type: 'nextPhase', player });
  }
  return acts;
}
