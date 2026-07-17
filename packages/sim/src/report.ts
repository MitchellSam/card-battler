// sim report: aggregate JSONL results into a markdown summary per
// matchup×config — the numbers M2-FINDINGS.md cites.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GameRecord, PlayerGameStats } from './stats.js';

interface Tally {
  sum: number;
  n: number;
}

interface MatchupAgg {
  config: string;
  p0: string;
  p1: string;
  games: number;
  stalls: number;
  draws: number;
  winsP0: number;
  winsFirst: number;
  turns: number[];
  bankSizes: [number[], number[]];
  winnerBankSizes: number[];
  loserBankSizes: number[];
  attacksDeclared: number;
  attacksIntoDefense: number;
  setsByRank: Record<string, number>;
  summonsByRank: Record<string, number>;
  flipDelayByRank: Record<string, Tally>;
  wallPunishes: number;
  wallPunishCardsLost: number;
  bankTriggersEarned: number;
  bankTriggersSkipped: number;
  bankChoices: { bank: number; remove: number; decline: number };
  handCategories: Record<string, number>;
  winnerHandCategories: Record<string, number>;
  /** win-rate buckets by jokers cast: 0, 1, 2+. */
  jokerBuckets: { games: number; wins: number }[];
  spellsCast: Record<string, number>;
  kRank: { casts: number; aceAs11: number; debuffKills: number; powerKilledSum: number };
  polys: { cast: number; bust: number; stand: number; totalSum: number; totalN: number };
  sacSummons: { one: number; two: number };
  milled: number;
}

function emptyAgg(config: string, p0: string, p1: string): MatchupAgg {
  return {
    config,
    p0,
    p1,
    games: 0,
    stalls: 0,
    draws: 0,
    winsP0: 0,
    winsFirst: 0,
    turns: [],
    bankSizes: [[], []],
    winnerBankSizes: [],
    loserBankSizes: [],
    attacksDeclared: 0,
    attacksIntoDefense: 0,
    setsByRank: {},
    summonsByRank: {},
    flipDelayByRank: {},
    wallPunishes: 0,
    wallPunishCardsLost: 0,
    bankTriggersEarned: 0,
    bankTriggersSkipped: 0,
    bankChoices: { bank: 0, remove: 0, decline: 0 },
    handCategories: {},
    winnerHandCategories: {},
    jokerBuckets: [
      { games: 0, wins: 0 },
      { games: 0, wins: 0 },
      { games: 0, wins: 0 },
    ],
    spellsCast: {},
    kRank: { casts: 0, aceAs11: 0, debuffKills: 0, powerKilledSum: 0 },
    polys: { cast: 0, bust: 0, stand: 0, totalSum: 0, totalN: 0 },
    sacSummons: { one: 0, two: 0 },
    milled: 0,
  };
}

function addCounts(into: Record<string, number>, from: Record<string, number>): void {
  for (const [k, v] of Object.entries(from)) into[k] = (into[k] ?? 0) + v;
}

