// Performance floor check: full random-agent games/sec, single thread.
// Target ≥100 games/sec (10k games < 2 min); see M2_IMPLEMENTATION_BRIEF.md.

import { randomAgent } from './agents/random.js';
import { playGame } from './runner.js';

export interface BenchResult {
  games: number;
  seconds: number;
  gamesPerSec: number;
  meanSteps: number;
  meanTurns: number;
}

export function bench(games: number, baseSeed = 1): BenchResult {
  // warmup
  for (let i = 0; i < 5; i++) playGame({ agents: [randomAgent, randomAgent], seed: 999_000 + i });
  let steps = 0;
  let turns = 0;
  const t0 = performance.now();
  for (let i = 0; i < games; i++) {
    const out = playGame({ agents: [randomAgent, randomAgent], seed: baseSeed + i });
    if (out.error) throw new Error(`bench game seed ${baseSeed + i} crashed: ${out.error}`);
    steps += out.steps;
    turns += out.state.turn;
  }
  const seconds = (performance.now() - t0) / 1000;
  return {
    games,
    seconds,
    gamesPerSec: games / seconds,
    meanSteps: steps / games,
    meanTurns: turns / games,
  };
}
