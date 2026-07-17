// @house-rules/sim — M2 simulation harness: heuristic agents, deterministic
// game runner, JSONL stats, and the report generator. CLI in cli.ts.

export type { Agent } from './agent.js';
export { AGENTS, AGENT_NAMES, getAgent } from './agents/index.js';
export { actorFor, agentSeed, playGame, type GameOutcome, type GameSpec } from './runner.js';
export { buildRecord, type GameRecord, type PlayerGameStats, type Replay } from './stats.js';
export { runMatchup, type RunOptions, type RunSummary } from './run.js';
export { aggregate, generateReport } from './report.js';
export { bench, type BenchResult } from './bench.js';
