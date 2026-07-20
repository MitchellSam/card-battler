// describeEvent: one human-readable line per GameEvent, written from the
// HUMAN seat's perspective. Pure presentation — no rules logic. Events carry
// full information (they come from the engine, not viewFor), so lines about
// hidden zones redact identities: the opponent's draws, set monsters, and set
// spells never print card names.
//
// A resolver maps a monster uid to its card face IF that identity is public to
// the human (summoned face-up, flipped, revived) — attacks/combat name the
// monster involved. Unknown/hidden uids fall back to "a monster".

import { describeEffect, type GameEvent, type HandResult, type PlayerId } from '@house-rules/engine';
import { AI, HUMAN } from './GameSession.js';

export const PLAYER_NAMES: Record<PlayerId, string> = { 0: 'You', 1: 'Riley' };

export type UidResolver = (uid: number) => string | null;

function who(e: GameEvent, key = 'player'): string {
  return PLAYER_NAMES[e[key] as PlayerId] ?? '??';
}

/** Possessive: "Your" for the human, "Riley's" for the AI. */
function poss(e: GameEvent, key = 'player'): string {
  return (e[key] as PlayerId) === HUMAN ? 'Your' : `${who(e, key)}'s`;
}

/** "0:K♠" → "K♠", "1:JOKER-2" → "Joker". Presentation-only id parsing. */
export function cardName(cardId: unknown): string {
  const id = String(cardId);
  const face = id.slice(id.indexOf(':') + 1);
  return face.startsWith('JOKER') ? 'Joker' : face;
}

function cardList(ids: unknown): string {
  return Array.isArray(ids) ? ids.map(cardName).join(', ') : '';
}

function effectDisplayName(id: string): string {
  try {
    return describeEffect(id).name;
  } catch {
    return id;
  }
}

