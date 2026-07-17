// Acceptance: the action log + seed reproduces any game exactly.
// A full random game is recorded, then replayed from scratch with a fresh RNG
// built from the same seed — every intermediate and final state must be
// byte-identical when serialized.

import { describe, expect, it } from 'vitest';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { createRng } from '../src/rng.js';
import { serialize } from '../src/serialize.js';
import { setupGame } from '../src/setup.js';
import type { Action } from '../src/types.js';

describe('determinism', () => {
  it('same seed + same action log → byte-identical states, from scratch', () => {
    for (const seed of [3, 17, 424242]) {
      // --- play a full random game, recording the action log ---
      const rngA = createRng(seed);
      const pick = createRng(seed ^ 0x9e3779b9); // agent's choices are part of the log, not the game seed
      let a = setupGame(rngA).state;
      const log: Action[] = [];
      const checkpoints: string[] = [];
      let steps = 0;
      while (a.phase !== 'gameOver') {
        if (++steps > 30000) throw new Error('did not terminate');
        const acts = [...legalActions(a, 0), ...legalActions(a, 1)];
        const action = acts[pick.int(acts.length)]!;
        log.push(action);
        a = applyAction(a, action, rngA).state;
        if (steps % 100 === 0) checkpoints.push(serialize(a));
      }

      // --- replay the log with a fresh RNG from the same seed ---
      const rngB = createRng(seed);
      let b = setupGame(rngB).state;
      let i = 0;
      const replayCheckpoints: string[] = [];
      for (const action of log) {
        b = applyAction(b, action, rngB).state;
        if (++i % 100 === 0) replayCheckpoints.push(serialize(b));
      }

      expect(serialize(b)).toBe(serialize(a)); // final state byte-identical
      expect(replayCheckpoints).toEqual(checkpoints); // and every checkpoint along the way
      expect(b.result).toEqual(a.result);
    }
  }, 60000);
});
