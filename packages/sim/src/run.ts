// sim run: play N games of one matchup under one config, streaming one JSONL
// record per game. Outlier games (longest, shortest, stalled, crashed) are
// re-run from their seed at the end to persist full action-log replays —
// determinism makes every anomaly reproducible.

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RulesConfig } from '@house-rules/engine';
import { getAgent } from './agents/index.js';
import { playGame, type GameOutcome } from './runner.js';
import { buildRecord, type Replay } from './stats.js';

export interface RunOptions {
  p0: string;
  p1: string;
  games: number;
  seed: number;
  configName: string;
  configOverrides: Partial<RulesConfig>;
  outDir: string;
  /** cap on stalled-game replays persisted (they can be numerous). */
  maxStallReplays?: number;
  onProgress?: (done: number, total: number) => void;
}

export interface RunSummary {
  file: string;
  games: number;
  crashed: boolean;
  crashSeed: number | null;
  stalls: number;
  seconds: number;
}

export function runMatchup(opts: RunOptions): RunSummary {
  const agents: [ReturnType<typeof getAgent>, ReturnType<typeof getAgent>] = [
    getAgent(opts.p0),
    getAgent(opts.p1),
  ];
  mkdirSync(opts.outDir, { recursive: true });
  const file = join(opts.outDir, `${opts.configName}__${opts.p0}-vs-${opts.p1}.jsonl`);
  writeFileSync(file, '');

  let longest = { seed: -1, turns: -1 };
  let shortest = { seed: -1, turns: Infinity };
  const stallSeeds: number[] = [];
  let crashSeed: number | null = null;
  let crashError: string | null = null;
  let stalls = 0;
  const lines: string[] = [];
  const t0 = performance.now();

  let played = 0;
  for (let i = 0; i < opts.games; i++) {
    const seed = opts.seed + i;
    const out = playGame({ agents, seed, config: opts.configOverrides });
    played = i + 1;
    if (out.error) {
      // Crash policy: an engine throw during a sim is a P0 bug; capture the
      // replay and halt this matchup.
      crashSeed = seed;
      crashError = out.error;
      writeReplay(opts, 'crash', seed, out);
      break;
    }
    const record = buildRecord(out, {
      seed,
      config: opts.configName,
      p0: opts.p0,
      p1: opts.p1,
    });
    lines.push(JSON.stringify(record));
    if (lines.length >= 500) {
      appendFileSync(file, lines.join('\n') + '\n');
      lines.length = 0;
    }
    if (record.stalled) {
      stalls++;
      if (stallSeeds.length < (opts.maxStallReplays ?? 3)) stallSeeds.push(seed);
    }
    if (record.turns > longest.turns) longest = { seed, turns: record.turns };
    if (record.turns < shortest.turns) shortest = { seed, turns: record.turns };
    if (opts.onProgress && played % 1000 === 0) opts.onProgress(played, opts.games);
  }
  if (lines.length > 0) appendFileSync(file, lines.join('\n') + '\n');

  // Re-run outlier seeds to capture full replays.
  for (const [kind, seed] of [
    ['longest', longest.seed],
    ['shortest', shortest.seed],
    ...stallSeeds.map((s): [string, number] => ['stalled', s]),
  ] as [string, number][]) {
    if (seed < 0) continue;
    const out = playGame({ agents, seed, config: opts.configOverrides });
    writeReplay(opts, kind, seed, out);
  }

  const seconds = (performance.now() - t0) / 1000;
  if (crashSeed !== null) {
    throw new Error(
      `P0 ENGINE CRASH in ${opts.p0}-vs-${opts.p1} (${opts.configName}) at seed ${crashSeed} ` +
        `(replay saved). Matchup halted after ${played} games.\n${crashError}`,
    );
  }
  return { file, games: played, crashed: false, crashSeed: null, stalls, seconds };
}

function writeReplay(opts: RunOptions, kind: string, seed: number, out: GameOutcome): void {
  const dir = join(opts.outDir, 'replays');
  mkdirSync(dir, { recursive: true });
  const replay: Replay = {
    kind,
    seed,
    config: opts.configName,
    configOverrides: opts.configOverrides,
    p0: opts.p0,
    p1: opts.p1,
    turns: out.state.turn,
    steps: out.steps,
    error: out.error,
    actionLog: out.actionLog,
  };
  const name = `${opts.configName}__${opts.p0}-vs-${opts.p1}__${kind}-seed${seed}.json`;
  writeFileSync(join(dir, name), JSON.stringify(replay, null, 2));
}
