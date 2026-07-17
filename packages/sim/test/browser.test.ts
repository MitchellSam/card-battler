// The /browser subpath must expose working agents without touching node:fs
// (run.ts/report.ts stay out of its import graph — that is what keeps the
// Vite build of packages/web alive).

import { describe, expect, it } from 'vitest';
import { createRng, legalActions, setupGame, viewFor } from '@house-rules/engine';
import { actorFor, agentSeed, greedyAgent } from '../src/browser.js';

describe('browser subpath', () => {
  it('greedyAgent.choose picks a legal action through the browser barrel', () => {
    const rng = createRng(4242);
    const { state } = setupGame(rng);
    const p = actorFor(state);
    const legal = legalActions(state, p);
    const action = greedyAgent.choose(viewFor(state, p), legal, createRng(agentSeed(4242, p)));
    expect(legal).toContainEqual(action);
  });
});
