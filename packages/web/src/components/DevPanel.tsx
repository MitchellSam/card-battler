// DevPanel: seed input + restart, agent picker, AI delay, auto-pass toggle,
// reveal-all toggle, wall-punish selector (config knob for smoke-testing the
// wallPunishPick prompt — the R0 default 'random' never surfaces it).
//
// This file is the ONLY place allowed to read session.debugFullState(), and
// only for the visually-loud reveal-all overlay.

import { useState } from 'react';
import { createRng, type RulesConfig } from '@house-rules/engine';
import { AGENT_NAMES, greedyAgent } from '@house-rules/sim/browser';
import { AI, GameSession, HUMAN } from '../session/GameSession.js';
import { faceOf, faceLabel } from '../ui/cardFace.js';

// Smoke-test helper: let greedy make the human's next decision. Reads ONLY
// humanView() + legal() — the same honesty contract as the AI seat.
const devRng = createRng(0xdecaf);
function decideForMe(session: GameSession): void {
  if (session.isOver() || session.actor() !== HUMAN) return;
  session.dispatch(greedyAgent.choose(session.humanView(), session.legal(), devRng));
}

export interface DevSettings {
  agentName: string;
  aiDelayMs: number;
  autoPass: boolean;
  wallPunishSelector: RulesConfig['wallPunishSelector'];
}

export interface DevPanelProps {
  session: GameSession;
  settings: DevSettings;
  revealAll: boolean;
  onChangeSettings: (s: DevSettings) => void;
  onToggleReveal: (on: boolean) => void;
  onRestart: (seed: number) => void;
}

export function DevPanel({ session, settings, revealAll, onChangeSettings, onToggleReveal, onRestart }: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const [seedText, setSeedText] = useState(String(session.seed));

  if (!open) {
    return (
      <button className="dev-panel" style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
        ⚙ dev · seed {session.seed}
      </button>
    );
  }

  return (
    <>
      <div className="dev-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <b>dev panel</b>
          <button onClick={() => setOpen(false)}>✕</button>
        </div>
        <label>
          seed <input value={seedText} onChange={(e) => setSeedText(e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onRestart(Number(seedText) || Date.now())}>restart</button>
          <button
            onClick={() => {
              const s = Date.now() % 100_000_000;
              setSeedText(String(s));
              onRestart(s);
            }}
          >
            new seed
          </button>
        </div>
        <label>
          agent{' '}
          <select
            value={settings.agentName}
            onChange={(e) => onChangeSettings({ ...settings, agentName: e.target.value })}
          >
            {AGENT_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          AI delay {settings.aiDelayMs}ms{' '}
          <input
            type="range"
            min={0}
            max={2000}
            step={100}
            value={settings.aiDelayMs}
            onChange={(e) => {
              const ms = Number(e.target.value);
              onChangeSettings({ ...settings, aiDelayMs: ms });
              session.setAiDelayMs(ms);
            }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.autoPass}
            onChange={(e) => {
              onChangeSettings({ ...settings, autoPass: e.target.checked });
              session.setAutoPass(e.target.checked);
            }}
          />
          auto-pass when only legal action is pass
        </label>
        <label>
          <input type="checkbox" checked={revealAll} onChange={(e) => onToggleReveal(e.target.checked)} />
          <span style={{ color: revealAll ? 'red' : undefined }}>REVEAL ALL (debug)</span>
        </label>
        <label>
          wall-punish{' '}
          <select
            value={settings.wallPunishSelector}
            onChange={(e) =>
              onChangeSettings({
                ...settings,
                wallPunishSelector: e.target.value as DevSettings['wallPunishSelector'],
              })
            }
          >
            <option value="random">random (R0)</option>
            <option value="defender">defender picks</option>
            <option value="attacker">attacker picks</option>
          </select>
        </label>
        <button onClick={() => decideForMe(session)}>🤖 decide for me (1 decision)</button>
        <div style={{ opacity: 0.7 }}>agent/wall-punish apply on restart</div>
      </div>
      {revealAll && <RevealOverlay session={session} />}
    </>
  );
}

/** The one sanctioned full-state read — loud on purpose. */
function RevealOverlay({ session }: { session: GameSession }) {
  const s = session.debugFullState();
  const ai = s.players[AI];
  const setMonsters = ai.monsters.filter((m) => m !== null && m.position === 'set');
  const setSpells = ai.spellTraps.filter((st) => st !== null);
  const mySetSpells = s.players[0].spellTraps.filter((st) => st !== null);
  return (
    <div className="reveal-overlay">
      <h4>⚠ REVEAL ALL — DEBUG ONLY ⚠</h4>
      <div>
        <b>Riley's hand:</b> {ai.hand.map((c) => faceLabel(faceOf(c))).join(' ') || '(empty)'}
      </div>
      <div>
        <b>Riley's set monsters:</b>{' '}
        {setMonsters.map((m) => faceLabel(faceOf(m!.card))).join(' ') || '(none)'}
      </div>
      <div>
        <b>Riley's set spells:</b>{' '}
        {setSpells.map((st) => faceLabel(faceOf(st!.card))).join(' ') || '(none)'}
      </div>
      <div>
        <b>Your set spells:</b>{' '}
        {mySetSpells.map((st) => faceLabel(faceOf(st!.card))).join(' ') || '(none)'}
      </div>
      <div>
        <b>Deck tops (you / Riley):</b>{' '}
        {s.players[0].deck.slice(0, 3).map((c) => faceLabel(faceOf(c))).join(' ')} /{' '}
        {ai.deck.slice(0, 3).map((c) => faceLabel(faceOf(c))).join(' ')}
      </div>
    </div>
  );
}
