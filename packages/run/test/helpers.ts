// Test utilities: hand-built tiny maps so scripted tests hit exact node types
// without fishing through generated maps.

import { createRng } from '@house-rules/engine';
import { applyRun, newAccount, newRun } from '../src/reducer.js';
import type {
  Account,
  FavorId,
  MapNode,
  NodeMap,
  NodeType,
  RunAction,
  RunEvent,
  RunState,
} from '../src/types.js';

/** A single-file map: one node per column, then the boss. */
export function lineMap(...types: (NodeType | { type: NodeType; eventId?: string })[]): NodeMap {
  const nodes: MapNode[] = types.map((t, col) => {
    const spec = typeof t === 'string' ? { type: t } : t;
    return {
      id: `n${col}-0`,
      column: col,
      index: 0,
      type: spec.type,
      next: [col === types.length - 1 ? 'boss' : `n${col + 1}-0`],
      ...(spec.type === 'event' ? { eventId: (spec as { eventId?: string }).eventId } : {}),
      ...(spec.type === 'duel' ? { encounterId: 'standard' } : {}),
      ...(spec.type === 'elite' ? { encounterId: 'elite' } : {}),
    };
  });
  nodes.push({ id: 'boss', column: types.length, index: 0, type: 'boss', next: [], encounterId: 'boss' });
  return { columns: types.length, nodes };
}

export interface TestRunOpts {
  seed?: number;
  map?: NodeMap;
  account?: Account;
  favors?: FavorId[];
  currency?: number;
}

export function testRun(opts: TestRunOpts = {}): RunState {
  const account = opts.account ?? newAccount();
  const run = newRun(account, opts.seed ?? 1, opts.favors ?? []);
  if (opts.map) run.nodeMap = opts.map;
  if (opts.currency !== undefined) run.currency = opts.currency;
  return run;
}

export function accountWithFavors(...favors: FavorId[]): Account {
  return { ...newAccount(), favorsOwned: favors };
}

export interface StepResult {
  run: RunState;
  events: RunEvent[];
}

/** Apply a sequence of actions through the run's own RNG stream. */
export function steps(run: RunState, ...actions: RunAction[]): StepResult {
  let r = run;
  const events: RunEvent[] = [];
  for (const a of actions) {
    const res = applyRun(r, a);
    r = res.run;
    events.push(...res.events);
  }
  return { run: r, events };
}

export const rng1 = () => createRng(1);

export function types(events: RunEvent[]): string[] {
  return events.map((e) => e.type);
}
