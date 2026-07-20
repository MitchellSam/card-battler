// Encounter ladder (recommendations §6): greedy everywhere; difficulty scales
// by ASYMMETRIC CONFIG, not smarter AI (spec §5). The boss cheat is ONE
// legible per-player override — it's data; swap it for ante-8 or a 6th zone by
// editing this file.
//
// REVISION 2: every win offers a pick-1-of-`count` sticker choice with the
// listed tier weights (drawn from ALL implemented effects; undiscovered picks
// unlock). Elites/boss roll richer odds. Weights provisional.

import type { EncounterDef } from '../types.js';

export const ENCOUNTERS: Record<string, EncounterDef> = {
  standard: {
    id: 'standard',
    name: 'Duel',
    agentName: 'greedy',
    rewardCurrency: 20,
    rewardPick: { count: 3, weights: { common: 0.7, uncommon: 0.27, rare: 0.03 } },
  },
  elite: {
    id: 'elite',
    name: 'Elite Duel',
    agentName: 'greedy',
    aiOverrides: { ante: 6 }, // +1 ante over the run baseline of 5
    scrawl: 'THEY GET SIX ANTE CARDS. SIX. —Sam',
    rewardCurrency: 35,
    rewardPick: { count: 3, weights: { common: 0.35, uncommon: 0.55, rare: 0.1 } },
  },
  boss: {
    id: 'boss',
    name: 'The Grown-Up',
    agentName: 'greedy',
    aiOverrides: { drawPerTurn: 3 }, // THE one legible cheat (default; data-swappable)
    scrawl: "HE DRAWS 3. THAT'S NOT FAIR. —Sam",
    rewardCurrency: 60,
    rewardPick: { count: 3, weights: { common: 0.2, uncommon: 0.6, rare: 0.2 } },
  },
  // Event-spawned elites:
  bully: {
    id: 'bully',
    name: 'The Bully',
    agentName: 'greedy',
    aiOverrides: { ante: 6 },
    humanOverrides: { ante: 4 }, // the handicap: you ante one short
    scrawl: 'HE MADE ME ANTE SHORT. BULLY. —Sam',
    rewardCurrency: 45,
    rewardPick: { count: 3, weights: { common: 0.3, uncommon: 0.55, rare: 0.15 } },
  },
  'rival-riley': {
    id: 'rival-riley',
    name: 'Rival Riley',
    agentName: 'greedy',
    aiOverrides: { ante: 6, drawPerTurn: 3 },
    scrawl: 'RILEY CHEATS TWICE. EVERYONE KNOWS. —Sam',
    rewardCurrency: 30,
    rewardPick: { count: 3, weights: { common: 0.15, uncommon: 0.55, rare: 0.3 } },
  },
};
