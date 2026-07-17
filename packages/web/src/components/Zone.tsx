// Zone: one monster or spell/trap slot. Empty / face-up / set (monsters
// rotated 90°, set spells not — canon rule 4), power badge, highlight states.

import type { MonsterView, SetSpellView } from '@house-rules/engine';
import { Card, type Highlight } from './Card.js';

interface ZoneShellProps {
  kind: 'monster' | 'st';
  label: string;
  occupied: boolean;
  highlight?: Highlight;
  onClick?: () => void;
  children?: React.ReactNode;
  badge?: React.ReactNode;
}

function ZoneShell({ kind, label, occupied, highlight, onClick, children, badge }: ZoneShellProps) {
  const bg =
    kind === 'monster'
      ? occupied
        ? 'var(--mzone-occ)'
        : 'var(--mzone)'
      : occupied
        ? 'var(--szone-occ)'
        : 'var(--szone)';
  const inkDim = kind === 'monster' ? 'rgba(90,42,30,.5)' : 'rgba(47,66,87,.5)';
  const cls = highlight === 'act' ? 'hl-act' : highlight === 'sel' ? 'hl-sel' : highlight === 'target' ? 'hl-target' : '';
  return (
    <div
      className={cls}
      onClick={onClick}
      style={{
        position: 'relative',
        width: 88,
        height: 94,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        borderRadius: 5,
        boxShadow: occupied
          ? '0 2px 4px rgba(0,0,0,.25), inset 0 0 0 2px rgba(255,255,255,.22)'
          : 'inset 0 0 0 2px rgba(255,255,255,.18)',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <span
        className="gochi"
        style={{ position: 'absolute', top: 2, left: 5, fontSize: 10, opacity: 0.7, zIndex: 1 }}
      >
        {label}
      </span>
      {children ?? (
        <div
          style={{
            width: 52,
            height: 72,
            border: `2px dashed ${inkDim}`,
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: inkDim,
          }}
        >
          empty
        </div>
      )}
      {badge}
    </div>
  );
}

export interface MonsterZoneProps {
  zoneIndex: number;
  mine: boolean;
  monster: MonsterView | null;
  highlight?: Highlight;
  onClick?: () => void;
}

export function MonsterZone({ zoneIndex, mine, monster, highlight, onClick }: MonsterZoneProps) {
  const m = monster;
  const posMark =
    m === null ? '' : m.position === 'attack' ? ' ⚔' : m.position === 'defense' ? ' 🛡' : ' SET';
  const label = `M${zoneIndex + 1}${posMark}`;
  return (
    <ZoneShell
      kind="monster"
      label={label}
      occupied={m !== null}
      highlight={highlight}
      onClick={onClick}
      badge={
        m !== null && m.power !== null ? (
          <span
            className="marker"
            style={{
              position: 'absolute',
              bottom: -7,
              right: -7,
              fontSize: 13,
              color: '#fff',
              background: m.position === 'attack' ? 'var(--red)' : 'var(--green)',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
              transform: 'rotate(-6deg)',
              zIndex: 2,
            }}
          >
            {m.power}
          </span>
        ) : undefined
      }
    >
      {m !== null ? (
        <Card
          rank={m.card?.rank ?? undefined}
          suit={m.card?.suit ?? null}
          faceDown={m.card === null || m.position === 'set'}
          rotated={m.position !== 'attack'}
          w={50}
          h={70}
          title={mine && m.position === 'set' && m.card ? `set: ${m.card.rank}${m.card.suit ?? ''}` : undefined}
        />
      ) : undefined}
    </ZoneShell>
  );
}

export interface STZoneProps {
  zoneIndex: number;
  mine: boolean;
  slot: SetSpellView | null;
  highlight?: Highlight;
  onClick?: () => void;
}

export function STZone({ zoneIndex, mine, slot, highlight, onClick }: STZoneProps) {
  return (
    <ZoneShell
      kind="st"
      label={`S${zoneIndex + 1}${slot ? ' SET' : ''}`}
      occupied={slot !== null}
      highlight={highlight}
      onClick={onClick}
    >
      {slot !== null ? (
        <Card
          faceDown
          w={50}
          h={70}
          title={mine && slot.card ? `set: ${slot.card.rank}${slot.card.suit ?? ''}` : undefined}
        />
      ) : undefined}
    </ZoneShell>
  );
}
