// Run-baseline config + map/economy numbers (A3 + Part B data).
// EVERY number here is designer-editable; changing one must never require a
// code edit (M4 review criterion #5).

import { DEFAULT_CONFIG, type RulesConfig } from '@house-rules/engine';

/** Run mode plays on the Constructed rules + ante 5 (ratified 2026-07-19). */
export const RUN_CONFIG: RulesConfig = { ...DEFAULT_CONFIG, ante: 5 };

export const MAP_CONFIG = {
  /**
   * Act length: nodes a run visits INCLUDING the boss — provisional 12, the
   * single number the next timed duels will set (nothing else may depend on
   * it). Columns pre-boss = actLength - 1.
   */
  actLength: 12,
  minWidth: 2,
  maxWidth: 4,
  /** Node pool weights per non-boss column (recommendations §6). */
  weights: {
    duel: 0.45,
    event: 0.25,
    shop: 0.12,
    elite: 0.1,
    treasure: 0.08,
  },
  /** How many sticker options a Treasure node offers. */
  treasureOptions: 3,
} as const;

export const ECONOMY = {
  /** Account starting values. */
  startingAllowance: 50,
  startingBanSlots: 1,
  /** Duel rewards live on the encounter defs; these are run-layer knobs. */
  trimCost: 15, // the shop "Trim a Card" single
  removalFloor: RUN_CONFIG.removalFloor, // 40 — enforced on every removal path
  /** Pack Rat favor: packs cost this fraction less. */
  packRatDiscount: 0.15,
  /** Lucky Coin favor: currency granted on each shop visit. */
  luckyCoinBonus: 5,
  /** Boss reward: the flat-currency option of the pick-1-of-3. */
  bossCurrencyOption: 40,
  favorSlots: 2,
} as const;