export function describeEvent(e: GameEvent, resolve?: UidResolver): string {
  const p = who(e);
  const named = (uid: unknown): string =>
    (typeof uid === 'number' ? resolve?.(uid) : null) ?? 'a monster';
  switch (e.type) {
    case 'GameStarted':
      return `Game start — ${who(e, 'firstPlayer')} go${e.firstPlayer === HUMAN ? '' : 'es'} first.`;
    case 'MulliganTaken':
      return e.count === 0 ? `${p} keep${s(e)} the opening hand.` : `${p} mulligan${s(e)} ${e.count}.`;
    case 'TurnStarted':
      return `— Turn ${e.turn} · ${p} —`;
    case 'TurnEnded':
      return `${p} end${s(e)} turn ${e.turn}.`;
    case 'PhaseChanged':
      return `Phase: ${String(e.phase)}.`;
    case 'CardsDrawn':
      return e.player === HUMAN
        ? `You draw ${e.count} (${cardList(e.cardIds)}).`
        : `Riley draws ${e.count}.`;
    case 'CardDiscarded':
      return `${p} discard${s(e)} ${cardName(e.cardId)}${e.random ? ' (at random)' : ''}${e.cost ? ' (cost)' : ''}${e.handLimit ? ' (hand limit)' : ''}.`;
    case 'CardsMilled':
      return `${p} mill${s(e)} ${cardList(e.cardIds)}.`;
    case 'MonsterSummoned':
      return `${p} summon${s(e)} ${cardName(e.cardId)} in attack.`;
    case 'MonsterSet':
      return e.player === HUMAN
        ? `You set ${cardName(e.cardId)} face-down.`
        : `Riley sets a monster face-down.`;
    case 'MonsterSacrificed':
      return `${p} sacrifice${s(e)} ${cardName(e.cardId)}.`;
    case 'SpellSet':
      return e.player === HUMAN
        ? `You set ${cardName(e.cardId)} in a spell/trap zone.`
        : `Riley sets a spell/trap.`;
    case 'SpellCast':
      return `${p} cast${s(e)} ${cardName(e.cardId)} — ${effectName(e)}${amountNote(e)}.`;
    case 'SpellActivated':
      return `${p} flip${s(e)} the set ${cardName(e.cardId)} — ${effectName(e)}${amountNote(e)}.`;
    case 'JokerCast':
      return `${p} cast${s(e)} a Joker (draw 2).`;
    case 'StackResolved':
      return `Stack: ${String(e.kind)} resolves.`;
    case 'EffectNegated':
      return `Negated by ${cardName(e.by)}!`;
    case 'EffectFizzled':
      return `Effect fizzles (${String(e.reason)}).`;
    case 'FlipDeclined':
      return `${p} decline${s(e)} the flip effect of ${named(e.uid)}.`;
    case 'PriorityPassed':
      return `${p} pass${e.player === HUMAN ? '' : 'es'}.`;
    case 'AttackDeclared':
      return e.target === 'direct'
        ? `${p} attack${s(e)} DIRECTLY with ${named(e.attackerUid)}!`
        : `${p} attack${s(e)} with ${named(e.attackerUid)} → ${named(e.target)}.`;
    case 'MonsterFlipped':
      return `${cardName(e.cardId)} is flipped face-up${e.by ? ` (by ${String(e.by)})` : ''}.`;
    case 'FlipTriggered':
      return `${cardName(e.cardId)} flip effect triggers (${describeEffect(String(e.effect)).name}).`;
    case 'PositionChanged':
      return `${poss(e)} monster switches to ${String(e.position)}.`;
    case 'CombatResolved':
      if (e.fizzled) return `Combat fizzles (${String(e.reason)}).`;
      if (e.direct) return `${who(e, 'attacker')} connect${e.attacker === HUMAN ? '' : 's'} directly!`;
      return `Combat: ${String(e.attackerPower)} vs ${String(e.defenderPower)} (${String(e.defenderPosition)}).`;
    case 'MonsterDestroyed':
      return `${poss(e)} ${cardName(e.cardId)} is destroyed${e.cause ? ` (${String(e.cause)})` : ''}.`;
    case 'SetCardDestroyed':
      return `${poss(e)} set ${cardName(e.cardId)} is destroyed.`;
    case 'MonsterReturnedToHand':
      return `${poss(e)} ${cardName(e.cardId)} bounces back to hand.`;
    case 'MonsterSpecialSummoned':
      return `${p} special-summon${s(e)} ${cardName(e.cardId)}.`;
    case 'WallPunish':
      return `WALL PUNISH — ${who(e, 'attacker')} hit a bigger wall${e.bankEmpty ? ' (bank empty, no card lost)' : ' and lose a bank card'}!`;
    case 'BankTriggerAwarded':
      return typeof e.count === 'number' && e.count > 1
        ? `${p} earn${s(e)} a bank trigger — ${e.count} cards!`
        : `${p} earn${s(e)} a bank trigger.`;
    case 'BankTriggerSkipped':
      return `${p} won combat but the bank trigger is skipped.`;
    case 'CardBanked':
      return `${p} bank${s(e)} ${cardName(e.cardId)}${e.cause === 'ante' ? ' (ante)' : ''}.`;
    case 'BankCardRemoved':
      return `${cardName(e.cardId)} is removed from ${e.player === HUMAN ? 'your' : poss(e)} bank (${String(e.reason)}).`;
    case 'BankTriggerDeclined':
      return `${p} decline${s(e)} the bank trigger.`;
    case 'HandRevealed':
      return `${poss(e)} hand is revealed: ${cardList(e.cardIds)}.`;
    case 'DeckPeeked':
      return e.player === HUMAN
        ? `You peek at the top ${String(e.count)} cards of your deck.`
        : `Riley peeks at the top ${String(e.count)} cards of the deck.`;
    case 'DeckRearranged':
      return `${p} rearrange${s(e)} the top of the deck.`;
    case 'CardRecovered':
      return e.player === HUMAN
        ? `You scavenge ${cardName(e.cardId)} back from the graveyard.`
        : `Riley scavenges ${cardName(e.cardId)} back from the graveyard.`;
    case 'CombatSurvived':
      return `${cardName(e.cardId)} SURVIVES the combat (Doorstop)!`;
    case 'PowerChanged':
      return `A monster's power is now ${String(e.power)}${typeof e.delta === 'number' ? ` (${e.delta > 0 ? '+' : ''}${e.delta})` : ''}.`;
    case 'PolyStarted':
      return `${who(e, 'caster')} start${e.caster === HUMAN ? '' : 's'} Polymerization!`;
    case 'PolyCardDrawn':
      return `Poly draw: ${cardName(e.cardId)}.`;
    case 'PolyJokerReshuffled':
      return `Poly: Joker drawn — shuffled back.`;
    case 'PolyBust':
      return `POLY BUST at ${String(e.total)} — monster torn up!`;
    case 'PolyStand':
      return e.targetGone
        ? `Poly stands at ${String(e.total)}, but the monster is gone.`
        : `Poly stands at ${String(e.total)} — fused!`;
    case 'BattleReplay':
      return `${who(e, 'attacker')} target was destroyed — Battle Replay: attack again or stop.`;
    case 'ReplayDeclined':
      return `${p} call${s(e)} off the attack.`;
    case 'DeckOut':
      return `${p} cannot draw — DECK OUT!`;
    case 'GameStalled':
      return `Game stalled at the turn cap.`;
    case 'GameEnded': {
      const hands = e.hands as [HandResult, HandResult] | undefined;
      const handNote = hands ? ` (${hands[0].name} vs ${hands[1].name})` : '';
      if (e.winner === 'draw') return `Game over — a DRAW${handNote}.`;
      return `Game over — ${who(e, 'winner')} win${e.winner === HUMAN ? '' : 's'}${handNote}!`;
    }
    default:
      return String(e.type);
  }
}

