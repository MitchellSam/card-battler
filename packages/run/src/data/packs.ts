// Pack economy (Part B). Numbers provisional, in data. Grace degradation rule:
// any tier reference resolves to the best IMPLEMENTED AND DISCOVERED tier ≤ it
// — "guaranteed rare" honestly yields an uncommon until rares exist (M5).

import type { PackDef, PackId } from '../types.js';

// Playtest feedback (2026-07-19, Mitchell): packs restock freely within a
// visit (no stockPerVisit) and a pull is a pick-1-of-3 of the rolled tier.
// Both are data knobs — set stockPerVisit / choices: 1 to revert.
export const PACKS: Record<PackId, PackDef> = {
  cornerStore: {
    id: 'cornerStore',
    name: 'Corner Store Pack',
    cost: 25,
    weights: { common: 0.8, uncommon: 0.18, rare: 0.02 },
    choices: 3,
  },
  tradeBinder: {
    id: 'tradeBinder',
    name: 'Trade Binder Pack',
    cost: 50,
    weights: { common: 0.35, uncommon: 0.5, rare: 0.15 },
    guarantee: 'best-available',
    choices: 3,
  },
};
