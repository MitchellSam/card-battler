// The 7 favors — REVISION 2 (2026-07-19): favors are BETWEEN-RUN progression.
// Each unlocks at an account milestone (thresholds provisional, designer-
// editable) and is equipped as a ≤2-slot loadout at run start. Behaviour is
// implemented in the run reducer keyed by id — no behaviour lambdas in data.
// In-duel favors (recommendations 10-12) ride the A2 overlay in M5.

import type { FavorDef } from '../types.js';

export const FAVORS: FavorDef[] = [
  {
    id: 'sharpie-stash',
    name: 'Sharpie Stash',
    text: 'Start the run with one extra random common sticker.',
    unlock: { kind: 'runsCompleted', count: 1 },
  },
  {
    id: 'lucky-coin',
    name: 'Lucky Coin',
    text: 'Gain a little currency at every shop you visit.',
    unlock: { kind: 'runsCompleted', count: 2 },
  },
  {
    id: 'pack-rat',
    name: 'Pack Rat',
    text: 'Packs cost 15% less.',
    unlock: { kind: 'runsCompleted', count: 3 },
  },
  {
    id: 'trade-binder-regular',
    name: 'Trade Binder Regular',
    text: 'Trade Binder packs roll one extra rare-eligible slot.',
    unlock: { kind: 'runsCompleted', count: 5 },
  },
  {
    id: 'do-over',
    name: 'Do-Over',
    text: 'One extra mulligan redraw per duel.',
    unlock: { kind: 'runsWon', count: 1 },
  },
  {
    id: 'second-wind',
    name: 'Second Wind',
    text: 'Once per run, a duel loss costs no strike.',
    unlock: { kind: 'runsWon', count: 2 },
  },
  {
    id: 'ban-runner',
    name: 'Ban Runner',
    text: '+1 ban-list slot.',
    unlock: { kind: 'discoveries', count: 12 },
  },
];
