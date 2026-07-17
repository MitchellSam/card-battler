// Harness invariants: every pairing terminates cleanly, and (seed, agents,
// config) is fully deterministic — the record and action log reproduce exactly.

import { describe, expect, it } from 'vitest';
import { AGENTS, AGENT_NAMES } from '../src/agents/index.js';
import { playGame } from '../src/runner.js';
import { buildRecord } from '../src/stats.js';

describe('sim harness', () => {
  it('all 25 pairings complete without crashes', () => {
    for (const a of AGENT_NAMES) {
      for (const b of AGENT_NAMES) {
        for (let i = 0; i < 3; i++) {
          const out = playGame({ agents: [AGENTS[a]!, AGENTS[b]!], seed: 7000 + i });
          expect(out.error, `${a} vs ${b} seed ${7000 + i}`).toBeNull();
          expect(out.state.phase).toBe('gameOver');
          expect(out.state.result).not.toBeNull();
        }
      }
    }
  }, 60000);

  it('replays are deterministic: same spec → identical record and action log', () => {
    for (const name of AGENT_NAMES) {
      const spec = { agents: [AGENTS[name]!, AGENTS.greedy!] as [never, never], seed: 12345 };
      const a = playGame(spec);
      const b = playGame(spec);
      expect(JSON.stringify(a.actionLog)).toBe(JSON.stringify(b.actionLog));
      const meta = { seed: 12345, config: 'baseline', p0: name, p1: 'greedy' };
      expect(buildRecord(a, meta)).toEqual(buildRecord(b, meta));
    }
  }, 30000);

  it('records carry sane values', () => {
    const out = playGame({ agents: [AGENTS.greedy!, AGENTS.aggro!], seed: 99 });
    const r = buildRecord(out, { seed: 99, config: 'baseline', p0: 'greedy', p1: 'aggro' });
    expect(r.turns).toBeGreaterThan(1);
    expect(['deckOut', 'maxTurns']).toContain(r.endedBy);
    expect(r.perPlayer).toHaveLength(2);
    expect(r.perPlayer[0].cardsRemaining).toBeGreaterThanOrEqual(0);
    expect([0, 1, 'draw']).toContain(r.winner);
  });

  it('maxTurns config stalls runaway games and marks the record', () => {
    const out = playGame({
      agents: [AGENTS.turtle!, AGENTS.turtle!],
      seed: 5,
      config: { maxTurns: 20 },
    });
    expect(out.error).toBeNull();
    const r = buildRecord(out, { seed: 5, config: 'cap20', p0: 'turtle', p1: 'turtle' });
    expect(r.stalled).toBe(true);
    expect(r.endedBy).toBe('maxTurns');
    expect(r.turns).toBe(20);
  });
});
