// REVISION 2 (context-free effects): one place that knows what an effect
// needs picked at activation — targets, discard fuel, ace value, summon
// position. legal.ts enumerates combos from here; the reducer validates the
// chosen combo against the same predicates, for casts and flips alike.

import { effectivePower, isMonsterCard, isNumberRank, isSettableSpell, numberValue } from './cards.js';
import type { EffectSpec } from './effects.js';
import type { GameState, PlayerId, StackItem } from './types.js';

export interface EffectParams {
  targetMonsterUid?: number;
  targetStackItemId?: number;
  targetSTZone?: { player: PlayerId; zoneIndex: number };
  graveTarget?: { player: PlayerId; cardId: string };
  summonPosition?: 'attack' | 'defense';
  discardHandIndex?: number;
  aceValue?: 1 | 11;
}

export interface ParamContext {
  /** Hand cast: the spell's own hand index is not legal fuel. */
  excludeHandIndex?: number;
  /** Zone activation: ♣-style effects cannot target their own source zone. */
  excludeSTZone?: { player: PlayerId; zoneIndex: number };
}

const other = (p: PlayerId): PlayerId => (1 - p) as PlayerId;

interface MonsterRef {
  player: PlayerId;
  uid: number;
  position: 'attack' | 'set' | 'defense';
  power: number;
}

function fieldMonsters(s: GameState): MonsterRef[] {
  const out: MonsterRef[] = [];
  for (const p of [0, 1] as PlayerId[])
    for (const m of s.players[p].monsters)
      if (m) out.push({ player: p, uid: m.uid, position: m.position, power: effectivePower(m) });
  return out;
}

/** ♠ counters cards/effects on the stack: spells, jokers, flip effects. */
export function negatableStackItems(s: GameState): StackItem[] {
  return s.stack.filter((i) => i.kind === 'spell' || i.kind === 'joker' || i.kind === 'flip');
}

function targetMatches(s: GameState, player: PlayerId, spec: EffectSpec, m: MonsterRef): boolean {
  switch (spec.target) {
    case 'anyMonster':
      return true;
    case 'ownMonster':
      return m.player === player;
    case 'ownFaceUp':
      return m.player === player && m.position !== 'set';
    case 'oppFaceUp':
      return m.player !== player && m.position !== 'set';
    case 'oppFaceDown':
      return m.player !== player && m.position === 'set';
    case 'faceUpPowerLE5':
      // Face-down excluded: their power is hidden information (RULES-GAP: see reducer).
      return m.position !== 'set' && m.power <= 5;
    default:
      return false;
  }
}

/** Target-part combos (without fuel). Empty array = no legal activation. */
function targetCombos(s: GameState, player: PlayerId, spec: EffectSpec, ctx: ParamContext): EffectParams[] {
  switch (spec.target) {
    case 'none':
      return [{}];
    case 'stackItem':
      return negatableStackItems(s).map((i) => ({ targetStackItemId: i.id }));
    case 'setSpellZone': {
      const out: EffectParams[] = [];
      for (const p of [0, 1] as PlayerId[])
        s.players[p].spellTraps.forEach((st, zoneIndex) => {
          if (!st) return;
          if (ctx.excludeSTZone && ctx.excludeSTZone.player === p && ctx.excludeSTZone.zoneIndex === zoneIndex)
            return;
          out.push({ targetSTZone: { player: p, zoneIndex } });
        });
      return out;
    }
    case 'graveMonster': {
      if (!s.players[player].monsters.some((m) => m === null)) return []; // needs a free zone
      const out: EffectParams[] = [];
      for (const gp of [0, 1] as PlayerId[])
        for (const gc of s.players[gp].graveyard) {
          if (!isMonsterCard(gc)) continue;
          const positions = spec.needsPosition ? (['attack', 'defense'] as const) : [undefined];
          for (const summonPosition of positions)
            out.push({
              graveTarget: { player: gp, cardId: gc.id },
              ...(summonPosition ? { summonPosition } : {}),
            });
        }
      return out;
    }
    default:
      return fieldMonsters(s)
        .filter((m) => targetMatches(s, player, spec, m))
        .map((m) => ({ targetMonsterUid: m.uid }));
  }
}

/** Fuel-part combos. Empty array = the cost cannot be paid. */
function fuelCombos(s: GameState, player: PlayerId, spec: EffectSpec, ctx: ParamContext): EffectParams[] {
  if (!spec.fuel) return [{}];
  const out: EffectParams[] = [];
  s.players[player].hand.forEach((c, i) => {
    if (i === ctx.excludeHandIndex) return;
    if (spec.fuel === 'number') {
      if (!isNumberRank(c.rank)) return;
      // M2.5 §4: an Ace as fuel is 1 or 11, chosen at activation.
      for (const aceValue of c.rank === 'A' ? ([1, 11] as const) : [undefined])
        out.push({ discardHandIndex: i, ...(aceValue ? { aceValue } : {}) });
    } else {
      if (isSettableSpell(c)) out.push({ discardHandIndex: i });
    }
  });
  return out;
}

