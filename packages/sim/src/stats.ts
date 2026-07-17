// Per-game record extraction: one JSONL line per game, distilled from the
// engine's fine-grained event stream + the action log. Schema per the M2 brief.

import type { Action, PlayerId } from '@house-rules/engine';
import type { GameOutcome } from './runner.js';

export interface PlayerGameStats {
  bankSize: number;
  bestHandCategory: number;
  bestHandName: string;
  cardsRemaining: number;
  attacksDeclared: number;
  attacksIntoDefense: number;
  wallPunishesSuffered: number;
  wallPunishCardsLost: number;
  bankTriggersEarned: number;
  bankTriggersSkipped: number;
  bankChoices: { bank: number; remove: number; decline: number };
  spellsCast: Record<string, number>;
  /** R3 instrumentation: K-rank casts by fuel value; kills via the §6 debuff rule. */
  kRank: { casts: number; aceAs11: number; debuffKills: number; powerKilledSum: number };
  jokersCast: number;
  polys: { cast: number; bust: number; stand: number; avgResult: number | null };
  summonsByRank: Record<string, number>;
  setsByRank: Record<string, number>;
  flipTriggersByRank: Record<string, number>;
  /** turns a set monster waited before being flipped (by anyone/anything). */
  flipDelayByRank: Record<string, { sum: number; n: number }>;
  sacSummons: { one: number; two: number };
  milledBy: number;
  milledAgainst: number;
}

export interface GameRecord {
  seed: number;
  config: string;
  p0: string;
  p1: string;
  turns: number;
  steps: number;
  stalled: boolean;
  winner: PlayerId | 'draw';
  endedBy: 'deckOut' | 'maxTurns';
  firstPlayer: PlayerId;
  perPlayer: [PlayerGameStats, PlayerGameStats];
}

function emptyStats(): PlayerGameStats {
  return {
    bankSize: 0,
    bestHandCategory: -1,
    bestHandName: '',
    cardsRemaining: 0,
    attacksDeclared: 0,
    attacksIntoDefense: 0,
    wallPunishesSuffered: 0,
    wallPunishCardsLost: 0,
    bankTriggersEarned: 0,
    bankTriggersSkipped: 0,
    bankChoices: { bank: 0, remove: 0, decline: 0 },
    spellsCast: {},
    kRank: { casts: 0, aceAs11: 0, debuffKills: 0, powerKilledSum: 0 },
    jokersCast: 0,
    polys: { cast: 0, bust: 0, stand: 0, avgResult: null },
    summonsByRank: {},
    setsByRank: {},
    flipTriggersByRank: {},
    flipDelayByRank: {},
    sacSummons: { one: 0, two: 0 },
    milledBy: 0,
    milledAgainst: 0,
  };
}

/** "<owner>:<rank><suit>" → rank ("0:10♠" → "10"); JOKER ids have no suit char. */
function rankOfCardId(cardId: string): string {
  const body = cardId.slice(cardId.indexOf(':') + 1);
  return body.startsWith('JOKER') ? 'JOKER' : body.slice(0, -1);
}

function bump(rec: Record<string, number>, key: string): void {
  rec[key] = (rec[key] ?? 0) + 1;
}

