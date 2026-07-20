// Shared agent toolkit: action filtering, board/bank evaluation (via the
// engine's own poker evaluator — never reimplemented), and default answers for
// the decision pendings every agent must be able to handle.

import {
  bestHand,
  compareScored,
  pokerRank,
  type Action,
  type GameCard,
  type MonsterView,
  type PlayerView,
  type ScoredHand,
  type SeededRNG,
  type SideView,
} from '@house-rules/engine';

export function pickUniform<T>(items: T[], rng: SeededRNG): T {
  return items[rng.int(items.length)]!;
}

export function ofType<K extends Action['type']>(
  legal: Action[],
  type: K,
): Extract<Action, { type: K }>[] {
  return legal.filter((a): a is Extract<Action, { type: K }> => a.type === type);
}

/** Poker-building value of a card (JOKER = 0: not bankable by default). */
export function bankValue(card: GameCard): number {
  return card.rank === 'JOKER' ? 0 : pokerRank(card);
}

export function faceUpMonsters(side: SideView): MonsterView[] {
  return side.monsters.filter((m): m is MonsterView => m !== null && m.position !== 'set');
}

/** Sum of visible power (opponent set monsters are unknown and count 0). */
export function visiblePower(monsters: MonsterView[]): number {
  return monsters.reduce((sum, m) => sum + (m.power ?? 0), 0);
}

export function maxVisiblePower(monsters: MonsterView[]): number {
  return monsters.reduce((max, m) => Math.max(max, m.power ?? 0), 0);
}

// --- memoized bank evaluation ------------------------------------------------
// bestHand on a large bank enumerates 5-card combos; banks change only a few
// times per game while agents evaluate them every decision, so memoize on the
// bank's card-id signature. Transparent to agent purity.

const bankMemo = new Map<string, ScoredHand>();

export function bestBankHand(bank: GameCard[]): ScoredHand {
  const key = bank.map((c) => c.id).join(',');
  const hit = bankMemo.get(key);
  if (hit) return hit;
  const scored = bestHand(bank);
  if (bankMemo.size > 20_000) bankMemo.clear();
  bankMemo.set(key, scored);
  return scored;
}

/** compareScored, exposed so agents never import the evaluator directly. */
export { compareScored };

// --- bank-trigger option evaluation -------------------------------------------

export interface BankOptionEval {
  action: Action;
  /** categories gained (bank) or stripped from the opponent (remove). */
  categoryDelta: number;
}

/**
 * Above this size, full best-5 enumeration per candidate is too slow for sims
 * (C(n,5) blows up); switch to structural heuristics. Real games rarely get
 * here — degenerate matchups (banker farming aggro) do.
 */
const BIG_BANK = 12;

/** Best 'bank' choice: maximizes own resulting best hand. */
export function bestBankOption(view: PlayerView, legal: Action[]): BankOptionEval | null {
  const options = ofType(legal, 'bankChoice').filter((a) => a.choice === 'bank');
  if (options.length === 0) return null;
  const bank = view.you.bank;
  if (bank.length >= BIG_BANK) {
    // Structural heuristic only — no combinatorial evaluation on huge banks.
    let best: BankOptionEval | null = null;
    let bestScore = -Infinity;
    for (const action of options) {
      const card = view.you.hand![action.handIndex!]!;
      const rank = bankValue(card);
      const sameRank = bank.filter((c) => bankValue(c) === rank).length;
      const sameSuit = bank.filter((c) => c.suit === card.suit).length;
      const score = rank + 4 * sameRank + (sameSuit >= 4 ? 3 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { action, categoryDelta: 0 };
      }
    }
    return best;
  }
  const current = bestBankHand(bank);
  let best: BankOptionEval | null = null;
  let bestHandSoFar: ScoredHand | null = null;
  for (const action of options) {
    const card = view.you.hand![action.handIndex!]!;
    const hand = bestBankHand([...bank, card]);
    if (!bestHandSoFar || compareScored(hand, bestHandSoFar) > 0) {
      bestHandSoFar = hand;
      best = { action, categoryDelta: hand.category - current.category };
    }
  }
  return best;
}

/**
 * Best 'remove' choice: minimizes the opponent's resulting best hand. Only
 * cards participating in the opponent's current best-5 can downgrade it, so
 * only those are evaluated.
 */
export function bestRemoveOption(view: PlayerView, legal: Action[]): BankOptionEval | null {
  const options = ofType(legal, 'bankChoice').filter((a) => a.choice === 'remove');
  if (options.length === 0) return null;
  const bank = view.opponent.bank;
  if (bank.length >= BIG_BANK) {
    // Huge opponent bank: strip its highest card without re-evaluating combos.
    const best = options.reduce((max, a) =>
      bankValue(bank[a.bankIndex!]!) > bankValue(bank[max.bankIndex!]!) ? a : max,
    );
    return { action: best, categoryDelta: 0 };
  }
  const current = bestBankHand(bank);
  const best5 = new Set(current.cards.map((c) => c.id));
  const candidates = options.filter((a) => best5.has(bank[a.bankIndex!]!.id));
  let best: BankOptionEval | null = null;
  let bestHandSoFar: ScoredHand | null = null;
  for (const action of candidates.length > 0 ? candidates : options.slice(0, 1)) {
    const remaining = bank.filter((_, i) => i !== action.bankIndex);
    const hand = bestBankHand(remaining);
    if (!bestHandSoFar || compareScored(hand, bestHandSoFar) < 0) {
      bestHandSoFar = hand;
      best = { action, categoryDelta: current.category - hand.category };
    }
  }
  return best;
}

