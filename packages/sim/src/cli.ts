// CLI: sim run | sim report | sim bench
//   sim run --p0 greedy --p1 turtle --games 10000 --seed 1 [--config cfg.json] --out results/E0
//   sim report results/E0 [--out results/E0/REPORT.md]
//   sim bench [--games 200]

import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { RulesConfig } from '@house-rules/engine';
import { AGENT_NAMES } from './agents/index.js';
import { bench } from './bench.js';
import { generateReport } from './report.js';
import { runMatchup } from './run.js';

function parseFlags(argv: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith('--')) {
      flags[arg.slice(2)] = argv[++i] ?? '';
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function usage(): never {
  console.error(
    [
      'usage:',
      '  sim run --p0 <agent> --p1 <agent> --games <n> --seed <n> [--config <file.json>] --out <dir>',
      '  sim report <dir> [--out <file.md>]',
      '  sim bench [--games <n>]',
      '',
      `agents: ${AGENT_NAMES.join(', ')}`,
      'config file: {"name": "...", "overrides": {<RulesConfig fields>}}',
    ].join('\n'),
  );
  process.exit(2);
}

const [command, ...rest] = process.argv.slice(2);
const { flags, positional } = parseFlags(rest);

switch (command) {
  case 'run': {
    const p0 = flags.p0;
    const p1 = flags.p1;
    const out = flags.out;
    if (!p0 || !p1 || !out) usage();
    let configName = 'baseline';
    let configOverrides: Partial<RulesConfig> = {};
    if (flags.config) {
      const parsed = JSON.parse(readFileSync(flags.config, 'utf8')) as {
        name?: string;
        overrides?: Partial<RulesConfig>;
      };
      configName = parsed.name ?? basename(flags.config).replace(/\.json$/, '');
      configOverrides = parsed.overrides ?? {};
    }
    const games = Number(flags.games ?? 1000);
    const seed = Number(flags.seed ?? 1);
    const label = `${configName} ${p0}-vs-${p1}`;
    const summary = runMatchup({
      p0,
      p1,
      games,
      seed,
      configName,
      configOverrides,
      outDir: out,
      onProgress: (done, total) => {
        if (done % 5000 === 0) console.error(`  ${label}: ${done}/${total}`);
      },
    });
    console.log(
      `${label}: ${summary.games} games in ${summary.seconds.toFixed(1)}s ` +
        `(${(summary.games / summary.seconds).toFixed(0)}/s), stalls ${summary.stalls} → ${summary.file}`,
    );
    break;
  }
  case 'report': {
    const dir = positional[0];
    if (!dir) usage();
    const md = generateReport(dir);
    if (flags.out) {
      writeFileSync(flags.out, md);
      console.log(`wrote ${flags.out}`);
    } else {
      console.log(md);
    }
    break;
  }
  case 'bench': {
    const result = bench(Number(flags.games ?? 200));
    console.log(
      `${result.games} random-vs-random games in ${result.seconds.toFixed(2)}s → ` +
        `${result.gamesPerSec.toFixed(0)} games/sec (target ≥100), ` +
        `mean ${result.meanSteps.toFixed(0)} steps / ${result.meanTurns.toFixed(0)} turns per game`,
    );
    if (result.gamesPerSec < 100) process.exit(1);
    break;
  }
  default:
    usage();
}
