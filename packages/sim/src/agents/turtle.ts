// turtle: never declares attacks. Sets every monster. Sets spells. Passes.
// THE degeneracy probe — turtle-vs-turtle answers the double-turtle stall
// question empirically.

import type { Action, MonsterView } from '@house-rules/engine';
import type { Agent } from '../agent.js';
import {
  bestBankOption,
  defaultPendingChoice,
  keepAllMulligan,
  ofType,
} from './common.js';

export const turtleAgent: Agent = {
  name: 'turtle',
  choose(view, legal, rng) {
    if (legal.length === 1) return legal[0]!;

    if (view.pending) {
      if (view.pending.type === 'bankTrigger') {
        // Passive value: bank the best card when handed a trigger; never remove.
        const bank = bestBankOption(view, legal);
        if (bank) return bank.action;
        const decline = ofType(legal, 'bankChoice').find((a) => a.choice === 'decline');
        return decline ?? legal[0]!;
      }
      return defaultPendingChoice(view, legal, rng) ?? legal[0]!;
    }

    const mulligan = keepAllMulligan(legal);
    if (mulligan) return mulligan;

    // Set a monster: prefer zero-sacrifice walls (highest power); take a
    // sacrifice set only when the hand offers nothing free, and only at a
    // net power gain over the walls it eats.
    const sets = ofType(legal, 'summon').filter((a) => a.mode === 'set');
    let bestSet: { a: Action; net: number; sacs: number } | null = null;
    for (const a of sets) {
      const card = view.you.hand![a.handIndex]!;
      const power = card.rank === 'A' ? 1 : Number(card.rank);
      const sacs = a.sacrificeZoneIndices ?? [];
      const sacPower = sacs.reduce(
        (sum, z) => sum + ((view.you.monsters[z] as MonsterView | null)?.power ?? 0),
        0,
      );
      const net = power - sacPower;
      if (sacs.length > 0 && net <= 0) continue;
      if (
        !bestSet ||
        sacs.length < bestSet.sacs ||
        (sacs.length === bestSet.sacs && net > bestSet.net)
      ) {
        bestSet = { a, net, sacs: sacs.length };
      }
    }
    if (bestSet) return bestSet.a;

    // Set spells into free zones.
    const setSpell = ofType(legal, 'setSpell')[0];
    if (setSpell) return setSpell;

    // Otherwise pass through everything: priority windows and phases alike.
    const pass = legal.find((a) => a.type === 'pass');
    if (pass) return pass;
    const next = legal.find((a) => a.type === 'nextPhase');
    if (next) return next;
    return legal[0]!;
  },
};
