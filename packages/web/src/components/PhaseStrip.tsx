// PhaseStrip: turn number, whose turn, ENGINE phases only (no invented
// Standby/Draw phase — the turn-start draw is a moment, not a phase).

import type { Phase } from '@house-rules/engine';
import { PLAYER_NAMES } from '../session/describeEvent.js';
import { HUMAN } from '../session/GameSession.js';
import type { PlayerId } from '@house-rules/engine';

const PHASES: { key: Phase; label: string }[] = [
  { key: 'main1', label: 'Main' },
  { key: 'battle', label: 'Battle' },
  { key: 'main2', label: 'Main 2' },
  { key: 'end', label: 'End' },
];

export interface PhaseStripProps {
  turn: number;
  phase: Phase;
  activePlayer: PlayerId;
  normalSummonUsed: boolean;
  onCheatSheet: () => void;
}

export function PhaseStrip({ turn, phase, activePlayer, normalSummonUsed, onCheatSheet }: PhaseStripProps) {
  const yourTurn = activePlayer === HUMAN;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 42, flex: 'none' }}>
      <div
        className="marker"
        style={{
          fontSize: 17,
          color: 'var(--cream)',
          background: yourTurn ? 'var(--ballpoint)' : 'var(--red)',
          padding: '4px 12px',
          borderRadius: 3,
          transform: 'rotate(-1.4deg)',
          boxShadow: '0 2px 4px rgba(0,0,0,.35)',
        }}
      >
        {yourTurn ? 'YOUR TURN' : `${PLAYER_NAMES[activePlayer].toUpperCase()}'S TURN`}{' '}
        <span style={{ fontFamily: "'Patrick Hand'", fontSize: 12, opacity: 0.85 }}>· turn {turn}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'rgba(245,238,216,.92)',
          padding: '4px 12px',
          borderRadius: 4,
          transform: 'rotate(.5deg)',
          boxShadow: '0 2px 4px rgba(0,0,0,.25)',
        }}
      >
        <span className="gochi" style={{ fontSize: 12, color: 'var(--muted)' }}>
          PHASE:
        </span>
        {phase === 'mulligan' || phase === 'gameOver' ? (
          <span className="marker" style={{ fontSize: 14, color: 'var(--red)', background: 'var(--yellow)', padding: '1px 8px', borderRadius: 3 }}>
            {phase === 'mulligan' ? 'MULLIGAN' : 'GAME OVER'}
          </span>
        ) : (
          PHASES.map((p, i) => (
            <span key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {i > 0 && <span style={{ color: '#c3b997' }}>›</span>}
              {p.key === phase ? (
                <span
                  className="marker"
                  style={{
                    fontSize: 15,
                    color: 'var(--red)',
                    background: 'var(--yellow)',
                    padding: '1px 8px',
                    borderRadius: 3,
                    transform: 'rotate(-2deg)',
                    display: 'inline-block',
                  }}
                >
                  {p.label.toUpperCase()}
                </span>
              ) : (
                <span style={{ fontSize: 14, color: '#a59b83' }}>{p.label}</span>
              )}
            </span>
          ))
        )}
      </div>
      <div
        className="gochi"
        style={{
          fontSize: 12,
          color: '#5a2a1e',
          background: '#e6a793',
          padding: '3px 9px',
          borderRadius: 3,
          transform: 'rotate(-1deg)',
        }}
      >
        Normal Summon:{' '}
        <b className="marker" style={{ color: normalSummonUsed ? 'var(--red)' : 'var(--green)' }}>
          {normalSummonUsed ? 'USED ✗' : 'FREE ✓'}
        </b>
      </div>
      <div style={{ flex: 1 }} />
      <button
        className="marker"
        onClick={onCheatSheet}
        style={{
          fontSize: 14,
          color: '#3a2f14',
          background: 'var(--yellow)',
          border: 'none',
          padding: '7px 12px',
          borderRadius: 2,
          transform: 'rotate(2deg)',
          boxShadow: '0 3px 5px rgba(0,0,0,.3)',
        }}
      >
        CHEAT SHEET
      </button>
    </div>
  );
}
