// actionSummary: a one-line, human-readable description of a fully-composed
// action, shown in the confirm-first popup before it is dispatched. Pure
// presentation — no rules logic.

import {
  describeEffect,
  effectiveCardEffect,
  effectiveSuitEffect,
  getEffectSpec,
  type Action,
  type GameCard,
  type PlayerView,
} from '@house-rules/engine';
import { HUMAN } from '../session/GameSession.js';
import { faceFromId, faceLabel, jokerText } from '../ui/cardFace.js';

type UidName = (uid: number) => string | null;

function handFace(view: PlayerView, i: number): string {
  const c = view.you.hand?.[i];
  return c ? faceLabel({ rank: c.rank, suit: c.suit }) : '?';
}

function zoneFace(view: PlayerView, zoneIndex: number): string {
  const m = view.you.monsters[zoneIndex];
  return m?.card ? faceLabel({ rank: m.card.rank, suit: m.card.suit }) : 'monster';
}

function stFace(view: PlayerView, zoneIndex: number): string {
  const st = view.you.spellTraps[zoneIndex];
  return st?.card ? faceLabel({ rank: st.card.rank, suit: st.card.suit }) : 'set card';
}

function sourceCard(a: Extract<Action, { type: 'castSpell' }>, view: PlayerView): GameCard | null {
  return a.source.from === 'hand'
    ? (view.you.hand?.[a.source.handIndex] ?? null)
    : (view.you.spellTraps[a.source.zoneIndex]?.card ?? null);
}

/** The effect id a castSpell action resolves (REVISION 2: sticker/sheet-aware). */
function castEffect(a: Extract<Action, { type: 'castSpell' }>, view: PlayerView): string | null {
  const card = sourceCard(a, view);
  if (!card) return null;
  return a.mode === 'rank'
    ? effectiveCardEffect(card)
    : effectiveSuitEffect(view.suitOverrides, view.player, card.suit!);
}

/**
 * A loud warning when a composed action would hit one of the player's OWN cards
 * destructively — shown in the confirm popup so a single-target auto-advance
 * can't quietly blow up your own board. Which effects are harmful comes from
 * the engine registry (EffectSpec.harm), never a hardcoded id list, so new
 * destructive stickers warn automatically. Returns null when nothing
 * self-destructive is targeted.
 */
export function selfTargetWarning(a: Action, view: PlayerView, uidName: UidName): string | null {
  if (a.type !== 'castSpell') return null;
  const harm = (eff: string | null): 'destroy' | 'weaken' | undefined =>
    eff ? getEffectSpec(eff)?.harm : undefined;
  if (a.targetSTZone && a.targetSTZone.player === HUMAN && harm(castEffect(a, view)) === 'destroy')
    return `This DESTROYS your own set card in S${a.targetSTZone.zoneIndex + 1}.`;
  if (a.targetMonsterUid !== undefined) {
    const mine = view.you.monsters.some((m) => m?.uid === a.targetMonsterUid);
    if (!mine) return null;
    const h = harm(castEffect(a, view));
    const face = uidName(a.targetMonsterUid) ?? 'your monster';
    if (h === 'destroy') return `This DESTROYS your own ${face}.`;
    if (h === 'weaken') return `This WEAKENS your own ${face}.`;
  }
  return null;
}

export function actionSummary(a: Action, view: PlayerView, uidName: UidName): string {
  const mon = (uid?: number): string => (uid !== undefined ? (uidName(uid) ?? 'a monster') : '?');
  switch (a.type) {
    case 'summon': {
      const face = handFace(view, a.handIndex);
      const sac =
        a.sacrificeZoneIndices && a.sacrificeZoneIndices.length > 0
          ? `, tributing ${a.sacrificeZoneIndices.map((z) => zoneFace(view, z)).join(' + ')}`
          : '';
      return `Summon ${face} in ${a.mode === 'attack' ? 'ATTACK' : 'face-down SET'} to M${a.zoneIndex + 1}${sac}?`;
    }
    case 'setSpell':
      return `Set ${handFace(view, a.handIndex)} face-down in S${a.zoneIndex + 1}?`;
    case 'castSpell': {
      const src =
        a.source.from === 'hand' ? handFace(view, a.source.handIndex) : stFace(view, a.source.zoneIndex);
      const eff = castEffect(a, view);
      const effName = eff ? describeEffect(eff).name : a.mode === 'rank' ? 'rank effect' : 'suit effect';
      const tgt =
        a.targetMonsterUid !== undefined
          ? ` on ${mon(a.targetMonsterUid)}`
          : a.targetStackItemId !== undefined
            ? ` on the stack item`
            : a.graveTarget
              ? ` — ${faceLabel(faceFromId(a.graveTarget.cardId))} (${a.summonPosition})`
              : a.targetSTZone
                ? ` on ${a.targetSTZone.player === HUMAN ? 'your' : "Riley's"} S${a.targetSTZone.zoneIndex + 1}`
                : '';
      const fuel = a.discardHandIndex !== undefined ? `, discarding ${handFace(view, a.discardHandIndex)}` : '';
      const ace = a.aceValue !== undefined ? ` (Ace as ${a.aceValue})` : '';
      return `Cast ${src} — "${effName}"${tgt}${fuel}${ace}?`;
    }
    case 'castJoker':
      return `Cast Joker — ${jokerText()}?`;
    case 'declareAttack':
      return a.direct
        ? `Attack DIRECTLY with ${zoneFace(view, a.attackerZone)}?`
        : `Attack with ${zoneFace(view, a.attackerZone)} → ${oppZoneFace(view, a.targetZone)}?`;
    case 'flipMonster':
      return `Flip up ${zoneFace(view, a.zoneIndex)}?`;
    case 'changePosition':
      return `Switch ${zoneFace(view, a.zoneIndex)} to the other position?`;
    default:
      return 'Confirm this action?';
  }
}

function oppZoneFace(view: PlayerView, zoneIndex?: number): string {
  if (zoneIndex === undefined) return 'a monster';
  const m = view.opponent.monsters[zoneIndex];
  return m?.card ? faceLabel({ rank: m.card.rank, suit: m.card.suit }) : 'a set monster';
}
