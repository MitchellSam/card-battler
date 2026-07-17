// Headless store tests (M3 exit criterion 3): a GameSession driven by two
// agents — the AI seat internal, the human seat scripted through dispatch() —
// runs to gameOver, and a finished session's exportReplay() re-run through the
// engine reproduces the same GameResult. No browser, no React.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createRng,
  setupGame,
  type Action,
  type GameState,
} from '@house-rules/engine';
import { agentSeed, getAgent } from '@house-rules/sim/browser';
import { playGame } from '@house-rules/sim';
import { AI, GameSession, HUMAN, type Replay } from '../src/session/GameSession.js';
import { candidatesFor, nextStep } from '../src/interact/cascade.js';
import { describeEvent } from '../src/session/describeEvent.js';

const SYNC = { aiDelayMs: 0, autoPassDelayMs: 0 };

/** Drive the human seat with an agent until the game ends. */
function playSession(session: GameSession, humanAgent = 'greedy'): void {
  const agent = getAgent(humanAgent);
  const rng = createRng(agentSeed(session.seed, HUMAN));
  for (let steps = 0; !session.isOver(); steps++) {
    if (steps > 100_000) throw new Error('session step cap exceeded');
    expect(session.actor()).toBe(HUMAN); // pump() only rests at human decision points
    const legal = session.legal();
    expect(legal.length).toBeGreaterThan(0);
    session.dispatch(agent.choose(session.humanView(), legal, rng));
  }
}

function rerunReplay(replay: Replay): GameState {
  const rng = createRng(replay.engineSeed);
  let state = setupGame(rng, { config: replay.config }).state;
  for (const action of replay.actionLog) state = applyAction(state, action, rng).state;
  return state;
}

describe('GameSession', () => {
  it('greedy-vs-greedy through the store reproduces the sim runner exactly', () => {
    // autoPass off: the scripted human passes explicitly, so the human agent
    // RNG is consumed on exactly the same decisions as in playGame.
    const session = new GameSession(20260716, { ...SYNC, autoPass: false });
    playSession(session);
    const reference = playGame({
      agents: [getAgent('greedy'), getAgent('greedy')],
      seed: 20260716,
    });
    expect(reference.error).toBeNull();
    expect(JSON.stringify(session.actionLog)).toBe(JSON.stringify(reference.actionLog));
    expect(session.humanView().result).toEqual(reference.state.result);
  });

  it('runs to gameOver with auto-pass on, and the replay export reproduces the result', () => {
    for (const seed of [1, 42, 987654]) {
      const session = new GameSession(seed, SYNC);
      playSession(session);
      const result = session.humanView().result;
      expect(result).not.toBeNull();

      const replay = JSON.parse(session.exportReplay()) as Replay;
      expect(replay.engineSeed).toBe(seed);
      expect(replay.agentSeed).toBe(agentSeed(seed, AI));
      expect(replay.stats.turns).toBeGreaterThan(1);
      expect(replay.stats.humanDecisions).toBeGreaterThan(0);

      const rerun = rerunReplay(replay);
      expect(rerun.phase).toBe('gameOver');
      expect(rerun.result).toEqual(result); // determinism survives the UI layer
    }
  });

  it('dispatch rejects actions when it is not the human decision point', () => {
    const session = new GameSession(7, { ...SYNC, autoPass: false });
    // Whatever the state, dispatching for the wrong seat must throw before
    // reaching the engine.
    if (session.actor() === HUMAN) {
      expect(() =>
        session.dispatch({ type: 'pass', player: AI } as Action),
      ).toThrow(); // engine rejects an action for the non-actor seat
    }
  });

  it('cascade steps only ever offer values present in legalActions', () => {
    const session = new GameSession(99, { ...SYNC, autoPass: false });
    // At the first human decision point (mulligan), no cascade applies; play a
    // few decisions in and then walk one cascade from every legal hand origin.
    playFew(session, 40);
    if (session.isOver()) return;
    const legal = session.legal();
    for (const a of legal) {
      if (a.type !== 'summon' && a.type !== 'castSpell' && a.type !== 'setSpell') continue;
      const origin =
        a.type === 'castSpell'
          ? a.source.from === 'hand'
            ? ({ kind: 'hand', handIndex: a.source.handIndex } as const)
            : ({ kind: 'stZone', zoneIndex: a.source.zoneIndex } as const)
          : ({ kind: 'hand', handIndex: a.handIndex } as const);
      const step = nextStep(legal, { origin });
      expect(step.kind).not.toBe('dead');
      expect(candidatesFor(legal, { origin })).toContainEqual(a);
    }
  });

  it('a human dispatch during a pending auto-pass cancels the stale timer', async () => {
    // Regression: dispatching while autoPassing left the old timer alive; it
    // fired later and applied its captured pass after priority had moved on.
    const session = new GameSession(5, { aiDelayMs: 0, autoPassDelayMs: 5, autoPass: true });
    const agent = getAgent('greedy');
    const rng = createRng(agentSeed(5, HUMAN));
    for (let i = 0; i < 100_000 && !session.isOver(); i++) {
      if (session.actor() === HUMAN && session.legal().length > 0) {
        // Dispatch immediately — including at pass-only points where the
        // auto-pass timer is still pending. That is the race.
        session.dispatch(agent.choose(session.humanView(), session.legal(), rng));
      } else {
        await new Promise((r) => setTimeout(r, 2)); // let session timers fire
      }
    }
    expect(session.isOver()).toBe(true);
    session.dispose();
  });

  it('describeEvent covers every event the session produced', () => {
    const session = new GameSession(2024, SYNC);
    playSession(session);
    for (const e of session.events) {
      const line = describeEvent(e);
      expect(line.length).toBeGreaterThan(0);
      expect(line).not.toMatch(/undefined|\[object/);
    }
  });
});

function playFew(session: GameSession, n: number): void {
  const agent = getAgent('greedy');
  const rng = createRng(agentSeed(session.seed, HUMAN));
  for (let i = 0; i < n && !session.isOver(); i++) {
    session.dispatch(agent.choose(session.humanView(), session.legal(), rng));
  }
}
