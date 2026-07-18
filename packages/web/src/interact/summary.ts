// actionSummary: a one-line, human-readable description of a fully-composed
// action, shown in the confirm-first popup before it is dispatched. Pure
// presentation — no rules logic.

import type { Action, PlayerView } from '@house-rules/engine';
import { HUMAN } from '../session/GameSession.js';
import { faceFromId, faceLabel } from '../ui/cardFace.js';

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

const EFFECT_VERB: Record<string, string> = {
  negate: 'negate',
  revive: 'revive',
  snipe: 'snipe a set spell/trap',
  poly: 'Polymerize',
};

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
      if (a.mode === 'rank') {
        const verb =
          a.targetMonsterUid !== undefined ? ` on ${mon(a.targetMonsterUid)}` : '';
        const fuel = a.discardHandIndex !== undefined ? `, discarding ${handFace(view, a.discardHandIndex)}` : '';
        const ace = a.aceValue !== undefined ? ` (Ace as ${a.aceValue})` : '';
        return `Cast ${src} rank effect${verb}${fuel}${ace}?`;
      }
      const suit = src.slice(-1);
      const verb = EFFECT_VERB[suitEffect(suit)] ?? 'use suit effect';
      const tgt =
        a.targetMonsterUid !== undefined
          ? ` on ${mon(a.targetMonsterUid)}`
          : a.targetStackItemId !== undefined
            ? ` the stack item`
            : a.graveTarget
              ? ` ${faceLabel(faceFromId(a.graveTarget.cardId))} (${a.summonPosition})`
              : a.targetSTZone
                ? ` ${a.targetSTZone.player === HUMAN ? 'your' : "Riley's"} S${a.targetSTZone.zoneIndex + 1}`
                : '';
      return `Cast ${src} to ${verb}${tgt}?`;
    }
    case 'castJoker':
      return `Cast Joker (draw 2)?`;
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

function suitEffect(suit: string): string {
  return suit === '♠' ? 'negate' : suit === '♥' ? 'revive' : suit === '♣' ? 'snipe' : 'poly';
}
