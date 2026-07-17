import type { Agent } from '../agent.js';
import { aggroAgent } from './aggro.js';
import { bankerAgent } from './banker.js';
import { greedyAgent } from './greedy.js';
import { randomAgent } from './random.js';
import { turtleAgent } from './turtle.js';

export const AGENTS: Record<string, Agent> = {
  random: randomAgent,
  aggro: aggroAgent,
  turtle: turtleAgent,
  banker: bankerAgent,
  greedy: greedyAgent,
};

export const AGENT_NAMES = Object.keys(AGENTS);

export function getAgent(name: string): Agent {
  const agent = AGENTS[name];
  if (!agent) throw new Error(`unknown agent "${name}" (available: ${AGENT_NAMES.join(', ')})`);
  return agent;
}

export { aggroAgent, bankerAgent, greedyAgent, randomAgent, turtleAgent };
