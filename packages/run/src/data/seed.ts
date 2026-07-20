// Starter seed set (recommendations §5): the 9 effects a new save's discovery
// pool begins with. Mostly commons spanning distinct axes, two clean
// uncommons, zero rares. Every id must exist in the engine's effect registry.

import type { EffectId } from '@house-rules/engine';

export const STARTER_DISCOVERIES: EffectId[] = [
  // commons (7)
  'peek', // deck manipulation
  'skim', // mill / deck-out clock
  'rally', // go-wide board
  'doorstop', // defense / walls
  'needle', // disruption + information
  'scavenge', // graveyard recursion
  'warning-shot', // anti-bluff information
  // uncommons (2)
  'leverage', // flat +3 buff — easiest to read
  'executioners-toll', // conditional removal
];