export function buildRecord(
  outcome: GameOutcome,
  meta: { seed: number; config: string; p0: string; p1: string },
): GameRecord {
  const { state, events, actionLog } = outcome;
  const per: [PlayerGameStats, PlayerGameStats] = [emptyStats(), emptyStats()];
  const other = (p: PlayerId): PlayerId => (1 - p) as PlayerId;

  let currentTurn = 1;
  const setMonsters = new Map<number, { rank: string; turn: number; player: PlayerId }>();
  const polyTotals: [number[], number[]] = [[], []];
  // R3: reconstruct pre-debuff power (PowerChanged carries post power + delta).
  const debuffPrior = new Map<number, { prior: number; by: PlayerId | null }>();
  let lastKCaster: PlayerId | null = null;

  for (const e of events) {
    const p = e.player as PlayerId;
    switch (e.type) {
      case 'TurnStarted':
        currentTurn = e.turn as number;
        break;
      case 'AttackDeclared':
        per[p]!.attacksDeclared++;
        break;
      case 'CombatResolved':
        if (e.defenderPosition === 'defense' && typeof e.attacker === 'number')
          per[e.attacker as PlayerId]!.attacksIntoDefense++;
        break;
      case 'WallPunish':
        per[e.attacker as PlayerId]!.wallPunishesSuffered++;
        break;
      case 'BankCardRemoved':
        if (e.reason === 'wallPunish') per[p]!.wallPunishCardsLost++;
        else if (e.reason === 'bankTrigger') per[other(p)]!.bankChoices.remove++;
        break;
      case 'BankTriggerAwarded':
        per[p]!.bankTriggersEarned++;
        break;
      case 'BankTriggerSkipped':
        per[p]!.bankTriggersSkipped++;
        break;
      case 'CardBanked':
        per[p]!.bankChoices.bank++;
        break;
      case 'BankTriggerDeclined':
        per[p]!.bankChoices.decline++;
        break;
      case 'SpellCast':
      case 'SpellActivated':
        bump(per[p]!.spellsCast, e.effect as string);
        if (e.effect === 'K-rank') {
          per[p]!.kRank.casts++;
          // amount 11 is only reachable via an Ace chosen as 11 (numbers cap at 10)
          if (e.amount === 11) per[p]!.kRank.aceAs11++;
          lastKCaster = p;
        }
        break;
      case 'PowerChanged':
        if (typeof e.delta === 'number' && e.delta < 0)
          debuffPrior.set(e.uid as number, {
            prior: (e.power as number) - e.delta,
            by: lastKCaster,
          });
        break;
      case 'MonsterDestroyed':
        if (e.cause === 'debuff') {
          const info = debuffPrior.get(e.uid as number);
          const killer = info?.by;
          if (killer !== null && killer !== undefined) {
            per[killer]!.kRank.debuffKills++;
            per[killer]!.kRank.powerKilledSum += info?.prior ?? 0;
          }
        }
        break;
      case 'JokerCast':
        per[p]!.jokersCast++;
        break;
      case 'MonsterSummoned':
        bump(per[p]!.summonsByRank, rankOfCardId(e.cardId as string));
        break;
      case 'MonsterSet':
        bump(per[p]!.setsByRank, rankOfCardId(e.cardId as string));
        setMonsters.set(e.uid as number, {
          rank: rankOfCardId(e.cardId as string),
          turn: currentTurn,
          player: p,
        });
        break;
      case 'MonsterFlipped': {
        const set = setMonsters.get(e.uid as number);
        if (set) {
          const delays = per[set.player]!.flipDelayByRank;
          const d = (delays[set.rank] ??= { sum: 0, n: 0 });
          d.sum += currentTurn - set.turn;
          d.n++;
          setMonsters.delete(e.uid as number);
        }
        break;
      }
      case 'FlipTriggered':
        bump(per[p]!.flipTriggersByRank, e.effectRank as string);
        break;
      case 'CardsMilled': {
        const n = (e.cardIds as string[]).length;
        per[p]!.milledAgainst += n;
        per[other(p)]!.milledBy += n;
        break;
      }
      case 'PolyStarted':
        per[e.caster as PlayerId]!.polys.cast++;
        break;
      case 'PolyBust':
        per[e.caster as PlayerId]!.polys.bust++;
        break;
      case 'PolyStand':
        per[e.caster as PlayerId]!.polys.stand++;
        polyTotals[e.caster as PlayerId]!.push(e.total as number);
        break;
      default:
        break;
    }
  }

  for (const a of actionLog) {
    if (a.type === 'summon' && a.sacrificeZoneIndices) {
      if (a.sacrificeZoneIndices.length === 1) per[a.player]!.sacSummons.one++;
      else if (a.sacrificeZoneIndices.length === 2) per[a.player]!.sacSummons.two++;
    }
  }

  const result = state.result;
  for (const p of [0, 1] as PlayerId[]) {
    const ps = state.players[p];
    per[p]!.bankSize = ps.bank.length;
    per[p]!.cardsRemaining = ps.deck.length;
    if (result) {
      per[p]!.bestHandCategory = result.hands[p].category;
      per[p]!.bestHandName = result.hands[p].name;
    }
    const totals = polyTotals[p]!;
    if (totals.length > 0)
      per[p]!.polys.avgResult = totals.reduce((a, b) => a + b, 0) / totals.length;
  }

  return {
    ...meta,
    turns: state.turn > state.config.maxTurns ? state.config.maxTurns : state.turn,
    steps: outcome.steps,
    stalled: result?.stalled ?? false,
    winner: result?.winner ?? 'draw',
    endedBy: result?.stalled ? 'maxTurns' : 'deckOut',
    firstPlayer: state.firstPlayer,
    perPlayer: per,
  };
}

export interface Replay {
  kind: string;
  seed: number;
  config: string;
  configOverrides: Record<string, unknown>;
  p0: string;
  p1: string;
  turns: number;
  steps: number;
  error: string | null;
  actionLog: Action[];
}
