// RunSession (web run store) driven headlessly with the in-memory storage:
// start → node → duel via a REAL GameSession built from the DuelSpec →
// outcome → persistence resume. This is the browser wiring minus the DOM.

import { describe, expect, it } from 'vitest';
import { InMemoryStorage, type DuelSpec } from '@house-rules/run';
import { GameSession, HUMAN } from '../src/session/GameSession.js';
import { RunSession } from '../src/run/RunSession.js';

async function settled(rs: RunSession): Promise<void> {
  for (let i = 0; i < 100 && !rs.loaded; i++) await new Promise((r) => setTimeout(r, 5));
  if (!rs.loaded) throw new Error('RunSession never loaded');
}

/** Drive a GameSession (synchronous mode) with random-but-legal human play. */
function playSession(spec: DuelSpec): { won: boolean; draw: boolean } {
  const session = new GameSession(spec.duelSeed, {
    agentName: spec.agentName,
    config: spec.config,
    humanDeck: spec.humanDeck,
    aiDelayMs: 0,
    autoPassDelayMs: 0,
    autoPassRespondMs: 0,
  });
  let guard = 0;
  while (!session.isOver()) {
    if (++guard > 30000) throw new Error('duel did not terminate');
    const legal = session.legal();
    if (legal.length === 0) throw new Error('no legal human action');
    session.dispatch(legal[guard % legal.length]!);
  }
  const result = session.humanView().result!;
  session.dispose();
  return { won: result.winner === HUMAN, draw: result.winner === 'draw' };
}

describe('RunSession', () => {
  it('boots a fresh account, starts a run, and persists every dispatch', async () => {
    const storage = new InMemoryStorage();
    const rs = new RunSession(storage);
    await settled(rs);
    expect(rs.account?.discoveryPool.length).toBe(9);
    expect(rs.run).toBeNull();

    rs.startRun(1234);
    expect(rs.run?.outcome).toBe('active');
    const picks = rs.legal().filter((a) => a.type === 'pickNode');
    expect(picks.length).toBeGreaterThan(0);
    rs.dispatch(picks[0]!);

    // whatever we hit, the persisted blob tracks the live state
    expect(await storage.loadRun()).toEqual(rs.run);
  });

  it('plays a run duel through a real GameSession built from the DuelSpec', async () => {
    const storage = new InMemoryStorage();
    const rs = new RunSession(storage);
    await settled(rs);
    rs.startRun(77);

    // walk until a duel spec appears (drive non-duel pendings with first-legal)
    let guard = 0;
    while (rs.run!.pendingChoice?.type !== 'duel') {
      if (++guard > 200) throw new Error('never reached a duel');
      const legal = rs.legal().filter((a) => a.type !== 'abandonRun');
      expect(legal.length).toBeGreaterThan(0);
      rs.dispatch(legal[0]!);
    }
    const spec = rs.run!.pendingChoice.spec;
    expect(spec.config.ante).toBe(5); // run baseline
    // the walk may have trimmed cards on the way — the spec deck IS the run deck
    expect(spec.humanDeck.length).toBe(rs.run!.deck.length);
    expect(spec.humanDeck.length).toBeGreaterThanOrEqual(40);

    const { won, draw } = playSession(spec);
    const strikesBefore = rs.run!.strikes;
    rs.dispatch({ type: 'duelOutcome', won, draw, stats: { turns: 1 } });
    if (!won && !draw) expect(rs.run!.strikes).toBe(strikesBefore - 1);
    expect(rs.run!.stats.duels).toHaveLength(1);
  });

  it('a new RunSession over the same storage resumes the saved run (exit criterion 7)', async () => {
    const storage = new InMemoryStorage();
    const rs = new RunSession(storage);
    await settled(rs);
    rs.startRun(555);
    const picks = rs.legal().filter((a) => a.type === 'pickNode');
    rs.dispatch(picks[0]!);
    const snapshot = JSON.stringify(rs.run);

    const rs2 = new RunSession(storage); // "reload"
    await settled(rs2);
    expect(JSON.stringify(rs2.run)).toBe(snapshot);
    expect(rs2.run?.position).toBe(rs.run?.position);
  });
});
