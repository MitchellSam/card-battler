// Cheat Sheet modal — M3 ships a visibly-placeholder page plus the canon
// corrections list from the M3 brief. Real content is a design-session task.
// M4: run-mode scrawls (sheet mods, boss cheats, curses) render as crayon
// lines at the top — config-driven, never hardcoded copy (exit criterion 6).
//
// NEVER HARDCODE RULES: every config-dependent line below reads the LIVE
// duel config (view.config via cfgFor — per-seat aware, so a boss drawPerTurn
// override shows the boss's real number), and the suit-spell list resolves
// through effectiveSuitEffect + describeEffect so Cheat-Sheet stickers can
// never drift. The few remaining static lines state structural spec rules
// (M2.5) that have no config knob and no engine text source yet — they go
// away when the real sheet content is designed.

import {
  SUITS,
  cfgFor,
  describeEffect,
  effectiveSuitEffect,
  type PlayerView,
} from '@house-rules/engine';
import { PLAYER_NAMES } from '../session/describeEvent.js';

function drawLine(view: PlayerView): string {
  const cfg = view.config;
  const you = cfgFor(cfg, view.player, 'drawPerTurn');
  const opp = cfgFor(cfg, (1 - view.player) as 0 | 1, 'drawPerTurn');
  const oppName = PLAYER_NAMES[(1 - view.player) as 0 | 1];
  return you === opp
    ? `Draw is ${you} per turn.`
    : `Draw is ${you} per turn for you — ${opp} for ${oppName}.`;
}

function anteLine(view: PlayerView): string | null {
  const cfg = view.config;
  const you = cfgFor(cfg, view.player, 'ante');
  const opp = cfgFor(cfg, (1 - view.player) as 0 | 1, 'ante');
  const oppName = PLAYER_NAMES[(1 - view.player) as 0 | 1];
  if (you === 0 && opp === 0) return null;
  return you === opp
    ? `Ante: ${you} card${you === 1 ? '' : 's'} off the top of each deck start in the bank.`
    : `Ante: ${you} of your cards and ${opp} of ${oppName}'s start in the bank.`;
}

const WALL_PUNISH_WORDS = { random: 'random', defender: "the defender's choice", attacker: "the attacker's choice" } as const;

export function CheatSheet({ view, scrawls = [], onClose }: { view: PlayerView; scrawls?: string[]; onClose: () => void }) {
  const cfg = view.config;
  const ante = anteLine(view);
  return (
    <div className="overlay" style={{ zIndex: 60 }} onClick={onClose}>
      <div className="paper-modal" onClick={(e) => e.stopPropagation()} style={{ width: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="marker" style={{ fontSize: 26, color: 'var(--red)', transform: 'rotate(-1.5deg)' }}>
            MY GAME — RULES!!!
          </div>
          <button className="note-btn red" onClick={onClose}>
            close ✕
          </button>
        </div>
        {scrawls.length > 0 && (
          <div style={{ margin: '10px 0 0' }}>
            {scrawls.map((s, i) => (
              <div
                key={s}
                className="marker"
                style={{ fontSize: 18, color: 'var(--red)', transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)`, marginBottom: 4 }}
              >
                ✎ {s}
              </div>
            ))}
          </div>
        )}
        <div style={{ margin: '12px 0 0' }}>
          <div className="marker" style={{ fontSize: 18, transform: 'rotate(-.4deg)' }}>
            SUIT SPELLS (your casts):
          </div>
          <ul style={{ fontSize: 15, lineHeight: 1.45, paddingLeft: 20, margin: '4px 0 0' }}>
            {SUITS.map((suit) => {
              const eff = effectiveSuitEffect(view.suitOverrides, view.player, suit);
              const d = describeEffect(eff);
              const stickered = eff !== `default:${suit}`;
              return (
                <li key={suit}>
                  <b>{suit}</b> — {stickered ? <b>[{d.name} — sheet sticker!]</b> : null} {d.text}
                </li>
              );
            })}
            <li>
              <b>Joker</b> — {describeEffect('default:JOKER').text}
            </li>
          </ul>
        </div>
        <div
          className="marker"
          style={{
            margin: '14px 0',
            padding: '10px 12px',
            border: '3px dashed var(--red)',
            color: 'var(--red)',
            fontSize: 16,
            transform: 'rotate(.6deg)',
          }}
        >
          ⚠ PLACEHOLDER — the real Cheat Sheet is TBD (design session). Until then, the corrections
          that matter:
        </div>
        <ul style={{ fontSize: 16, lineHeight: 1.5, paddingLeft: 20, margin: 0 }}>
          <li>
            <b>{drawLine(view)}</b>
            {!cfg.firstTurnDraw && (
              <>
                {' '}
                The first player <b>skips the turn-1 draw</b>
                {!cfg.firstTurnBattle ? (
                  <>
                    , and turn 1 has <b>no Battle Phase</b>.
                  </>
                ) : (
                  '.'
                )}
              </>
            )}
            {cfg.firstTurnDraw && !cfg.firstTurnBattle && (
              <>
                {' '}
                Turn 1 has <b>no Battle Phase</b>.
              </>
            )}
          </li>
          {ante && (
            <li>
              <b>{ante}</b>
            </li>
          )}
          <li>
            The game ends <b>only at a failed draw phase</b> — running out of cards mid-turn does
            not end anything.
          </li>
          <li>
            Partial banks score <b>real poker categories</b> (a 2-card KK is a pair and beats a
            4-card ace-high).
          </li>
          <li>
            Poly's blackjack total <b>starts at the target monster's card value</b>; drawn Jokers
            reshuffle; an Ace drawn (or discarded as Q/K fuel) is a 1-or-11 choice at that moment.
          </li>
          <li>
            Jokers are <b>{cfg.jokersBankable ? 'bankable' : 'never bankable'}</b>.
            {cfg.wallPunish && (
              <>
                {' '}
                Wall-punish removal is <b>{WALL_PUNISH_WORDS[cfg.wallPunishSelector]}</b>.
              </>
            )}{' '}
            Bank-trigger removal and wall-punish cards are <b>removed from the game</b> (not
            graveyard).
          </li>
        </ul>
      </div>
    </div>
  );
}
