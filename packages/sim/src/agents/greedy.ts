// greedy: the measuring instrument. Scores every legal action by static
// features of the PlayerView (no lookahead — it cannot apply actions to a
// view). Feature set per the M2 brief: board power differential, bank delta
// via the poker evaluator, clock awareness (deplete when ahead / conserve when
// behind), the early-denial bank-trigger curve, wall-punish risk, and keeping
// one negate set. Hand-tuned to "not obviously stupid".

import {
  effectiveCardEffect,
  effectiveFlipEffect,
  effectiveSuitEffect,
  pokerRank,
  type Action,
  type GameCard,
  type MonsterView,
  type PlayerView,
  type SeededRNG,
} from '@house-rules/engine';
import type { Agent } from '../agent.js';
import {
  bestBankHand,
  bestBankOption,
  bestRemoveOption,
  compareScored,
  defaultPendingChoice,
  faceUpMonsters,
  keepAllMulligan,
  maxVisiblePower,
  pickUniform,
  visiblePower,
} from './common.js';

const SET_MONSTER_EXPECTED = 5.5;
const EPSILON = 1e-6;

interface Ctx {
  view: PlayerView;
  myPower: number;
  oppPower: number;
  oppMax: number;
  myMax: number;
  /** bank category lead: >0 ahead, <0 behind (clock awareness pivots on this). */
  bankLead: number;
  ahead: boolean;
  behind: boolean;
  /** own bank is worth protecting from wall punish. */
  bankAtRisk: boolean;
  haveNegateSet: boolean;
  negateSetsCount: number;
}

function buildCtx(view: PlayerView): Ctx {
  const mine = faceUpMonsters(view.you);
  const theirs = faceUpMonsters(view.opponent);
  const myBest = bestBankHand(view.you.bank);
  const oppBest = bestBankHand(view.opponent.bank);
  const cmp = compareScored(myBest, oppBest);
  const negateSets = view.you.spellTraps.filter((st) => st?.card?.suit === '♠').length;
  return {
    view,
    myPower: visiblePower(mine),
    oppPower: visiblePower(theirs),
    oppMax: maxVisiblePower(theirs),
    myMax: maxVisiblePower(mine),
    bankLead: myBest.category - oppBest.category || Math.sign(cmp),
    ahead: cmp > 0,
    behind: cmp < 0,
    bankAtRisk: myBest.category >= 1 || view.you.bank.some((c) => bankValueOf(c) >= 11),
    haveNegateSet: negateSets > 0,
    negateSetsCount: negateSets,
  };
}

function bankValueOf(c: GameCard): number {
  return c.rank === 'JOKER' ? 0 : pokerRank(c);
}

function cardPower(c: GameCard): number {
  return c.rank === 'A' ? 1 : Number(c.rank);
}

function monsterAt(view: PlayerView, uid: number): { m: MonsterView; mine: boolean } | null {
  for (const m of view.you.monsters) if (m?.uid === uid) return { m, mine: true };
  for (const m of view.opponent.monsters) if (m?.uid === uid) return { m, mine: false };
  return null;
}

/** Flip-effect value of a card when it triggers under our control. */
function flipValue(card: GameCard, ctx: Ctx): number {
  const eff = effectiveFlipEffect(card);
  if (!eff.startsWith('default:')) return 0.5; // stickers: flat mild value
  switch (eff.slice('default:'.length)) {
    case 'A':
      return 0.5; // becomes 11 until EOT
    case '2':
      return ctx.oppMax > 0 ? 0.5 : 0.1;
    case '3':
      return 0.3; // peek
    case '4':
      return 0.9; // draw 1
    case '5':
      return 0.6 + (ctx.ahead ? 0.4 : 0); // mill 2 — accelerates the clock
    case '6':
      return ctx.oppMax > 0 ? 0.7 : 0.1; // bounce
    case '7':
      return 0.6; // random discard
    case '8': {
      const oppAtk = faceUpMonsters(ctx.view.opponent).filter((m) => m.position === 'attack');
      const myAtk = faceUpMonsters(ctx.view.you).filter((m) => m.position === 'attack');
      return 0.2 + 0.8 * (visiblePower(oppAtk) - visiblePower(myAtk)) * 0.15;
    }
    default:
      return 0; // 9 / 10: no effect
  }
}

