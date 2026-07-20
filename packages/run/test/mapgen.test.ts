// Map generator: structural constraints hold for many seeds, and generation
// is deterministic from the seed.

import { describe, expect, it } from 'vitest';
import { createRng } from '@house-rules/engine';
import { MAP_CONFIG } from '../src/data/config.js';
import { generateMap, nodeById } from '../src/mapgen.js';
import type { NodeMap } from '../src/types.js';

function incoming(map: NodeMap, id: string): string[] {
  return map.nodes.filter((n) => n.next.includes(id)).map((n) => n.id);
}

/** True iff a start→boss path exists that never passes through a shop. */
function shopFreePathExists(map: NodeMap): boolean {
  const ok = new Set<string>();
  for (const n of map.nodes) {
    if (n.type === 'shop') continue;
    if (n.column === 0 || incoming(map, n.id).some((id) => ok.has(id))) ok.add(n.id);
  }
  return ok.has('boss');
}

describe('node map generation', () => {
  it('satisfies every structural constraint across 60 seeds', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const map = generateMap(createRng(seed));
      expect(map.columns).toBe(MAP_CONFIG.actLength - 1);

      const boss = nodeById(map, 'boss');
      expect(boss.type).toBe('boss');
      expect(boss.next).toEqual([]);
      expect(map.nodes.filter((n) => n.type === 'boss')).toHaveLength(1);

      for (let col = 0; col < map.columns; col++) {
        const width = map.nodes.filter((n) => n.column === col).length;
        expect(width).toBeGreaterThanOrEqual(MAP_CONFIG.minWidth);
        expect(width).toBeLessThanOrEqual(MAP_CONFIG.maxWidth);
      }

      for (const n of map.nodes) {
        // connectivity: everything flows forward into the boss
        if (n.id !== 'boss') {
          expect(n.next.length, `${n.id} has no exit`).toBeGreaterThan(0);
          for (const id of n.next) expect(nodeById(map, id).column).toBe(n.column + 1);
        }
        if (n.column > 0) expect(incoming(map, n.id).length, `${n.id} unreachable`).toBeGreaterThan(0);
        // content assignment
        if (n.type === 'event') expect(n.eventId).toBeDefined();
        if (n.type === 'duel') expect(n.encounterId).toBe('standard');
        if (n.type === 'elite') expect(n.encounterId).toBe('elite');
        // no two elites adjacent
        if (n.type === 'elite')
          for (const id of n.next) expect(nodeById(map, id).type).not.toBe('elite');
      }

      // ≥1 shop on every path
      expect(shopFreePathExists(map), `seed ${seed}: shop-free path`).toBe(false);
    }
  });

  it('is deterministic from the seed', () => {
    expect(JSON.stringify(generateMap(createRng(42)))).toBe(
      JSON.stringify(generateMap(createRng(42))),
    );
    expect(JSON.stringify(generateMap(createRng(42)))).not.toBe(
      JSON.stringify(generateMap(createRng(43))),
    );
  });

  it('duels dominate the node mix across seeds (weights sanity)', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 40; seed++)
      for (const n of generateMap(createRng(seed)).nodes)
        counts[n.type] = (counts[n.type] ?? 0) + 1;
    expect(counts['duel']!).toBeGreaterThan(counts['event']!);
    expect(counts['event']!).toBeGreaterThan(counts['elite']!);
    expect(counts['shop']!).toBeGreaterThan(0);
    expect(counts['treasure']!).toBeGreaterThan(0);
  });
});
