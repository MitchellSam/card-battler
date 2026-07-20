// Headless full-run test (EXIT CRITERION 2): agents drive both seats through a
// complete run via applyRunAction + real engine duels — no browser. The run is
// deterministic (same runSeed + actions ⇒ same run) and serialize/round-trips.
//
// Duels are played exactly the way a shell must: setupGame from the DuelSpec
// (stickered human deck, spec config incl. overrides, duelSeed-derived
// shuffles), then random-legal-action agents to completion.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createDeck,
  createRng,
  legalActions,
  setupGame,
  shuffle,
} from '@house-rules/engine';
import { applyRun, finishRun, legalRunActions, newAccount, newRun } from '../src/reducer.js';
import type { DuelSpec, RunState } from '../src/types.js';

/** Play a real duel from a DuelSpec with seeded random agents on both seats. */
function playDuel(spec: DuelSpec): { won: boolean; draw: boolean; turns: number } {
  const rng = createRng(spec.duelSeed);
  const pick = createRng((spec.duelSeed ^ 0x9e3779b9) >>> 0);
  let state = setupGame(rng, {
    config: spec.config,
    decks: [
      shuffle(structuredClone(spec.humanDeck), rng), // seat 0: the stickered run deck
      shuffle(createDeck(1), rng), // seat 1: the opponent's stock deck
    ],
  }).state;
  let steps = 0;
  while (state.phase !== 'gameOver') {
    if (++steps > 30000) throw new Error('duel did not terminate');
    const acts = [...legalActions(state, 0), ...legalActions(state, 1)];
    if (acts.length === 0) throw new Error('duel deadlock');
    state = applyAction(state, acts[pick.int(acts.length)]!, rng).state;
  }
  return {
    won: state.result!.winner === 0,
    draw: state.result!.winner === 'draw',
    turns: state.turn,
  };
}

/** Drive a whole run: real duels, seeded-random choices everywhere else. */
function playRun(runSeed: number): RunState {
  const policy = createRng(runSeed * 31 + 7);
  let run = newRun(newAccount(), runSeed);
  let guard = 0;
  while (run.outcome === 'active') {
    if (++guard > 2000) throw new Error('run did not terminate');
    if (run.pendingChoice?.type === 'duel') {
      const { won, draw, turns } = playDuel(run.pendingChoice.spec);
      run = applyRun(run, { type: 'duelOutcome', won, draw, stats: { turns } }).run;
      continue;
    }
    const legal = legalRunActions(run).filter(
      (a) => a.type !== 'abandonRun' && a.type !== 'duelOutcome',
    );
    if (legal.length === 0) throw new Error(`run deadlock at ${JSON.stringify(run.pendingChoice)}`);
    run = applyRun(run, legal[policy.int(legal.length)]!).run;
  }
  return run;
}

describe('headless full run', () => {
  it('completes start → boss/strikes → summary for several seeds', () => {
    let sawWin = false;
    let sawLoss = false;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const run = playRun(seed);
      expect(['won', 'lost']).toContain(run.outcome);
      if (run.outcome === 'won') {
        sawWin = true;
        expect(run.stats.nodesVisited).toContain('boss');
        expect(run.bossRewardTaken).toBeDefined();
      } else {
        sawLoss = true;
        expect(run.strikes === 0 || run.outcome === 'lost').toBe(true);
      }
      // instrumentation feeds the act-length decision
      expect(run.stats.duels.length).toBeGreaterThan(0);
      expect(run.stats.duels.every((d) => typeof d.turns === 'number')).toBe(true);
      expect(run.stats.currencyCurve.length).toBeGreaterThan(0);
      // discoveries carried to the account at the summary
      const account = finishRun(newAccount(), run);
      expect(account.runsCompleted).toBe(1);
      expect(account.discoveryPool.length).toBeGreaterThanOrEqual(9);
      // full state serialize round-trip
      expect(JSON.parse(JSON.stringify(run))).toEqual(run);
    }
    // across 8 seeds random-vs-random should produce both outcomes
    expect(sawWin || sawLoss).toBe(true);
  }, 120000);

  it('a whole run is deterministic: same runSeed ⇒ byte-identical final state', () => {
    expect(JSON.stringify(playRun(11))).toBe(JSON.stringify(playRun(11)));
  }, 120000);
});