/** Every legal param combo for activating this effect right now. */
export function enumerateParams(
  s: GameState,
  player: PlayerId,
  spec: EffectSpec,
  ctx: ParamContext = {},
): EffectParams[] {
  const targets = targetCombos(s, player, spec, ctx);
  if (targets.length === 0) return [];
  const fuels = fuelCombos(s, player, spec, ctx);
  if (fuels.length === 0) return [];
  const out: EffectParams[] = [];
  for (const t of targets) for (const f of fuels) out.push({ ...t, ...f });
  return out;
}

export type ParamCheck = { ok: true; amount?: number } | { ok: false; reason: string };

/** Validate a chosen combo; computes the fuel amount (Q/K value, Leverage 3). */
export function validateParams(
  s: GameState,
  player: PlayerId,
  spec: EffectSpec,
  p: EffectParams,
  ctx: ParamContext = {},
): ParamCheck {
  // target
  switch (spec.target) {
    case 'none':
      break;
    case 'stackItem': {
      const t = s.stack.find((i) => i.id === p.targetStackItemId);
      if (!t || (t.kind !== 'spell' && t.kind !== 'joker' && t.kind !== 'flip'))
        return { ok: false, reason: 'target must be a card/effect on the stack' };
      break;
    }
    case 'setSpellZone': {
      const t = p.targetSTZone;
      if (!t) return { ok: false, reason: 'no set-card target' };
      if (ctx.excludeSTZone && ctx.excludeSTZone.player === t.player && ctx.excludeSTZone.zoneIndex === t.zoneIndex)
        return { ok: false, reason: 'cannot target itself' };
      if (!s.players[t.player].spellTraps[t.zoneIndex]) return { ok: false, reason: 'zone is empty' };
      break;
    }
    case 'graveMonster': {
      const gt = p.graveTarget;
      if (!gt) return { ok: false, reason: 'no graveyard target' };
      const gc = s.players[gt.player].graveyard.find((c) => c.id === gt.cardId);
      if (!gc || !isMonsterCard(gc)) return { ok: false, reason: 'target is not a monster in that graveyard' };
      if (!s.players[player].monsters.some((m) => m === null)) return { ok: false, reason: 'no free monster zone' };
      if (spec.needsPosition && !p.summonPosition) return { ok: false, reason: 'choose a face-up position' };
      break;
    }
    default: {
      const m = fieldMonsters(s).find((x) => x.uid === p.targetMonsterUid);
      if (!m || !targetMatches(s, player, spec, m)) {
        const want: Record<string, string> = {
          anyMonster: 'no such target monster',
          ownMonster: 'must target your monster',
          ownFaceUp: 'must target your monster — face-up, one you control',
          oppFaceUp: "must target the opponent's monster, face-up",
          oppFaceDown: 'must target an opposing face-down monster',
          faceUpPowerLE5: 'must target a face-up monster with power 5 or lower',
        };
        return { ok: false, reason: want[spec.target] ?? `invalid target for ${spec.id}` };
      }
      break;
    }
  }
  // fuel
  if (!spec.fuel) {
    if (p.discardHandIndex !== undefined || p.aceValue !== undefined)
      return { ok: false, reason: 'this effect takes no discard' };
    return { ok: true };
  }
  const di = p.discardHandIndex;
  if (di === undefined) return { ok: false, reason: `${spec.id} requires a discard` };
  if (di === ctx.excludeHandIndex) return { ok: false, reason: 'cannot discard the spell itself' };
  const dc = s.players[player].hand[di];
  if (!dc) return { ok: false, reason: 'no such hand card' };
  if (spec.fuel === 'number') {
    if (!isNumberRank(dc.rank)) return { ok: false, reason: 'discard must be a number card' };
    if (dc.rank === 'A') {
      if (p.aceValue !== 1 && p.aceValue !== 11)
        return { ok: false, reason: 'discarding an Ace requires aceValue 1 or 11' };
      return { ok: true, amount: p.aceValue };
    }
    if (p.aceValue !== undefined) return { ok: false, reason: 'aceValue is only legal with an Ace discard' };
    return { ok: true, amount: numberValue(dc.rank) };
  }
  if (!isSettableSpell(dc)) return { ok: false, reason: 'discard must be a face card' };
  if (p.aceValue !== undefined) return { ok: false, reason: 'aceValue is only legal with an Ace discard' };
  return { ok: true, amount: 3 }; // Leverage: flat +3
}