function accumulatePlayer(agg: MatchupAgg, seat: 0 | 1, s: PlayerGameStats, won: boolean): void {
  agg.bankSizes[seat].push(s.bankSize);
  (won ? agg.winnerBankSizes : agg.loserBankSizes).push(s.bankSize);
  agg.attacksDeclared += s.attacksDeclared;
  agg.attacksIntoDefense += s.attacksIntoDefense;
  addCounts(agg.setsByRank, s.setsByRank);
  addCounts(agg.summonsByRank, s.summonsByRank);
  for (const [rank, d] of Object.entries(s.flipDelayByRank)) {
    const t = (agg.flipDelayByRank[rank] ??= { sum: 0, n: 0 });
    t.sum += d.sum;
    t.n += d.n;
  }
  agg.wallPunishes += s.wallPunishesSuffered;
  agg.wallPunishCardsLost += s.wallPunishCardsLost;
  agg.bankTriggersEarned += s.bankTriggersEarned;
  agg.bankTriggersSkipped += s.bankTriggersSkipped;
  agg.bankChoices.bank += s.bankChoices.bank;
  agg.bankChoices.remove += s.bankChoices.remove;
  agg.bankChoices.decline += s.bankChoices.decline;
  agg.handCategories[s.bestHandName] = (agg.handCategories[s.bestHandName] ?? 0) + 1;
  if (won)
    agg.winnerHandCategories[s.bestHandName] = (agg.winnerHandCategories[s.bestHandName] ?? 0) + 1;
  const bucket = Math.min(s.jokersCast, 2);
  agg.jokerBuckets[bucket]!.games++;
  if (won) agg.jokerBuckets[bucket]!.wins++;
  addCounts(agg.spellsCast, s.spellsCast);
  if (s.kRank) {
    agg.kRank.casts += s.kRank.casts;
    agg.kRank.aceAs11 += s.kRank.aceAs11;
    agg.kRank.debuffKills += s.kRank.debuffKills;
    agg.kRank.powerKilledSum += s.kRank.powerKilledSum;
  }
  agg.polys.cast += s.polys.cast;
  agg.polys.bust += s.polys.bust;
  agg.polys.stand += s.polys.stand;
  if (s.polys.avgResult !== null) {
    agg.polys.totalSum += s.polys.avgResult * s.polys.stand;
    agg.polys.totalN += s.polys.stand;
  }
  agg.sacSummons.one += s.sacSummons.one;
  agg.sacSummons.two += s.sacSummons.two;
  agg.milled += s.milledAgainst;
}

export function aggregate(dir: string): Map<string, MatchupAgg> {
  const groups = new Map<string, MatchupAgg>();
  const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
  for (const f of files) {
    const content = readFileSync(join(dir, f), 'utf8');
    for (const line of content.split('\n')) {
      if (!line) continue;
      const r = JSON.parse(line) as GameRecord;
      const key = `${r.config}|${r.p0}|${r.p1}`;
      let agg = groups.get(key);
      if (!agg) groups.set(key, (agg = emptyAgg(r.config, r.p0, r.p1)));
      agg.games++;
      if (r.stalled) agg.stalls++;
      if (r.winner === 'draw') agg.draws++;
      else {
        if (r.winner === 0) agg.winsP0++;
        if (r.winner === r.firstPlayer) agg.winsFirst++;
      }
      agg.turns.push(r.turns);
      accumulatePlayer(agg, 0, r.perPlayer[0], r.winner === 0);
      accumulatePlayer(agg, 1, r.perPlayer[1], r.winner === 1);
    }
  }
  return groups;
}

function pct(x: number, digits = 1): string {
  return `${(100 * x).toFixed(digits)}%`;
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
}

function mean(xs: number[]): number {
  return xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length;
}

const RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const CATEGORY_ORDER = [
  'partial hand',
  'high card',
  'pair',
  'two pair',
  'three of a kind',
  'straight',
  'flush',
  'full house',
  'four of a kind',
  'straight flush',
];

