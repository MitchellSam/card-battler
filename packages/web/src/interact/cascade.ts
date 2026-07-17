// The selection cascade: the human composes an action click by click, and at
// every step the ONLY options offered are values present in the filtered
// legal-action list. No legality is ever computed here — the engine's
// legalActions() is the sole authority; this module just narrows it.

import type { Action, PlayerId } from '@house-rules/engine';

export type Origin =
  | { kind: 'hand'; handIndex: number }
  | { kind: 'monster'; zoneIndex: number } // own monster zone
  | { kind: 'stZone'; zoneIndex: number }; // own set spell/trap zone

export type VerbKey =
  | 'summon:attack'
  | 'summon:set'
  | 'setSpell'
  | 'cast:rank'
  | 'cast:suit'
  | 'castJoker'
  | 'attack'
  | 'flip'
  | 'position';

export interface Sel {
  origin: Origin;
  verb?: VerbKey;
  sacrifices?: number[];
  zoneIndex?: number; // destination zone (summon / setSpell)
  targetMonsterUid?: number;
  targetStackItemId?: number;
  targetSTZone?: { player: PlayerId; zoneIndex: number };
  graveTarget?: { player: PlayerId; cardId: string };
  summonPosition?: 'attack' | 'defense';
  discardHandIndex?: number;
  aceValue?: 1 | 11;
  attackTarget?: number | 'direct'; // opponent zone index, or direct
}

export type ParamStep =
  | { kind: 'chooseSacrifices'; options: number[]; required: number; chosen: number[] }
  | { kind: 'chooseZone'; options: number[] }
  | { kind: 'chooseMonsterTarget'; options: number[] } // monster uids (either side)
  | { kind: 'chooseStackTarget'; options: number[] } // stack item ids
  | { kind: 'chooseSTTarget'; options: { player: PlayerId; zoneIndex: number }[] }
  | { kind: 'chooseGraveTarget'; options: { player: PlayerId; cardId: string }[] }
  | { kind: 'chooseSummonPosition'; options: ('attack' | 'defense')[] }
  | { kind: 'chooseDiscard'; options: number[] } // own hand indices
  | { kind: 'chooseAceValue'; options: (1 | 11)[] }
  | { kind: 'chooseAttackTarget'; options: (number | 'direct')[] };

export type Step =
  | { kind: 'chooseVerb'; verbs: VerbKey[] }
  | ParamStep
  | { kind: 'ready'; action: Action }
  | { kind: 'dead' };

export function verbOf(a: Action): VerbKey | null {
  switch (a.type) {
    case 'summon':
      return a.mode === 'attack' ? 'summon:attack' : 'summon:set';
    case 'setSpell':
      return 'setSpell';
    case 'castSpell':
      return a.mode === 'rank' ? 'cast:rank' : 'cast:suit';
    case 'castJoker':
      return 'castJoker';
    case 'declareAttack':
      return 'attack';
    case 'flipMonster':
      return 'flip';
    case 'changePosition':
      return 'position';
    default:
      return null;
  }
}

function matchesOrigin(a: Action, o: Origin): boolean {
  switch (o.kind) {
    case 'hand':
      if (a.type === 'summon' || a.type === 'setSpell' || a.type === 'castJoker')
        return a.handIndex === o.handIndex;
      if (a.type === 'castSpell')
        return a.source.from === 'hand' && a.source.handIndex === o.handIndex;
      return false;
    case 'monster':
      if (a.type === 'flipMonster' || a.type === 'changePosition')
        return a.zoneIndex === o.zoneIndex;
      if (a.type === 'declareAttack') return a.attackerZone === o.zoneIndex;
      return false;
    case 'stZone':
      return a.type === 'castSpell' && a.source.from === 'zone' && a.source.zoneIndex === o.zoneIndex;
  }
}

const sameKey = (x: unknown, y: unknown): boolean => JSON.stringify(x) === JSON.stringify(y);

