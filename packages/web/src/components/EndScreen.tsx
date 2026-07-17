// EndScreen: winner, both HandResults with the five cards shown, turns,
// wall-clock minutes, seed, replay export, rematch / same-seed buttons.
// This is where the M3 instrumentation gets reported.

import type { GameResult } from '@house-rules/engine';
import type { SessionStats } from '../session/GameSession.js';
import { HUMAN } from '../session/GameSession.js';
import { PLAYER_NAMES } from '../session/describeEvent.js';
import { Card } from './Card.js';

export interface EndScreenProps {
  result: GameResult;
  stats: SessionStats;
  seed: number;
  onExportReplay: () => void;
  onRematch: () => void;
  onReplaySameSeed: () => void;
}

export function EndScreen({ result, stats, seed, onExportReplay, onRematch, onReplaySameSeed }: EndScreenProps) {
  const minutes = stats.wallClockMs / 60000;
  const meanSec = stats.meanHumanMsPerDecision === null ? null : stats.meanHumanMsPerDecision / 1000;
  const title =
    result.winner === 'draw' ? "IT'S A DRAW!" : result.winner === HUMAN ? 'YOU WIN!!!' : `${PLAYER_NAMES[result.winner].toUpperCase()} WINS!`;
  return (
    <div className="overlay" style={{ zIndex: 50 }}>
      <div className="paper-modal" style={{ minWidth: 560 }}>
        <div
          className="marker"
          style={{ fontSize: 34, color: result.winner === HUMAN ? 'var(--green)' : 'var(--red)', transform: 'rotate(-1.5deg)' }}
        >
          {title}
        </div>
        {result.stalled && (
          <div className="gochi" style={{ color: 'var(--red)' }}>
            (game stalled at the turn cap — showdown by current banks)
          </div>
        )}
        <div style={{ display: 'flex', gap: 30, margin: '14px 0' }}>
          {([0, 1] as const).map((p) => (
            <div key={p}>
              <div className="marker" style={{ fontSize: 14, color: p === HUMAN ? 'var(--ballpoint)' : 'var(--red)' }}>
                {PLAYER_NAMES[p].toUpperCase()} — {result.hands[p].name}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {result.hands[p].cards.map((c) => (
                  <Card key={c.id} rank={c.rank} suit={c.suit} w={44} h={62} />
                ))}
                {result.hands[p].cards.length === 0 && (
                  <span className="gochi" style={{ color: 'var(--muted)' }}>
                    (empty bank)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.5 }}>
          <b>{stats.turns}</b> turns · <b>{minutes.toFixed(1)}</b> minutes on the clock · seed{' '}
          <b>{seed}</b>
          <br />
          your decisions: <b>{stats.humanDecisions}</b>
          {meanSec !== null && (
            <>
              {' '}
              · mean <b>{meanSec.toFixed(1)}s</b> per decision
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="note-btn green" onClick={onRematch}>
            REMATCH (new seed)
          </button>
          <button className="note-btn blue" onClick={onReplaySameSeed}>
            REPLAY same seed
          </button>
          <button className="note-btn yellow" onClick={onExportReplay}>
            EXPORT REPLAY ⤓
          </button>
        </div>
      </div>
    </div>
  );
}