// --- default pending handlers --------------------------------------------------

/**
 * Sensible deterministic answers for decision pendings that are incidental to
 * an agent's strategy (Poly sub-game, discards, wall-punish picks, flip
 * targets). bankTrigger is NOT handled here — that choice is each agent's
 * identity. Returns null when the pending isn't one of these.
 */
export function defaultPendingChoice(
  view: PlayerView,
  legal: Action[],
  rng: SeededRNG,
): Action | null {
  const pending = view.pending;
  if (!pending) return null;
  switch (pending.type) {
    case 'discard': {
      // Discard the least useful card: low numbers first, faces/jokers last.
      const options = ofType(legal, 'discardCard');
      let best = options[0]!;
      let bestVal = Infinity;
      for (const a of options) {
        const c = view.you.hand![a.handIndex]!;
        const val = c.rank === 'JOKER' ? 12 : pokerRank(c);
        if (val < bestVal) {
          bestVal = val;
          best = a;
        }
      }
      return best;
    }
    case 'wallPunishPick': {
      // Picking from the ATTACKER's bank: if that's us, protect our hand
      // (remove the card whose loss hurts least); if we're the defender,
      // remove the card whose loss hurts the attacker most.
      const options = ofType(legal, 'wallPunishPick');
      const bank =
        pending.attacker === view.player ? view.you.bank : view.opponent.bank;
      const protecting = pending.attacker === view.player;
      const best5 = new Set(bestBankHand(bank).cards.map((c) => c.id));
      if (protecting) {
        // Cheap and safe: lowest card outside the current best-5 if one exists.
        const outside = options.filter((a) => !best5.has(bank[a.bankIndex]!.id));
        const pool = outside.length > 0 ? outside : options;
        return pool.reduce((min, a) =>
          bankValue(bank[a.bankIndex]!) < bankValue(bank[min.bankIndex]!) ? a : min,
        );
      }
      // Defender: only best-5 members can hurt; evaluate those.
      const candidates = options.filter((a) => best5.has(bank[a.bankIndex]!.id));
      let best = options[0]!;
      let bestHandAfter: ScoredHand | null = null;
      for (const a of candidates.length > 0 ? candidates : options.slice(0, 1)) {
        const remaining = bank.filter((_, i) => i !== a.bankIndex);
        const hand = bestBankHand(remaining);
        if (bestHandAfter === null || compareScored(hand, bestHandAfter) < 0) {
          bestHandAfter = hand;
          best = a;
        }
      }
      return best;
    }
    case 'polyAce': {
      const total = view.poly?.total ?? 0;
      const value = total + 11 <= 21 ? 11 : 1;
      return ofType(legal, 'polyAce').find((a) => a.value === value) ?? legal[0]!;
    }
    case 'polyHitStand': {
      // Stand at 14+ (≥7 power); below that another card is worth the risk.
      const total = view.poly?.total ?? 0;
      const want = total <= 13 ? 'polyHit' : 'polyStand';
      return legal.find((a) => a.type === want) ?? legal[0]!;
    }
    case 'interceptor': {
      // Defender picks which monster eats the intercepted direct attack:
      // the biggest one has the best chance to win the fight.
      const options = ofType(legal, 'chooseInterceptor');
      let best = options[0]!;
      let bestPower = -1;
      for (const a of options) {
        const m = view.you.monsters.find((x) => x?.uid === a.monsterUid);
        const power = m?.power ?? 0;
        if (power > bestPower) {
          bestPower = power;
          best = a;
        }
      }
      return best;
    }
    case 'battleReplay':
      // Decline the replay — equivalent to the pre-change fizzle, so battleReplay
      // being on doesn't move sim baselines. (Bosses/search AI may use it later.)
      return legal.find((a) => a.type === 'replayDecline') ?? legal[0]!;
    case 'flipDecision':
      // Heuristic agents always activate — preserves the pre-ratification
      // "flip always resolves" behaviour so sim baselines stay comparable.
      return ofType(legal, 'flipChoice').find((a) => a.choice === 'activate') ?? legal[0]!;
    case 'peekArrange':
      // Keep the peeked order — the information is the value, not the shuffle.
      return (
        ofType(legal, 'peekArrange').find((a) => a.order.every((x, i) => x === i)) ?? legal[0]!
      );
    case 'needlePick': {
      // Discard the opponent's highest-value revealed card.
      const options = ofType(legal, 'needlePick');
      const hand = view.opponent.hand;
      if (!hand) return options[0] ?? legal[0]!;
      return options.reduce((best, a) =>
        bankValue(hand[a.handIndex]!) > bankValue(hand[best.handIndex]!) ? a : best,
      );
    }
    case 'flipTarget': {
      // 2 (position-flip) / 6 (bounce): hit the opponent's biggest face-up
      // monster; fall back to anything.
      const options = ofType(legal, 'chooseFlipTarget');
      const oppFaceUp = faceUpMonsters(view.opponent);
      let best: { a: Action; power: number } | null = null;
      for (const a of options) {
        const m = oppFaceUp.find((x) => x.uid === a.monsterUid);
        if (m && (!best || (m.power ?? 0) > best.power)) best = { a, power: m.power ?? 0 };
      }
      return best?.a ?? pickUniform(options, rng);
    }
    default:
      return null;
  }
}

/** The keep-everything mulligan (all heuristic agents keep their opener). */
export function keepAllMulligan(legal: Action[]): Action | null {
  return (
    ofType(legal, 'mulligan').find((a) => a.discardHandIndices.length === 0) ?? null
  );
}
