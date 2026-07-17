// StackPanel: center column. Stack items rendered top-down (top resolves
// first — the header says so on screen), controller color-coded, targets
// named. Visible whenever the stack is non-empty.

import type { PlayerView, StackItem } from '@house-rules/engine';
import { faceOf, faceLabel, type CardFace } from '../ui/cardFace.js';
import { PLAYER_NAMES } from '../session/describeEvent.js';
import { HUMAN } from '../session/GameSession.js';
import { Card } from './Card.js';

/** Find a monster (by uid) anywhere on the visible field. */
function monsterName(view: PlayerView, uid: number | undefined): string {
  if (uid === undefined) return '?';
  for (const side of [view.you, view.opponent]) {
    for (const m of side.monsters) {
      if (m && m.uid === uid) return m.card ? faceLabel(faceOf(m.card)) : 'a set monster';
    }
  }
  return 'a departed monster';
}

const EFFECT_LABELS: Record<string, string> = {
  'J-rank': 'rank: DESTROY',
  'Q-rank': 'rank: BUFF',
  'K-rank': 'rank: WEAKEN',
  negate: 'suit: NEGATE ♠',
  revive: 'suit: REVIVE ♥',
  snipe: 'suit: SNIPE ♣',
  poly: 'suit: POLY ♦',
};

function itemFace(item: StackItem): CardFace | null {
  if (item.kind === 'spell' || item.kind === 'joker') return faceOf(item.card);
  return null;
}

function itemText(item: StackItem, view: PlayerView): string {
  switch (item.kind) {
    case 'spell': {
      const eff = EFFECT_LABELS[item.effect] ?? item.effect;
      const target =
        item.targetMonsterUid !== undefined
          ? ` → ${monsterName(view, item.targetMonsterUid)}`
          : item.targetStackItemId !== undefined
            ? ` → stack #${item.targetStackItemId}`
            : item.targetSTZone
              ? ` → ${PLAYER_NAMES[item.targetSTZone.player]}'s S${item.targetSTZone.zoneIndex + 1}`
              : item.graveTarget
                ? ` → grave: ${faceLabel(faceFromGrave(item.graveTarget.cardId))}`
                : '';
      const amount = item.amount !== undefined ? ` (${item.amount})` : '';
      return `${eff}${amount}${target}`;
    }
    case 'joker':
      return 'Joker — draw 2';
    case 'flip':
      return `flip effect (${item.effectRank}) of ${monsterName(view, item.monsterUid)}${
        item.targetMonsterUid !== undefined ? ` → ${monsterName(view, item.targetMonsterUid)}` : ''
      }`;
    case 'attack':
      return `attack: ${monsterName(view, item.attackerUid)} → ${
        item.target === 'direct' ? 'DIRECT' : monsterName(view, item.target)
      }`;
    case 'combat':
      return `combat step: ${monsterName(view, item.attackerUid)} vs ${monsterName(view, item.targetUid)}`;
  }
}

function faceFromGrave(cardId: string): CardFace {
  const face = cardId.slice(cardId.indexOf(':') + 1);
  if (face.startsWith('JOKER')) return { rank: 'JOKER', suit: null };
  return { rank: face.slice(0, -1), suit: face.slice(-1) };
}

export interface StackPanelProps {
  view: PlayerView;
  targetIds: Set<number>; // clickable stack items (♠ negate target step)
  onItemClick: (id: number) => void;
}

export function StackPanel({ view, targetIds, onItemClick }: StackPanelProps) {
  if (view.stack.length === 0) return null;
  const topDown = [...view.stack].reverse(); // last pushed resolves first
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, maxHeight: '100%' }}>
      <div
        className="marker"
        style={{
          fontSize: 14,
          color: '#3a2f14',
          background: 'var(--yellow)',
          padding: '3px 12px',
          borderRadius: 2,
          transform: 'rotate(-1deg)',
          boxShadow: '0 2px 3px rgba(0,0,0,.25)',
        }}
      >
        THE STACK — resolves top ↓ first
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 190 }}>
        {topDown.map((item, i) => {
          const mine = item.controller === HUMAN;
          const face = itemFace(item);
          const clickable = targetIds.has(item.id);
          return (
            <div
              key={item.id}
              className={clickable ? 'hl-target' : ''}
              onClick={clickable ? () => onItemClick(item.id) : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transform: `rotate(${i % 2 === 0 ? 1.5 : -2}deg)`,
                background: i === 0 ? 'var(--yellow)' : 'var(--cream)',
                border: `2px solid ${mine ? 'var(--ballpoint)' : 'var(--red)'}`,
                borderRadius: 4,
                padding: '4px 8px',
                maxWidth: 360,
              }}
            >
              <span
                className="marker"
                style={{
                  fontSize: 12,
                  color: '#fff',
                  background: mine ? 'var(--ballpoint)' : 'var(--red)',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                {i + 1}
              </span>
              {face && <Card rank={face.rank} suit={face.suit} w={34} h={48} />}
              <div style={{ fontSize: 13, lineHeight: 1.15 }}>
                {itemText(item, view)}
                <div className="marker" style={{ fontSize: 9, color: mine ? 'var(--ballpoint)' : 'var(--red)' }}>
                  {PLAYER_NAMES[item.controller].toUpperCase()}
                  {i === 0 ? ' · resolves first' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
