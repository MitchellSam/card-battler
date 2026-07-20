// Seeded StS-style DAG generator (recommendations §6). Columns of 2-4 nodes,
// edges only into the next column (equal path lengths by construction), boss
// as the single terminal node. Constraints: ≥1 Shop on every path, no two
// Elites adjacent. All randomness flows through the injected SeededRNG.

import { shuffle, type SeededRNG } from '@house-rules/engine';
import { MAP_CONFIG } from './data/config.js';
import { EVENTS } from './data/events.js';
import type { MapNode, NodeMap, NodeType } from './types.js';

const POOL: { type: NodeType; weight: number }[] = [
  { type: 'duel', weight: MAP_CONFIG.weights.duel },
  { type: 'event', weight: MAP_CONFIG.weights.event },
  { type: 'shop', weight: MAP_CONFIG.weights.shop },
  { type: 'elite', weight: MAP_CONFIG.weights.elite },
  { type: 'treasure', weight: MAP_CONFIG.weights.treasure },
];

function rollType(rng: SeededRNG): NodeType {
  const total = POOL.reduce((s, p) => s + p.weight, 0);
  let roll = rng.float() * total;
  for (const p of POOL) {
    roll -= p.weight;
    if (roll <= 0) return p.type;
  }
  return 'duel';
}

/** Node lookup by id (maps are small; a scan keeps NodeMap plain-JSON). */
export function nodeById(map: NodeMap, id: string): MapNode {
  const node = map.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`no such node: ${id}`);
  return node;
}

/** The nodes pickable next: column 0 before the first pick, else the edges. */
export function reachableNodes(map: NodeMap, position: string | null): MapNode[] {
  if (position === null) return map.nodes.filter((n) => n.column === 0);
  return nodeById(map, position).next.map((id) => nodeById(map, id));
}

export function generateMap(rng: SeededRNG): NodeMap {
  const columns = MAP_CONFIG.actLength - 1; // boss is the +1
  const span = MAP_CONFIG.maxWidth - MAP_CONFIG.minWidth + 1;
  const widths = Array.from({ length: columns }, () => MAP_CONFIG.minWidth + rng.int(span));

  const grid: MapNode[][] = widths.map((w, col) =>
    Array.from({ length: w }, (_, index) => ({
      id: `n${col}-${index}`,
      column: col,
      index,
      type: rollType(rng),
      next: [] as string[],
    })),
  );

  // Edges: monotone base mapping + occasional extra neighbour (no crossings),
  // then guarantee every next-column node has an incoming edge.
  for (let col = 0; col < columns - 1; col++) {
    const a = grid[col]!;
    const b = grid[col + 1]!;
    for (let j = 0; j < a.length; j++) {
      const base = Math.floor((j * b.length) / a.length);
      a[j]!.next.push(b[base]!.id);
      if (base + 1 < b.length && rng.float() < 0.4) a[j]!.next.push(b[base + 1]!.id);
    }
    for (let k = 0; k < b.length; k++) {
      if (a.some((n) => n.next.includes(b[k]!.id))) continue;
      const j = Math.min(a.length - 1, Math.floor((k * a.length) / b.length));
      a[j]!.next.push(b[k]!.id);
    }
  }
  const boss: MapNode = {
    id: 'boss',
    column: columns,
    index: 0,
    type: 'boss',
    next: [],
    encounterId: 'boss',
  };
  for (const n of grid[columns - 1]!) n.next.push('boss');

  const nodes = [...grid.flat(), boss];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Constraint: no two Elites adjacent (demote the later one to a duel).
  for (const n of nodes)
    if (n.type === 'elite')
      for (const id of n.next) {
        const m = byId.get(id)!;
        if (m.type === 'elite') m.type = 'duel';
      }

  // Constraint: ≥1 Shop on every path. While a shop-free start→boss path
  // exists, convert a random node on one such path into a Shop.
  for (let guard = 0; guard < 50; guard++) {
    const shopFree = new Set<string>(); // reachable from start without passing a shop
    for (const n of nodes) {
      if (n.type === 'shop') continue;
      const entered =
        n.column === 0 ||
        nodes.some((p) => p.column === n.column - 1 && shopFree.has(p.id) && p.next.includes(n.id));
      if (entered) shopFree.add(n.id);
    }
    if (!shopFree.has('boss')) break;
    // Trace one shop-free path backwards from the boss, then shop-ify a random
    // non-boss, non-treasure step on it (treasures are scarce; duels are not).
    const path: MapNode[] = [];
    let cur = boss;
    while (cur.column > 0) {
      const preds = nodes.filter(
        (p) => p.column === cur.column - 1 && shopFree.has(p.id) && p.next.includes(cur.id),
      );
      cur = preds[rng.int(preds.length)]!;
      path.push(cur);
    }
    const candidates = path.filter((n) => n.type !== 'treasure');
    const pool = candidates.length > 0 ? candidates : path;
    if (pool.length === 0) break;
    pool[rng.int(pool.length)]!.type = 'shop';
  }

  // Content assignment: events cycle through a shuffled copy of the pool so a
  // map repeats an event only after all 12 have appeared.
  const eventIds = shuffle(EVENTS.map((e) => e.id), rng);
  let nextEvent = 0;
  for (const n of nodes) {
    if (n.type === 'event') n.eventId = eventIds[nextEvent++ % eventIds.length];
    else if (n.type === 'duel') n.encounterId = 'standard';
    else if (n.type === 'elite') n.encounterId = 'elite';
  }

  return { columns, nodes };
}
