// Zone: one monster or spell/trap slot. Empty / face-up / set (monsters
// rotated 90°, set spells not — canon rule 4), power badge, highlight states.

import type { MonsterView, SetSpellView } from '@house-rules/engine';
import { cardTooltip, type SuitOverrides } from '../ui/cardFace.js';
import { Card, hlClass, type Highlight } from './Card.js';

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
  const cls = hlClass(highlight);
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
  /** Show your own face-down set card's identity (a peel-corner peek). */
  peek?: boolean;
  /** The duel's Cheat Sheet sticker state — keeps suit tooltips honest. */
  suitOverrides?: SuitOverrides;
  onClick?: () => void;
}

export function MonsterZone({ zoneIndex, mine, monster, highlight, peek, suitOverrides, onClick }: MonsterZoneProps) {
  const m = monster;
  const peeking = mine && !!peek && m !== null && m.position === 'set' && m.card !== null;
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
          faceDown={m.card === null || (m.position === 'set' && !peeking)}
          rotated={m.position !== 'attack'}
          w={50}
          h={70}
          title={mine && m.position === 'set' && m.card ? `Your set monster — ${cardTooltip(m.card, suitOverrides)}` : undefined}
          style={peeking ? { opacity: 0.72, filter: 'sepia(0.35)' } : undefined}
        />
      ) : undefined}
      {peeking && (
        <span
          className="gochi"
          style={{
            position: 'absolute',
            bottom: 1,
            left: 4,
            fontSize: 9,
            color: '#5a2a1e',
            background: 'rgba(245,238,216,.85)',
            padding: '0 3px',
            borderRadius: 2,
            zIndex: 3,
          }}
        >
          set
        </span>
      )}
    </ZoneShell>
  );
}

export interface STZoneProps {
  zoneIndex: number;
  mine: boolean;
  slot: SetSpellView | null;
  highlight?: Highlight;
  peek?: boolean;
  /** The duel's Cheat Sheet sticker state — keeps suit tooltips honest. */
  suitOverrides?: SuitOverrides;
  onClick?: () => void;
}

export function STZone({ zoneIndex, mine, slot, highlight, peek, suitOverrides, onClick }: STZoneProps) {
  const peeking = mine && !!peek && slot !== null && slot.card !== null;
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
          rank={peeking ? slot.card!.rank : undefined}
          suit={peeking ? slot.card!.suit : null}
          faceDown={!peeking}
          w={50}
          h={70}
          title={mine && slot.card ? `Your set spell/trap — ${cardTooltip(slot.card, suitOverrides)}` : undefined}
          style={peeking ? { opacity: 0.72, filter: 'sepia(0.35)' } : undefined}
        />
      ) : undefined}
    </ZoneShell>
  );
}
