// The 6 zero-engine sheet mods (ratified working set, recommendations §1).
// Each = exactly one RulesConfig field, applied to BOTH players (symmetric,
// scrawled on the Cheat Sheet). Wild Jokers + Recycling need engine work → M5.

import type { SheetModDef } from '../types.js';

export const SHEET_MODS: SheetModDef[] = [
  {
    id: 'no-take-backs',
    name: 'No Take-Backs',
    scrawl: 'NO TAKE-BACKS — attacking a wall costs you NOTHING now.',
    patch: { wallPunish: false },
  },
  {
    id: 'everlasting',
    name: 'Everlasting',
    scrawl: 'EVERLASTING — Queen pumps NEVER wear off.',
    patch: { queenBuffDuration: 'permanent' },
  },
  {
    id: 'big-hand',
    name: 'Big Hand',
    scrawl: 'BIG HAND — you can hold 8 cards. Both of you. Deal with it.',
    patch: { handLimit: 8 },
  },
  {
    id: 'fast-rules',
    name: 'Fast Rules',
    scrawl: 'FAST RULES — everyone draws 3. Games end QUICK.',
    patch: { drawPerTurn: 3 },
  },
  {
    id: 'high-stakes',
    name: 'High Stakes',
    scrawl: 'HIGH STAKES — ante is 8 now. Big banks from turn one.',
    patch: { ante: 8 },
  },
  {
    id: 'sudden-death',
    name: 'Sudden Death',
    scrawl: 'SUDDEN DEATH — winners bank by RAW POWER, not margin.',
    patch: { bankTriggerScaling: 'power' },
  },
];