/** REVISION 2: the effect a cast resolves — card sticker/default or the sheet's suit entry. */
function spellEffectOf(view: PlayerView, card: GameCard, mode: 'rank' | 'suit'): string {
  if (mode === 'rank') return effectiveCardEffect(card);
  return effectiveSuitEffect(view.suitOverrides, view.player, card.suit!);
}

function scoreAction(a: Action, ctx: Ctx): number {
  const { view } = ctx;
  switch (a.type) {
    case 'pass':
      return 0;
    case 'nextPhase':
      return 0.01;

    case 'summon': {
      const card = view.you.hand![a.handIndex]!;
      const power = cardPower(card);
      const sacs = a.sacrificeZoneIndices ?? [];
      const sacPower = sacs.reduce((s, z) => s + (view.you.monsters[z]?.power ?? 0), 0);
      const net = power - sacPower;
      if (a.mode === 'attack') {
        let score = net * 0.5;
        if (power > ctx.oppMax) score += 1.2;
        else if (ctx.oppMax > 0) score -= 0.8; // will be outfought
        if (view.opponent.monsters.every((m) => m === null)) score += 0.6; // direct line
        if (ctx.ahead) score += 0.3; // race
        return score;
      }
      // set: wall + flip ambush
      let score = net * 0.3 + flipValue(card, ctx) * 0.6;
      if (ctx.behind) score += 0.8; // dig in, deny triggers
      if (power <= 4) score += 0.3; // weak bodies are better face-down
      return score;
    }

    case 'setSpell': {
      const card = view.you.hand![a.handIndex]!;
      if (card.suit === '♠' && !ctx.haveNegateSet) return 1.0; // keep one negate set
      const setCount = view.you.spellTraps.filter((st) => st !== null).length;
      return setCount < 2 ? 0.15 : -0.1;
    }

    case 'castJoker':
      return 0.8 + (ctx.ahead ? 0.4 : 0); // draw 2; depletes own deck — good when ahead

    case 'castSpell': {
      const card =
        a.source.from === 'hand'
          ? view.you.hand![a.source.handIndex]!
          : view.you.spellTraps[a.source.zoneIndex]!.card!;
      const effect = spellEffectOf(view, card, a.mode);
      switch (effect) {
        case 'default:J': {
          const t = a.targetMonsterUid !== undefined ? monsterAt(view, a.targetMonsterUid) : null;
          if (!t || t.mine) return -5;
          const tp = t.m.power ?? SET_MONSTER_EXPECTED;
          return 0.25 * tp + (tp >= ctx.oppMax && tp > 0 ? 0.4 : 0) - 1;
        }
        case 'default:Q':
          return -0.3 + (a.discardHandIndex !== undefined ? 0 : 0); // rarely worth two cards
        case 'default:K': {
          const t = a.targetMonsterUid !== undefined ? monsterAt(view, a.targetMonsterUid) : null;
          if (!t || t.mine) return -5;
          // M2.5 §4: an Ace discard is worth aceValue (1 or 11) at the caster's choice.
          const amount = a.aceValue ?? cardPower(view.you.hand![a.discardHandIndex!]!);
          const tp = t.m.power ?? 0;
          let score = 0.12 * amount - 0.6;
          if (tp - amount <= 0) score += 0.3 + 0.25 * tp; // M2.5 §6: ≤0 destroys outright
          else if (tp >= ctx.myMax && tp - amount < ctx.myMax) score += 1.2; // into kill range
          return score;
        }
        case 'default:♠': {
          const item = view.stack.find((i) => i.id === a.targetStackItemId);
          if (!item || item.controller === view.player) return -5;
          const value = item.kind === 'spell' ? 1.6 : item.kind === 'joker' ? 0.9 : 1.0;
          return value - (ctx.negateSetsCount <= 1 && a.source.from === 'zone' ? 0.3 : 0);
        }
        case 'default:♥': {
          const gt = a.graveTarget!;
          const gy = view[gt.player === view.player ? 'you' : 'opponent'].graveyard;
          const target = gy.find((c) => c.id === gt.cardId);
          if (!target) return -5;
          const power = cardPower(target);
          const rightPos = a.summonPosition === (power > ctx.oppMax ? 'attack' : 'defense');
          return 0.3 * power - 0.6 + (rightPos ? 0.2 : 0);
        }
        case 'default:♣': {
          if (a.targetSTZone!.player === view.player) return -5;
          return 0.4;
        }
        case 'default:♦': {
          // poly: rewrite a weak monster's power; deck depletion doubles as clock
          const t = a.targetMonsterUid !== undefined ? monsterAt(view, a.targetMonsterUid) : null;
          if (!t || !t.mine) return -5;
          const tp = t.m.power ?? 0;
          return 0.3 * (7 - tp) + (ctx.ahead ? 0.5 : -0.3) - 0.4;
        }
        default:
          // A sticker (or a default flip effect stuck on a face card): resolve
          // it like a mild utility spell — worth casting when idle, never at a
          // steep cost.
          return 0.3 - (a.discardHandIndex !== undefined ? 0.5 : 0);
      }
    }

    case 'declareAttack': {
      const attacker = view.you.monsters[a.attackerZone]!;
      const ap = attacker.power ?? 0;
      if (a.direct) return 2.2 + (ctx.ahead ? 0.3 : 0);
      const target = view.opponent.monsters[a.targetZone!]!;
      if (target.power === null) {
        // unknown set monster: wall-punish risk scales with our bank quality
        const risk = ctx.bankAtRisk ? 1.4 : 0.5;
        return (ap - SET_MONSTER_EXPECTED) * 0.35 - risk + 0.3;
      }
      const tp = target.power;
      if (ap > tp)
        return 1.6 + 0.08 * tp + (target.position === 'attack' ? 0.4 : 0) + (ctx.ahead ? 0.2 : 0);
      if (ap === tp) return -0.5;
      return -2.5;
    }

    case 'flipMonster': {
      const m = view.you.monsters[a.zoneIndex]!;
      let score = flipValue(m.card!, ctx);
      if ((m.power ?? 0) > ctx.oppMax) score += 0.4; // becomes a live attacker
      if (view.phase === 'main2') score -= 0.3; // ambush spent for nothing
      return score;
    }

    case 'changePosition': {
      const m = view.you.monsters[a.zoneIndex]!;
      const p = m.power ?? 0;
      if (m.position === 'defense') return p > ctx.oppMax ? 0.3 : -0.3;
      return ctx.behind || p < ctx.oppMax ? 0.2 : -0.4;
    }

    default:
      return 0;
  }
}