function matchupSection(agg: MatchupAgg): string {
  const turns = [...agg.turns].sort((a, b) => a - b);
  const lines: string[] = [];
  lines.push(`### ${agg.p0} vs ${agg.p1} — config \`${agg.config}\` (${agg.games} games)`);
  lines.push('');
  lines.push(
    `- **Turns:** median ${percentile(turns, 0.5)}, p10 ${percentile(turns, 0.1)}, ` +
      `p90 ${percentile(turns, 0.9)}, p95 ${percentile(turns, 0.95)}, max ${turns[turns.length - 1]}`,
  );
  lines.push(
    `- **Outcomes:** ${agg.p0} (seat 0) ${pct(agg.winsP0 / agg.games)} · draws ${pct(agg.draws / agg.games)} · ` +
      `stalls ${pct(agg.stalls / agg.games, 2)} · first-player wins ${pct(
        agg.winsFirst / Math.max(1, agg.games - agg.draws),
      )} (of decided)`,
  );
  lines.push(
    `- **Banks:** seat0 mean ${mean(agg.bankSizes[0]).toFixed(1)}, seat1 mean ${mean(
      agg.bankSizes[1],
    ).toFixed(1)}; winners ${mean(agg.winnerBankSizes).toFixed(1)} vs losers ${mean(
      agg.loserBankSizes,
    ).toFixed(1)}`,
  );
  const totalSets = Object.values(agg.setsByRank).reduce((a, b) => a + b, 0);
  const totalSummons = Object.values(agg.summonsByRank).reduce((a, b) => a + b, 0);
  lines.push(
    `- **Attack vs defense:** ${(agg.attacksDeclared / agg.games).toFixed(1)} attacks/game vs ` +
      `${(totalSets / agg.games).toFixed(1)} monster sets/game (face-up summons ${(
        totalSummons / agg.games
      ).toFixed(1)}); attacks into defense ${(agg.attacksIntoDefense / agg.games).toFixed(1)}/game`,
  );
  lines.push(
    `- **Wall punish:** ${(agg.wallPunishes / agg.games).toFixed(2)}/game, ` +
      `${(agg.wallPunishCardsLost / agg.games).toFixed(2)} bank cards lost/game`,
  );
  lines.push(
    `- **Bank triggers:** ${(agg.bankTriggersEarned / agg.games).toFixed(1)}/game ` +
      `(+${(agg.bankTriggersSkipped / agg.games).toFixed(2)} unusable) → ` +
      `bank ${agg.bankChoices.bank}, remove ${agg.bankChoices.remove}, decline ${agg.bankChoices.decline}`,
  );
  const jb = agg.jokerBuckets;
  lines.push(
    `- **Jokers:** win rate by jokers cast — 0: ${pct(jb[0]!.wins / Math.max(1, jb[0]!.games))} (${jb[0]!.games}), ` +
      `1: ${pct(jb[1]!.wins / Math.max(1, jb[1]!.games))} (${jb[1]!.games}), ` +
      `2+: ${pct(jb[2]!.wins / Math.max(1, jb[2]!.games))} (${jb[2]!.games})`,
  );
  if (agg.polys.cast > 0) {
    lines.push(
      `- **Poly:** ${(agg.polys.cast / agg.games).toFixed(2)}/game, bust ${pct(
        agg.polys.bust / agg.polys.cast,
      )}, stand ${pct(agg.polys.stand / agg.polys.cast)}, avg stood total ${
        agg.polys.totalN > 0 ? (agg.polys.totalSum / agg.polys.totalN).toFixed(1) : '—'
      }`,
    );
  }
  const spells = Object.entries(agg.spellsCast)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${(v / agg.games).toFixed(2)}`)
    .join(', ');
  if (spells) lines.push(`- **Spells cast/game:** ${spells}`);
  if (agg.kRank.casts > 0) {
    lines.push(
      `- **K spells (R3):** ${(agg.kRank.casts / agg.games).toFixed(2)}/game, ` +
        `Ace-as-11 fuel ${pct(agg.kRank.aceAs11 / agg.kRank.casts)} of casts, ` +
        `outright debuff kills ${pct(agg.kRank.debuffKills / agg.kRank.casts)} of casts ` +
        `(avg power destroyed ${
          agg.kRank.debuffKills > 0
            ? (agg.kRank.powerKilledSum / agg.kRank.debuffKills).toFixed(1)
            : '—'
        })`,
    );
  }
  lines.push(
    `- **Sac summons/game:** 1-sac ${(agg.sacSummons.one / agg.games).toFixed(2)}, ` +
      `2-sac ${(agg.sacSummons.two / agg.games).toFixed(2)} · milled cards/game ${(
        agg.milled / agg.games
      ).toFixed(2)}`,
  );

  const setRateRow = RANK_ORDER.map((r) => {
    const sets = agg.setsByRank[r] ?? 0;
    const total = sets + (agg.summonsByRank[r] ?? 0);
    return total === 0 ? '—' : pct(sets / total, 0);
  }).join(' | ');
  const flipDelayRow = RANK_ORDER.map((r) => {
    const t = agg.flipDelayByRank[r];
    return t && t.n > 0 ? (t.sum / t.n).toFixed(1) : '—';
  }).join(' | ');
  lines.push('');
  lines.push(`| rank | ${RANK_ORDER.join(' | ')} |`);
  lines.push(`|---|${RANK_ORDER.map(() => '---').join('|')}|`);
  lines.push(`| set rate | ${setRateRow} |`);
  lines.push(`| mean turns until flip | ${flipDelayRow} |`);
  lines.push('');

  const totalHands = Object.values(agg.handCategories).reduce((a, b) => a + b, 0);
  const catRow = CATEGORY_ORDER.filter((c) => agg.handCategories[c]).map(
    (c) => `${c} ${pct((agg.handCategories[c] ?? 0) / totalHands, 0)}`,
  );
  lines.push(`- **Showdown hands (all):** ${catRow.join(', ')}`);
  const totalWinnerHands = Object.values(agg.winnerHandCategories).reduce((a, b) => a + b, 0);
  if (totalWinnerHands > 0) {
    const winRow = CATEGORY_ORDER.filter((c) => agg.winnerHandCategories[c]).map(
      (c) => `${c} ${pct((agg.winnerHandCategories[c] ?? 0) / totalWinnerHands, 0)}`,
    );
    lines.push(`- **Winning hands:** ${winRow.join(', ')}`);
  }
  lines.push('');
  return lines.join('\n');
}

/** Win-rate matrix per config: row agent's rate vs column agent, both seats pooled. */
function winMatrix(aggs: MatchupAgg[], config: string): string {
  const agents = [...new Set(aggs.flatMap((a) => [a.p0, a.p1]))].sort();
  if (agents.length < 2) return '';
  const cell = new Map<string, { wins: number; games: number }>();
  for (const a of aggs) {
    const asP0 = (cell.get(`${a.p0}|${a.p1}`) ?? { wins: 0, games: 0 });
    asP0.wins += a.winsP0;
    asP0.games += a.games;
    cell.set(`${a.p0}|${a.p1}`, asP0);
    const asP1 = (cell.get(`${a.p1}|${a.p0}`) ?? { wins: 0, games: 0 });
    asP1.wins += a.games - a.winsP0 - a.draws;
    asP1.games += a.games;
    cell.set(`${a.p1}|${a.p0}`, asP1);
  }
  const lines = [
    `#### Win-rate matrix — config \`${config}\` (row agent vs column agent, both seats pooled; draws count against)`,
    '',
    `| | ${agents.join(' | ')} |`,
    `|---|${agents.map(() => '---').join('|')}|`,
  ];
  for (const row of agents) {
    const cells = agents.map((col) => {
      const c = cell.get(`${row}|${col}`);
      return c && c.games > 0 ? pct(c.wins / c.games) : '—';
    });
    lines.push(`| **${row}** | ${cells.join(' | ')} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export function generateReport(dir: string): string {
  const groups = aggregate(dir);
  const aggs = [...groups.values()].sort(
    (a, b) =>
      a.config.localeCompare(b.config) || a.p0.localeCompare(b.p0) || a.p1.localeCompare(b.p1),
  );
  if (aggs.length === 0) return `# Sim report\n\nNo .jsonl results found in ${dir}.\n`;
  const configs = [...new Set(aggs.map((a) => a.config))];
  const lines: string[] = [`# Sim report — \`${dir}\``, ''];

  lines.push('## Summary');
  lines.push('');
  lines.push(
    '| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |',
  );
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const a of aggs) {
    const turns = [...a.turns].sort((x, y) => x - y);
    lines.push(
      `| ${a.config} | ${a.p0} vs ${a.p1} | ${a.games} | ${percentile(turns, 0.5)} | ` +
        `${percentile(turns, 0.1)} | ${percentile(turns, 0.9)} | ${turns[turns.length - 1]} | ` +
        `${pct(a.stalls / a.games, 2)} | ${pct(a.winsP0 / a.games)} | ` +
        `${pct(a.winsFirst / Math.max(1, a.games - a.draws))} | ${pct(a.draws / a.games)} |`,
    );
  }
  lines.push('');

  for (const config of configs) {
    const matrix = winMatrix(aggs.filter((a) => a.config === config), config);
    if (matrix) lines.push(matrix);
  }

  lines.push('## Matchup detail');
  lines.push('');
  for (const a of aggs) lines.push(matchupSection(a));
  return lines.join('\n');
}
