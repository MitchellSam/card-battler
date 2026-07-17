// Game runner: drives two agents through one full game against the engine.
// Deterministic: (seed, config, agent names) reproduces the exact game — the
// engine RNG and each seat's agent RNG are all derived from the game seed.

import {
  applyAction,
  createRng,
  legalActions,
  setupGame,
  viewFor,
  type Action,
  type GameEvent,
  type GameState,
  type PlayerId,
  type RulesConfig,
} from '@house-rules/engine';
import type { Agent } from './agent.js';

export interface GameSpec {
  agents: [Agent, Agent];
  seed: number;
  config?: Partial<RulesConfig>;
  /** Harness safety valve independent of config.maxTurns. */
  maxSteps?: number;
}

export interface GameOutcome {
  state: GameState; // final state (phase 'gameOver' unless error)
  events: GameEvent[];
  actionLog: Action[];
  steps: number;
  /** Engine throw or harness violation — a P0 bug, reproducible from the seed. */
  error: string | null;
}

const other = (p: PlayerId): PlayerId => (1 - p) as PlayerId;

/** Which player must act right now (mirrors the engine's priority rules). */
export function actorFor(s: GameState): PlayerId {
  if (s.pending) return s.pending.player;
  if (s.phase === 'mulligan')
    return !s.players[s.firstPlayer].mulliganed ? s.firstPlayer : other(s.firstPlayer);
  if (s.stack.length > 0 || s.pendingWindow) return s.priority;
  return s.activePlayer;
}

/** Per-seat agent RNG seed, decorrelated from the engine RNG and the other seat. */
export function agentSeed(gameSeed: number, player: PlayerId): number {
  return (Math.imul(gameSeed ^ 0x9e3779b9, 2654435761) + player * 0x85ebca6b) >>> 0;
}

export function playGame(spec: GameSpec): GameOutcome {
  const engineRng = createRng(spec.seed);
  const agentRngs = [createRng(agentSeed(spec.seed, 0)), createRng(agentSeed(spec.seed, 1))];
  const maxSteps = spec.maxSteps ?? 100_000;
  const actionLog: Action[] = [];
  const events: GameEvent[] = [];
  const setup = setupGame(engineRng, spec.config ? { config: spec.config } : {});
  let state = setup.state;
  events.push(...setup.events);
  let steps = 0;
  try {
    while (state.phase !== 'gameOver') {
      if (++steps > maxSteps) {
        return { state, events, actionLog, steps, error: `harness step cap (${maxSteps}) exceeded` };
      }
      const p = actorFor(state);
      const legal = legalActions(state, p);
      if (legal.length === 0) {
        return { state, events, actionLog, steps, error: `deadlock: no legal action for player ${p}` };
      }
      const action = spec.agents[p]!.choose(viewFor(state, p), legal, agentRngs[p]!);
      const r = applyAction(state, action, engineRng);
      state = r.state;
      events.push(...r.events);
      actionLog.push(action);
    }
  } catch (err) {
    const detail = err instanceof Error ? (err.stack ?? err.message) : String(err);
    return { state, events, actionLog, steps, error: detail };
  }
  return { state, events, actionLog, steps, error: null };
}
