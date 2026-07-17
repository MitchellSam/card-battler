// banker: plays toward the poker win. Banks aggressively on every trigger,
// evaluates bank choices with the engine's own poker evaluator, prefers removal
// only when it strictly downgrades the opponent's best-5 category. Earns
// triggers with guaranteed-win attacks only; otherwise turtles up.

import type { Action, MonsterView } from '@house-rules/engine';
import type { Agent } from '../agent.js';
import {
  bestBankOption,
  bestRemoveOption,
  defaultPendingChoice,
  faceUpMonsters,
  keepAllMulligan,
  maxVisiblePower,
  ofType,
} from './common.js';

export const bankerAgent: Agent = {
  name: 'banker',
  choose(view, legal, rng) {
    if (legal.length === 1) return legal[0]!;

    if (view.pending) {
      if (view.pending.type === 'bankTrigger') {
        const remove = bestRemoveOption(view, legal);
        if (remove && remove.categoryDelta > 0) return remove.action;
        const bank = bestBankOption(view, legal);
        if (bank) return bank.action;
        if (remove) return remove.action;
        return legal[0]!;
      }
      return defaultPendingChoice(view, legal, rng) ?? legal[0]!;
    }

    const mulligan = keepAllMulligan(legal);
    if (mulligan) return mulligan;

    const oppMax = maxVisiblePower(faceUpMonsters(view.opponent));
    const oppHasSets = view.opponent.monsters.some((m) => m?.position === 'set');

    // Battle: only guaranteed wins — direct attacks, or face-up targets that
    // are strictly weaker. Never into sets (wall punish eats the bank).
    const attacks = ofType(legal, 'declareAttack');
    const direct = attacks.find((a) => a.direct);
    if (direct) return direct;
    let bestAttack: { a: Action; margin: number } | null = null;
    for (const a of attacks) {
      if (a.targetZone === undefined) continue;
      const target = view.opponent.monsters[a.targetZone];
      if (!target || target.power === null) continue; // unknown = set = never
      const attacker = view.you.monsters[a.attackerZone]!;
      const margin = (attacker.power ?? 0) - target.power;
      if (margin <= 0) continue;
      if (!bestAttack || margin > bestAttack.margin) bestAttack = { a, margin };
    }
    if (bestAttack) return bestAttack.a;

    // Joker: two more cards toward the bank.
    const joker = ofType(legal, 'castJoker')[0];
    if (joker) return joker;

    // Summon: biggest net-gain monster. Attack position when it dominates the
    // opponent's visible board and there are no unknown sets to trap it;
    // otherwise set it as a wall.
    const summons = ofType(legal, 'summon');
    let bestSummon: { a: Action; net: number } | null = null;
    for (const a of summons) {
      const card = view.you.hand![a.handIndex]!;
      const power = card.rank === 'A' ? 1 : Number(card.rank);
      const sacs = a.sacrificeZoneIndices ?? [];
      const sacPower = sacs.reduce(
        (sum, z) => sum + ((view.you.monsters[z] as MonsterView | null)?.power ?? 0),
        0,
      );
      const net = power - sacPower;
      if (sacs.length > 0 && net <= 0) continue;
      const wantAttack = power > oppMax && !oppHasSets;
      if (a.mode !== (wantAttack ? 'attack' : 'set')) continue;
      if (!bestSummon || net > bestSummon.net) bestSummon = { a, net };
    }
    if (bestSummon) return bestSummon.a;

    // Flip a set monster up when it can win a fight (or swing directly).
    const flips = ofType(legal, 'flipMonster');
    for (const a of flips) {
      const m = view.you.monsters[a.zoneIndex]!;
      const oppMonsters = view.opponent.monsters.filter((x) => x !== null);
      if (oppMonsters.length === 0 || ((m.power ?? 0) > oppMax && !oppHasSets)) return a;
    }

    const pass = legal.find((a) => a.type === 'pass');
    if (pass) return pass;
    const next = legal.find((a) => a.type === 'nextPhase');
    if (next) return next;
    return legal[0]!;
  },
};