/** Verb suffix: "You bank" vs "Riley banks". */
function s(e: GameEvent, key = 'player'): string {
  return (e[key] as PlayerId) === HUMAN ? '' : 's';
}

function effectName(e: GameEvent): string {
  return effectDisplayName(String(e.effect));
}

function amountNote(e: GameEvent): string {
  return typeof e.amount === 'number' ? ` for ${e.amount}` : '';
}

// --- colouring ---------------------------------------------------------------
// The log is rendered as coloured segments: suit symbols in their colour,
// player names, and high-signal keywords stand out. Presentation only.

export interface Segment {
  text: string;
  cls?: string;
}

const KEYWORDS: { re: RegExp; cls: string }[] = [
  { re: /\bYou\b/, cls: 'lg-you' },
  { re: /\bRiley\b/, cls: 'lg-riley' },
  { re: /WALL PUNISH|DECK OUT|POLY BUST|DIRECTLY|DRAW\b|Negated/, cls: 'lg-alert' },
  { re: /\b(bank|banks|banked|Banked)\b|bank trigger/, cls: 'lg-bank' },
  { re: /destroy|destroyed|torn up|Game over|wins?|win\b/, cls: 'lg-kill' },
];

/** Split a described line into coloured segments (suits + names + keywords). */
export function segmentize(line: string): Segment[] {
  // First split on suit symbols so they can be individually coloured.
  const parts = line.split(/([♠♣♥♦])/);
  const out: Segment[] = [];
  for (const part of parts) {
    if (part === '') continue;
    if (part === '♥' || part === '♦') {
      out.push({ text: part, cls: 'lg-red' });
      continue;
    }
    if (part === '♠' || part === '♣') {
      out.push({ text: part, cls: 'lg-black' });
      continue;
    }
    out.push(...keywordSplit(part));
  }
  return out;
}

function keywordSplit(text: string): Segment[] {
  for (const { re, cls } of KEYWORDS) {
    const m = re.exec(text);
    if (m && m.index >= 0) {
      const before = text.slice(0, m.index);
      const hit = m[0];
      const after = text.slice(m.index + hit.length);
      return [...keywordSplit(before), { text: hit, cls }, ...keywordSplit(after)];
    }
  }
  return text ? [{ text }] : [];
}
