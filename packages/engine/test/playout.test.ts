// Random-playout smoke test: seeded random agents play full 54-card games.
// Asserts: no deadlocks (someone always has a legal action), every enumerated
// legal action applies without throwing, applyAction never mutates its input,
// and every game terminates in a showdown.

import { describe, expect, it } from 'vitest';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { createRng } from '../src/rng.js';
import { serialize } from '../src/serialize.js';
import { setupGame } from '../src/setup.js';
import { viewFor } from '../src/view.js';

describe('random playouts', () => {
  it('completes seeded random games without errors', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const rng = createRng(seed);
      const pick = createRng(seed * 7919);
      let state = setupGame(rng).state;
      let steps = 0;
      while (state.phase !== 'gameOver') {
        if (++steps > 30000) throw new Error(`seed ${seed}: game did not terminate`);
        const acts = [...legalActions(state, 0), ...legalActions(state, 1)];
        expect(acts.length, `seed ${seed} deadlock at step ${steps}`).toBeGreaterThan(0);
        const action = acts[pick.int(acts.length)]!;
        const before = steps <= 25 ? serialize(state) : null;
        const r = applyAction(state, action, rng);
        if (before !== null) {
          expect(serialize(state), 'applyAction mutated its input').toBe(before);
        }
        state = r.state;
      }
      expect(state.result).not.toBeNull();
      expect(state.deckOut).toBe(true);
      // redacted views still render at game end
      expect(viewFor(state, 0).result).toEqual(state.result);
    }
  }, 60000);
});
