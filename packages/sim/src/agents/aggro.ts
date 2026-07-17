// aggro: the upper bound on aggression. Summons the biggest available attacker,
// attacks whenever legal (biggest attacker into weakest target), always takes
// bank triggers (bank > remove), never sets monsters or spells; ignores spells
// except J-rank kills (and Jokers, which are fuel, not decisions).

import type { Action, MonsterView } from '@house-rules/engine';
import type { Agent } from '../agent.js';
import {
  bestBankOption,
  defaultPendingChoice,
  faceUpMonsters,
  keepAllMulligan,
  ofType,
} from './common.js';

/** Expected power of an unknown face-down monster (uniform A..10 ≈ 5.5). */
const SET_MONSTER_EXPECTED = 5.5;

export const aggroAgent: Agent = {
  name: 'aggro',
  choose(view, legal, rng) {
    if (legal.length === 1) return legal[0]!;

    if (view.pending) {
      if (view.pending.type === 'bankTrigger') {
        const bank = bestBankOption(view, legal);
        if (bank) return bank.action;
        const remove = ofType(legal, 'bankChoice').find((a) => a.choice === 'remove');
        return remove ?? legal[0]!;
      }
      return defaultPendingChoice(view, legal, rng) ?? legal[0]!;
    }

    const mulligan = keepAllMulligan(legal);
    if (mulligan) return mulligan;

    // Battle: biggest attacker into weakest target; direct attacks first.
    const attacks = ofType(legal, 'declareAttack');
    if (attacks.length > 0) {
      const direct = attacks.filter((a) => a.direct);
      if (direct.length > 0) {
        // All attackers get to swing; lead with the biggest.
        return direct.reduce((best, a) =>
          (view.you.monsters[a.attackerZone]?.power ?? 0) >
          (view.you.monsters[best.attackerZone]?.power ?? 0)
            ? a
            : best,
        );
      }
      let best = attacks[0]!;
      let bestScore = -Infinity;
      for (const a of attacks) {
        const attacker = view.you.monsters[a.attackerZone]!;
        const target = view.opponent.monsters[a.targetZone!]!;
        const targetPower = target.power ?? SET_MONSTER_EXPECTED;
        const score = (attacker.power ?? 0) * 100 - targetPower;
        if (score > bestScore) {
          bestScore = score;
          best = a;
        }
      }
      return best;
    }

    // Main phase: J-rank kill on the opponent's biggest face-up monster.
    const oppFaceUp = faceUpMonsters(view.opponent);
    if (oppFaceUp.length > 0) {
      const biggest = oppFaceUp.reduce((a, b) => ((b.power ?? 0) > (a.power ?? 0) ? b : a));
      const kill = ofType(legal, 'castSpell').find(
        (a) =>
          a.mode === 'rank' &&
          a.targetMonsterUid === biggest.uid &&
          a.source.from === 'hand' &&
          view.you.hand![a.source.handIndex]!.rank === 'J',
      );
      if (kill) return kill;
    }

    // Joker: fuel.
    const joker = ofType(legal, 'castJoker')[0];
    if (joker) return joker;

    // Summon the biggest attacker (attack position only). Never sacrifice a
    // bigger attacker than what it buys; among equals, cheapest sacrifice.
    const summons = ofType(legal, 'summon').filter((a) => a.mode === 'attack');
    let bestSummon: { a: Action; power: number; sacPower: number } | null = null;
    for (const a of summons) {
      const card = view.you.hand![a.handIndex]!;
      const power = card.rank === 'A' ? 1 : Number(card.rank);
      const sacs = a.sacrificeZoneIndices ?? [];
      const sacPower = sacs.reduce(
        (sum, z) => sum + ((view.you.monsters[z] as MonsterView | null)?.power ?? 0),
        0,
      );
      if (sacPower >= power) continue; // don't eat your board for a downgrade
      if (
        !bestSummon ||
        power > bestSummon.power ||
        (power === bestSummon.power && sacPower < bestSummon.sacPower)
      ) {
        bestSummon = { a, power, sacPower };
      }
    }
    if (bestSummon) return bestSummon.a;

    // Everything face-up and swinging: defense → attack.
    const posChange = ofType(legal, 'changePosition').find(
      (a) => view.you.monsters[a.zoneIndex]?.position === 'defense',
    );
    if (posChange) return posChange;
    const flip = ofType(legal, 'flipMonster')[0]; // only via revive/effects; still: face-up
    if (flip) return flip;

    const pass = legal.find((a) => a.type === 'pass');
    if (pass) return pass;
    const next = legal.find((a) => a.type === 'nextPhase');
    if (next) return next;
    return legal[0]!;
  },
};
