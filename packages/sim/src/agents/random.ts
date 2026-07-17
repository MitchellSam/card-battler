// random: uniform over legalActions. Crash-finder, stall-finder, floor baseline.
// (The playout test proved legality; random at scale proves totality.)

import type { Agent } from '../agent.js';

export const randomAgent: Agent = {
  name: 'random',
  choose: (_view, legal, rng) => legal[rng.int(legal.length)]!,
};
