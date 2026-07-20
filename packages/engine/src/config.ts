// M4 A2: per-player config accessor. ALL engine reads of the five per-player
// fields (drawPerTurn / ante / handLimit / startingHand / monsterZones) go
// through here so the overlay cannot be bypassed by accident.

import type { GameState, PerPlayerFields, PlayerId, RulesConfig } from './types.js';

/** Config-only form, for setup paths that run before a GameState exists. */
export function cfgFor(
  config: RulesConfig,
  player: PlayerId,
  field: keyof PerPlayerFields,
): number {
  return config.overrides?.[player]?.[field] ?? config[field];
}

/** The per-player value of a five-field config knob for this game. */
export function cfg(s: GameState, player: PlayerId, field: keyof PerPlayerFields): number {
  return cfgFor(s.config, player, field);
}