export const greedyAgent: Agent = {
  name: 'greedy',
  choose(view: PlayerView, legal: Action[], rng: SeededRNG) {
    if (legal.length === 1) return legal[0]!;

    if (view.pending) {
      if (view.pending.type === 'bankTrigger') {
        // Early-denial / late-accumulation curve: strip the opponent's bank
        // while it's small enough to keep them off a real hand; accumulate own
        // once theirs is established.
        const remove = bestRemoveOption(view, legal);
        const bank = bestBankOption(view, legal);
        const oppBankSize = view.opponent.bank.length;
        if (remove && oppBankSize > 0 && oppBankSize <= 5 && (remove.categoryDelta > 0 || !bank))
          return remove.action;
        if (bank) return bank.action;
        if (remove) return remove.action;
        return legal[0]!;
      }
      return defaultPendingChoice(view, legal, rng) ?? legal[0]!;
    }

    const mulligan = keepAllMulligan(legal);
    if (mulligan) return mulligan;

    const ctx = buildCtx(view);
    let bestScore = -Infinity;
    const best: Action[] = [];
    for (const a of legal) {
      const s = scoreAction(a, ctx);
      if (s > bestScore + EPSILON) {
        bestScore = s;
        best.length = 0;
        best.push(a);
      } else if (s > bestScore - EPSILON) {
        best.push(a);
      }
    }
    return pickUniform(best, rng);
  },
};
