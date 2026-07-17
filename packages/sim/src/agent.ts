// The M2 agent contract. Agents see ONLY PlayerView (never GameState) — the
// redaction contract keeps them honest and PvP-representative. Agents must be
// pure/deterministic given (view, legal, rng): the harness seeds each game's
// agent RNG separately from the engine RNG so replays reproduce agent behavior.

import type { Action, PlayerView, SeededRNG } from '@house-rules/engine';

export interface Agent {
  name: string;
  choose(view: PlayerView, legal: Action[], rng: SeededRNG): Action;
}