function matches(a: Action, sel: Sel): boolean {
  const verb = verbOf(a);
  if (verb === null || !matchesOrigin(a, sel.origin)) return false;
  if (sel.verb !== undefined && verb !== sel.verb) return false;
  if (sel.sacrifices && sel.sacrifices.length > 0) {
    if (a.type !== 'summon' || !a.sacrificeZoneIndices) return false;
    if (!sel.sacrifices.every((z) => a.sacrificeZoneIndices!.includes(z))) return false;
  }
  if (sel.zoneIndex !== undefined) {
    if (a.type !== 'summon' && a.type !== 'setSpell') return false;
    if (a.zoneIndex !== sel.zoneIndex) return false;
  }
  if (sel.targetMonsterUid !== undefined) {
    if (a.type !== 'castSpell' || a.targetMonsterUid !== sel.targetMonsterUid) return false;
  }
  if (sel.targetStackItemId !== undefined) {
    if (a.type !== 'castSpell' || a.targetStackItemId !== sel.targetStackItemId) return false;
  }
  if (sel.targetSTZone !== undefined) {
    if (a.type !== 'castSpell' || !sameKey(a.targetSTZone, sel.targetSTZone)) return false;
  }
  if (sel.graveTarget !== undefined) {
    if (a.type !== 'castSpell' || !sameKey(a.graveTarget, sel.graveTarget)) return false;
  }
  if (sel.summonPosition !== undefined) {
    if (a.type !== 'castSpell' || a.summonPosition !== sel.summonPosition) return false;
  }
  if (sel.discardHandIndex !== undefined) {
    if (a.type !== 'castSpell' || a.discardHandIndex !== sel.discardHandIndex) return false;
  }
  if (sel.aceValue !== undefined) {
    if (a.type !== 'castSpell' || a.aceValue !== sel.aceValue) return false;
  }
  if (sel.attackTarget !== undefined) {
    if (a.type !== 'declareAttack') return false;
    if (sel.attackTarget === 'direct') {
      if (!a.direct) return false;
    } else if (a.targetZone !== sel.attackTarget) return false;
  }
  return true;
}

export function candidatesFor(legal: Action[], sel: Sel): Action[] {
  return legal.filter((a) => matches(a, sel));
}

