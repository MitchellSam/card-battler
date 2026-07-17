// Browser-safe subset of @house-rules/sim. The root index pulls node:fs via
// run.ts/report.ts; the web package imports ONLY this subpath (plus the
// engine), so a Vite build never touches node built-ins.

export type { Agent } from './agent.js';
export {
  AGENTS,
  AGENT_NAMES,
  getAgent,
  aggroAgent,
  bankerAgent,
  greedyAgent,
  randomAgent,
  turtleAgent,
} from './agents/index.js';
export { actorFor, agentSeed } from './runner.js';