function uniq<T>(xs: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of xs) {
    const k = JSON.stringify(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

/** The first still-open parameter of the (verb-narrowed) candidate set, or null. */
function pendingParam(cands: Action[], sel: Sel): ParamStep | null {
  const a0 = cands[0]!;
  if (a0.type === 'summon') {
    const required = a0.sacrificeZoneIndices?.length ?? 0;
    const chosen = sel.sacrifices ?? [];
    if (chosen.length < required) {
      const options = uniq(
        cands.flatMap((a) =>
          a.type === 'summon'
            ? (a.sacrificeZoneIndices ?? []).filter((z) => !chosen.includes(z))
            : [],
        ),
      );
      return { kind: 'chooseSacrifices', options, required, chosen };
    }
    if (sel.zoneIndex === undefined)
      return { kind: 'chooseZone', options: uniq(cands.map((a) => (a as typeof a0).zoneIndex)) };
    return null;
  }
  if (a0.type === 'setSpell') {
    if (sel.zoneIndex === undefined)
      return { kind: 'chooseZone', options: uniq(cands.map((a) => (a as typeof a0).zoneIndex)) };
    return null;
  }
  if (a0.type === 'castSpell') {
    const of = <K extends keyof typeof a0>(k: K) =>
      uniq(cands.flatMap((a) => (a.type === 'castSpell' && a[k] !== undefined ? [a[k]] : [])));
    if (a0.targetMonsterUid !== undefined && sel.targetMonsterUid === undefined)
      return { kind: 'chooseMonsterTarget', options: of('targetMonsterUid') as number[] };
    if (a0.targetStackItemId !== undefined && sel.targetStackItemId === undefined)
      return { kind: 'chooseStackTarget', options: of('targetStackItemId') as number[] };
    if (a0.targetSTZone !== undefined && sel.targetSTZone === undefined)
      return { kind: 'chooseSTTarget', options: of('targetSTZone') as { player: PlayerId; zoneIndex: number }[] };
    if (a0.graveTarget !== undefined && sel.graveTarget === undefined)
      return { kind: 'chooseGraveTarget', options: of('graveTarget') as { player: PlayerId; cardId: string }[] };
    if (a0.discardHandIndex !== undefined && sel.discardHandIndex === undefined)
      return { kind: 'chooseDiscard', options: of('discardHandIndex') as number[] };
    if (a0.aceValue !== undefined && sel.aceValue === undefined)
      return { kind: 'chooseAceValue', options: of('aceValue') as (1 | 11)[] };
    if (a0.summonPosition !== undefined && sel.summonPosition === undefined)
      return { kind: 'chooseSummonPosition', options: of('summonPosition') as ('attack' | 'defense')[] };
    return null;
  }
  if (a0.type === 'declareAttack') {
    if (sel.attackTarget === undefined) {
      const options = uniq(
        cands.flatMap((a) =>
          a.type === 'declareAttack' ? [a.direct ? ('direct' as const) : a.targetZone!] : [],
        ),
      );
      return { kind: 'chooseAttackTarget', options };
    }
    return null;
  }
  return null; // castJoker / flipMonster / changePosition carry no further params
}

/** Record one user choice onto the selection. */
export function applyChoice(sel: Sel, step: Step, value: unknown): Sel {
  switch (step.kind) {
    case 'chooseVerb':
      return { ...sel, verb: value as VerbKey };
    case 'chooseSacrifices':
      return { ...sel, sacrifices: [...(sel.sacrifices ?? []), value as number] };
    case 'chooseZone':
      return { ...sel, zoneIndex: value as number };
    case 'chooseMonsterTarget':
      return { ...sel, targetMonsterUid: value as number };
    case 'chooseStackTarget':
      return { ...sel, targetStackItemId: value as number };
    case 'chooseSTTarget':
      return { ...sel, targetSTZone: value as { player: PlayerId; zoneIndex: number } };
    case 'chooseGraveTarget':
      return { ...sel, graveTarget: value as { player: PlayerId; cardId: string } };
    case 'chooseSummonPosition':
      return { ...sel, summonPosition: value as 'attack' | 'defense' };
    case 'chooseDiscard':
      return { ...sel, discardHandIndex: value as number };
    case 'chooseAceValue':
      return { ...sel, aceValue: value as 1 | 11 };
    case 'chooseAttackTarget':
      return { ...sel, attackTarget: value as number | 'direct' };
    default:
      return sel;
  }
}

/**
 * Resolve the next UI step for a selection. Single-option parameters are
 * auto-advanced (never offered as a one-button "choice"); when exactly one
 * candidate remains fully determined, it is ready to dispatch.
 */
export function nextStep(legal: Action[], sel: Sel): Step {
  let cur: Sel = { ...sel };
  let cands = candidatesFor(legal, cur);
  if (cands.length === 0) return { kind: 'dead' };

  if (cur.verb === undefined) {
    const verbs = uniq(cands.map(verbOf).filter((v): v is VerbKey => v !== null));
    if (verbs.length > 1) return { kind: 'chooseVerb', verbs };
    cur = { ...cur, verb: verbs[0]! };
    cands = candidatesFor(legal, cur);
  }

  for (;;) {
    const step = pendingParam(cands, cur);
    if (step === null) break;
    const opts = step.options as unknown[];
    if (step.kind === 'chooseSacrifices') {
      const remaining = step.required - step.chosen.length;
      if (opts.length > remaining) return step; // a real choice
      // forced: every remaining option is needed — take them all
      cur = { ...cur, sacrifices: [...step.chosen, ...(opts as number[])] };
    } else {
      if (opts.length > 1) return step;
      cur = applyChoice(cur, step, opts[0]);
    }
    cands = candidatesFor(legal, cur);
    if (cands.length === 0) return { kind: 'dead' };
  }

  if (cands.length === 1) return { kind: 'ready', action: cands[0]! };
  return { kind: 'dead' }; // should be unreachable: params exhausted but ambiguous
}

/** All hand indices that can start any cascade right now (affordance filter). */
export function handOrigins(legal: Action[]): Set<number> {
  const out = new Set<number>();
  for (const a of legal) {
    if (a.type === 'summon' || a.type === 'setSpell' || a.type === 'castJoker')
      out.add(a.handIndex);
    else if (a.type === 'castSpell' && a.source.from === 'hand') out.add(a.source.handIndex);
  }
  return out;
}

/** Own monster zones that can start a cascade (attack / flip / position). */
export function monsterOrigins(legal: Action[]): Set<number> {
  const out = new Set<number>();
  for (const a of legal) {
    if (a.type === 'flipMonster' || a.type === 'changePosition') out.add(a.zoneIndex);
    else if (a.type === 'declareAttack') out.add(a.attackerZone);
  }
  return out;
}

/** Own set spell/trap zones that can start a cascade (instant activation). */
export function stZoneOrigins(legal: Action[]): Set<number> {
  const out = new Set<number>();
  for (const a of legal)
    if (a.type === 'castSpell' && a.source.from === 'zone') out.add(a.source.zoneIndex);
  return out;
}
