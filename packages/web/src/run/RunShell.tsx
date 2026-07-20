// RunShell: the M4 run-mode shell. Renders whatever the run reducer's
// pendingChoice demands — map, event, shop, sticker screens, duel, summary —
// and dispatches ONLY actions from legalRunActions (the UI never decides run
// legality on its own; same discipline as the duel screen).

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { describeEffect, getEffectSpec, type Suit } from '@house-rules/engine';
import {
  ECONOMY,
  EVENTS,
  FAVORS,
  PACKS,
  SHEET_MODS,
  favorUnlocked,
  nodeById,
  type BossRewardOption,
  type DuelSpec,
  type FavorId,
  type RunAction,
  type RunState,
} from '@house-rules/run';
import { DuelScreen } from '../App.js';
import { PromptNote, type NoteButton } from '../components/PromptNote.js';
import { GameSession, HUMAN } from '../session/GameSession.js';
import { DeckViewer } from './DeckViewer.js';
import { NodeMapView } from './NodeMap.js';
import type { RunSession } from './RunSession.js';

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

/** Run HUD: strikes ✎, currency ("TBD coin" per canon — do not name it), deck, favors. */
function RunHud({ run, onDeck }: { run: RunState; onDeck: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 22,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 14px',
        flexWrap: 'wrap',
      }}
    >
      <span className="marker" style={{ fontSize: 20, color: 'var(--red)' }} title="strikes — 0 and the run is over">
        {'✎'.repeat(run.strikes)}
        <span style={{ opacity: 0.25 }}>{'✎'.repeat(Math.max(0, 3 - run.strikes))}</span>
      </span>
      <span className="marker" style={{ fontSize: 17 }} title='currency (name TBD — "TBD coin" per canon)'>
        🪙 {run.currency} TBD coin
      </span>
      <button className="note-btn" onClick={onDeck} title="browse your stickered deck">
        🂠 deck ({run.deck.length})
      </button>
      {run.favorsEquipped.map((id) => {
        const f = FAVORS.find((x) => x.id === id);
        return (
          <span key={id} className="gochi" style={{ fontSize: 14 }} title={f?.text}>
            ★ {f?.name ?? id}
          </span>
        );
      })}
      {run.sheetModsActive.map((id) => {
        const m = SHEET_MODS.find((x) => x.id === id);
        return (
          <span key={id} className="gochi" style={{ fontSize: 14, color: 'var(--red)' }} title={m?.scrawl}>
            📃 {m?.name ?? id}
          </span>
        );
      })}
      {(Object.entries(run.sheetStickers) as [string, string][]).map(([suit, effectId]) => (
        <span
          key={suit}
          className="gochi"
          style={{ fontSize: 14, color: 'var(--ballpoint)' }}
          title={`Cheat Sheet sticker: your ${suit} spell is now "${describeEffect(effectId).name}" — ${describeEffect(effectId).text}`}
        >
          📋 {suit}→{describeEffect(effectId).name}
        </span>
      ))}
    </div>
  );
}

function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '18px 16px' }}>
      <div className="marker" style={{ fontSize: 30, color: 'var(--red)', transform: 'rotate(-1deg)', textAlign: 'center' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Account home
// ---------------------------------------------------------------------------

export function AccountHome({
  rs,
  onEnterRun,
  onQuickDuel,
}: {
  rs: RunSession;
  onEnterRun: () => void;
  onQuickDuel: () => void;
}) {
  useSyncExternalStore(
    useCallback((cb: () => void) => rs.subscribe(cb), [rs]),
    () => rs.version,
  );
  const [seedText, setSeedText] = useState('');
  const [loadout, setLoadout] = useState<FavorId[]>([]);
  if (!rs.loaded || !rs.account) return <Screen title="HOUSE RULES">loading…</Screen>;
  const account = rs.account;
  const startRun = () => {
    const seed = seedText.trim() === '' ? Date.now() % 100_000_000 : Number(seedText) >>> 0;
    rs.startRun(seed, loadout);
    onEnterRun();
  };
  const toggleFavor = (id: FavorId) =>
    setLoadout((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < ECONOMY.favorSlots
          ? [...prev, id]
          : prev,
    );
  const unlockHint = (f: (typeof FAVORS)[number]): string =>
    f.unlock.kind === 'runsCompleted'
      ? `finish ${f.unlock.count} run${f.unlock.count > 1 ? 's' : ''}`
      : f.unlock.kind === 'runsWon'
        ? `win ${f.unlock.count} run${f.unlock.count > 1 ? 's' : ''}`
        : `discover ${f.unlock.count} stickers`;
  return (
    <Screen title="HOUSE RULES — MY GAME!!!">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginTop: 20 }}>
        <div className="gochi" style={{ fontSize: 17 }}>
          allowance: <b>{account.allowance} TBD coin</b> · stickers discovered:{' '}
          <b>{account.discoveryPool.length}</b> · runs: <b>{account.runsCompleted}</b> (won{' '}
          {account.runsWon})
        </div>
        {!rs.run && (
          <div className="note" style={{ width: 420 }}>
            <div className="marker" style={{ fontSize: 15, color: 'var(--red)', marginBottom: 6 }}>
              ★ FAVORS — pick up to {ECONOMY.favorSlots} for this run
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FAVORS.map((f) => {
                const owned = account.favorsOwned.includes(f.id) || favorUnlocked(account, f);
                const picked = loadout.includes(f.id);
                return (
                  <div key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', opacity: owned ? 1 : 0.45 }}>
                    <button
                      className={`note-btn ${picked ? 'green' : ''}`}
                      disabled={!owned}
                      onClick={() => toggleFavor(f.id)}
                      style={{ minWidth: 160, textAlign: 'left' }}
                    >
                      {picked ? '✔ ' : ''}★ {f.name}
                    </button>
                    <span className="gochi" style={{ fontSize: 12, lineHeight: 1.2 }}>
                      {owned ? f.text : `🔒 ${unlockHint(f)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {rs.run ? (
          <>
            <button className="note-btn green" style={{ fontSize: 20 }} onClick={onEnterRun}>
              ▶ RESUME RUN (at {rs.run.position ?? 'the start'})
            </button>
            <button
              className="note-btn red"
              onClick={() => {
                rs.dispatch({ type: 'abandonRun' });
              }}
            >
              ✕ abandon the saved run
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="note-btn green" style={{ fontSize: 20 }} onClick={startRun}>
              ✨ NEW RUN
            </button>
            <input
              className="gochi"
              placeholder="seed (optional)"
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              style={{ width: 120, fontSize: 14, padding: '4px 6px' }}
            />
          </div>
        )}
        <button className="note-btn blue" onClick={onQuickDuel}>
          ⚔ QUICK DUEL (constructed sandbox)
        </button>
        <button className="note-btn" style={{ opacity: 0.7 }} onClick={() => void rs.wipe()}>
          🗑 wipe save data
        </button>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Duel embedding
// ---------------------------------------------------------------------------

function RunDuel({ rs, spec }: { rs: RunSession; spec: DuelSpec }) {
  // One do-over (favor): rebuild the session from a salted seed, once.
  const [doOverUsed, setDoOverUsed] = useState(false);
  const seed = doOverUsed ? (spec.duelSeed ^ 0x5f356495) >>> 0 : spec.duelSeed;
  const session = useMemo(
    () =>
      new GameSession(seed, {
        agentName: spec.agentName,
        config: spec.config,
        humanDeck: spec.humanDeck,
      }),
    [seed, spec],
  );
  // activate() undoes StrictMode's dev-mode mount→cleanup→mount dispose.
  useEffect(() => {
    session.activate();
    return () => session.dispose();
  }, [session]);
  const version = useSyncExternalStore(
    useCallback((cb: () => void) => session.subscribe(cb), [session]),
    () => session.version,
  );
  void version;

  const view = session.humanView();
  const result = view.result;
  const finish = (won: boolean, draw: boolean) => {
    const stats = session.stats();
    rs.dispatch({
      type: 'duelOutcome',
      won,
      draw,
      stats: { turns: stats.turns, seconds: Math.round(stats.wallClockMs / 1000) },
    });
  };

  const doOverButton =
    spec.doOver && !doOverUsed && !result && view.phase === 'mulligan' ? (
      <div style={{ position: 'fixed', left: 12, top: 12, zIndex: 40 }}>
        <button className="note-btn yellow" onClick={() => setDoOverUsed(true)} title="Do-Over favor: one full redraw, once per duel">
          ★ DO-OVER (redraw)
        </button>
      </div>
    ) : null;

  const endOverlay = result ? (
    <div className="overlay" style={{ zIndex: 50 }}>
      <div className="paper-modal" style={{ minWidth: 420, textAlign: 'center' }}>
        <div
          className="marker"
          style={{ fontSize: 34, color: result.winner === HUMAN ? 'var(--green)' : 'var(--red)' }}
        >
          {result.winner === 'draw' ? "IT'S A DRAW" : result.winner === HUMAN ? 'YOU WON THE DUEL!' : 'YOU LOST THE DUEL'}
        </div>
        <div className="gochi" style={{ margin: '8px 0 14px' }}>
          {result.winner === HUMAN
            ? 'rewards on the other side →'
            : result.winner === 'draw'
              ? 'no strike, no reward — weird one'
              : 'that costs a strike ✎'}
        </div>
        <button
          className="note-btn green"
          style={{ fontSize: 18 }}
          onClick={() => finish(result.winner === HUMAN, result.winner === 'draw')}
        >
          CONTINUE →
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <DuelScreen session={session} scrawls={spec.scrawls} endOverlay={endOverlay} />
      {doOverButton}
    </>
  );
}

// ---------------------------------------------------------------------------
// Pending screens
// ---------------------------------------------------------------------------

function noteButtons(
  legal: RunAction[],
  make: (a: RunAction) => NoteButton | null,
): NoteButton[] {
  return legal.map(make).filter((b): b is NoteButton => b !== null);
}

function CenteredNote(props: Parameters<typeof PromptNote>[0]) {
  return (
    <div style={{ maxWidth: 420, margin: '30px auto' }}>
      <PromptNote {...props} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dev panel (exit-criterion tooling: full loop testable in minutes)
// ---------------------------------------------------------------------------

function RunDevPanel({ rs }: { rs: RunSession }) {
  const [open, setOpen] = useState(false);
  const [jump, setJump] = useState('');
  const run = rs.run;
  if (!run) return null;
  return (
    <div style={{ position: 'fixed', right: 10, bottom: 10, zIndex: 80 }}>
      {open ? (
        <div className="note" style={{ width: 240 }}>
          <div className="marker" style={{ fontSize: 14, marginBottom: 6 }}>
            🛠 RUN DEV{' '}
            <button className="note-btn" style={{ float: 'right' }} onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <div className="gochi" style={{ fontSize: 12, marginBottom: 6 }}>
            seed {run.runSeed} · pos {run.position ?? '(start)'} · pending{' '}
            {run.pendingChoice?.type ?? '—'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {run.pendingChoice?.type === 'duel' && (
              <>
                <button className="note-btn green" onClick={() => rs.dispatch({ type: 'duelOutcome', won: true })}>
                  force WIN duel
                </button>
                <button className="note-btn red" onClick={() => rs.dispatch({ type: 'duelOutcome', won: false })}>
                  force LOSE duel
                </button>
              </>
            )}
            <button className="note-btn yellow" onClick={() => rs.devMutate((r) => void (r.currency += 50))}>
              +50 TBD coin
            </button>
            <button
              className="note-btn yellow"
              onClick={() =>
                rs.devMutate((r) => {
                  if (r.pendingChoice === null)
                    r.pendingChoice = { type: 'applySticker', effectId: r.discoveryPool[0]! };
                })
              }
            >
              grant a sticker
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                className="gochi"
                placeholder="node id"
                value={jump}
                onChange={(e) => setJump(e.target.value)}
                style={{ width: 110, fontSize: 12 }}
              />
              <button
                className="note-btn"
                onClick={() =>
                  rs.devMutate((r) => {
                    nodeById(r.nodeMap, jump); // throws on typos
                    r.position = jump;
                    r.pendingChoice = null;
                    r.queued = [];
                  })
                }
              >
                jump
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className="note-btn" onClick={() => setOpen(true)}>
          🛠
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The shell
// ---------------------------------------------------------------------------

export function RunShell({ rs, onExit }: { rs: RunSession; onExit: () => void }) {
  useSyncExternalStore(
    useCallback((cb: () => void) => rs.subscribe(cb), [rs]),
    () => rs.version,
  );
  const [deckOpen, setDeckOpen] = useState(false);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const run = rs.run;

  useEffect(() => {
    // Any state change invalidates the two-step move/duplicate selection.
    setMoveFrom(null);
  }, [rs.version]);

  useEffect(() => {
    if (rs.loaded && !rs.run) onExit();
  }, [rs.loaded, rs.run, onExit]);

  if (!run) return null;
  const legal = rs.legal();
  const pending = run.pendingChoice;

  // Summary (win, lose, or abandoned) — exit criterion 1's final screen.
  if (run.outcome !== 'active') {
    const discovered = run.discoveredThisRun;
    return (
      <Screen title={run.outcome === 'won' ? 'RUN COMPLETE!!!' : 'RUN OVER'}>
        <div style={{ maxWidth: 560, margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="gochi" style={{ fontSize: 17, lineHeight: 1.6 }}>
            {run.outcome === 'won' ? 'You beat The Grown-Up.' : 'Three strikes (or you walked).'}
            <br />
            nodes visited: <b>{run.stats.nodesVisited.length}</b> · duels:{' '}
            <b>{run.stats.duels.length}</b> (won {run.stats.duels.filter((d) => d.won).length}) ·
            strikes lost: <b>{run.stats.strikesLost}</b>
            <br />
            stickers applied: <b>{run.stats.stickersApplied}</b> · TBD coin curve:{' '}
            {run.stats.currencyCurve.join(' → ') || '—'}
            <br />
            duel minutes:{' '}
            {run.stats.duels.map((d) => (d.seconds !== undefined ? Math.round(d.seconds / 60) : '?')).join(', ') || '—'}
          </div>
          {run.bossRewardTaken && (
            <div className="gochi">
              boss reward: <b>{JSON.stringify(run.bossRewardTaken)}</b>
            </div>
          )}
          <div className="gochi">
            discoveries carried to your account:{' '}
            {discovered.length > 0 ? (
              discovered.map((id) => <b key={id}> {describeEffect(id).name} </b>)
            ) : (
              <i>none this run</i>
            )}
          </div>
          <button
            className="note-btn"
            onClick={() => {
              const blob = new Blob([JSON.stringify({ runSeed: run.runSeed, outcome: run.outcome, stats: run.stats }, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `house-rules-run-${run.runSeed}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            EXPORT RUN RECORD ⤓
          </button>
          <button
            className="note-btn green"
            style={{ fontSize: 18 }}
            onClick={() => {
              rs.concludeRun();
              onExit();
            }}
          >
            BACK TO MY ROOM →
          </button>
        </div>
      </Screen>
    );
  }

  // Active duel: hand the whole screen to the duel UI.
  if (pending?.type === 'duel') {
    return (
      <>
        <RunDuel rs={rs} spec={pending.spec} />
        <RunDevPanel rs={rs} />
      </>
    );
  }

  const hud = <RunHud run={run} onDeck={() => setDeckOpen(true)} />;
  const deckModal = deckOpen ? (
    <div className="overlay" style={{ zIndex: 70 }} onClick={() => setDeckOpen(false)}>
      <div className="paper-modal" onClick={(e) => e.stopPropagation()} style={{ width: 760 }}>
        <div className="marker" style={{ fontSize: 20, color: 'var(--red)' }}>
          YOUR DECK ({run.deck.length})
          <button className="note-btn" style={{ float: 'right' }} onClick={() => setDeckOpen(false)}>
            close ✕
          </button>
        </div>
        <DeckViewer deck={run.deck} suitOverrides={[run.sheetStickers, null]} />
      </div>
    </div>
  ) : null;

  // Post-duel rewards readout (playtest feedback: winning felt unrewarded
  // because the coin ticked up silently).
  const rewardLines: string[] = [];
  for (const e of rs.lastDuelEvents ?? []) {
    if (e.type === 'DuelWon') rewardLines.unshift('duel WON!');
    if (e.type === 'DuelDrawn') rewardLines.unshift('a draw — no strike, no loot');
    if (e.type === 'DuelLost') rewardLines.unshift('duel lost…');
    if (e.type === 'CurrencyGained') rewardLines.push(`+${String(e.amount)} 🪙 TBD coin`);
    if (e.type === 'EffectDiscovered')
      rewardLines.push(`discovered "${describeEffect(String(e.effectId)).name}" — new in packs!`);
    if (e.type === 'StickerGranted') rewardLines.push('a sticker! (pick & slot it)');
    if (e.type === 'StrikeLost') rewardLines.push('−1 strike ✎');
    if (e.type === 'SecondWindUsed') rewardLines.push('★ Second Wind — no strike lost');
  }
  const rewardsNote =
    rewardLines.length > 0 ? (
      <div style={{ maxWidth: 340, margin: '10px auto 0' }}>
        <PromptNote
          title="🧾 AFTER THE DUEL"
          body={
            <>
              {rewardLines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </>
          }
          buttons={[{ label: 'GOT IT', tone: 'green', onClick: () => rs.dismissDuelRewards() }]}
        />
      </div>
    ) : null;

  let body: React.ReactNode = null;

  if (pending === null) {
    body = (
      <Screen title="THE NEIGHBORHOOD">
        {rewardsNote}
        <div className="gochi" style={{ textAlign: 'center', marginBottom: 4 }}>
          pick your next stop (boss on top)
        </div>
        <NodeMapView
          map={run.nodeMap}
          position={run.position}
          visited={run.stats.nodesVisited}
          onPick={(nodeId) => rs.dispatch({ type: 'pickNode', nodeId })}
        />
      </Screen>
    );
  } else if (pending.type === 'startDuel') {
    const isBoss = pending.encounterId === 'boss';
    body = (
      <Screen title={isBoss ? '👔 THE GROWN-UP' : pending.encounterId === 'elite' ? '💀 ELITE DUEL' : '⚔ DUEL'}>
        <CenteredNote
          title={isBoss ? 'the final table' : 'someone wants to play'}
          body={
            isBoss
              ? 'He has his own rules. They are written on the sheet. They are not fair.'
              : 'Standard house rules (ante 5). Winner banks the glory.'
          }
          buttons={[{ label: '⚔ SHUFFLE UP', tone: 'green', onClick: () => rs.dispatch({ type: 'startDuel' }) }]}
        />
      </Screen>
    );
  } else if (pending.type === 'event') {
    const def = EVENTS.find((e) => e.id === pending.eventId);
    body = (
      <Screen title={`? ${def?.name.toUpperCase() ?? pending.eventId}`}>
        <CenteredNote
          title={def?.name ?? pending.eventId}
          body={def?.text}
          buttons={noteButtons(legal, (a) =>
            a.type === 'eventChoice'
              ? {
                  label: def?.choices.find((c) => c.id === a.choiceId)?.label ?? a.choiceId,
                  tone: 'blue',
                  onClick: () => rs.dispatch(a),
                }
              : null,
          )}
        />
      </Screen>
    );
  } else if (pending.type === 'shop') {
    const packButtons = noteButtons(legal, (a) =>
      a.type === 'buyPack'
        ? {
            label: `${PACKS[a.pack].name} — ${Math.round(PACKS[a.pack].cost * (run.favorsEquipped.includes('pack-rat') ? 1 - ECONOMY.packRatDiscount : 1))} 🪙`,
            tone: 'blue',
            onClick: () => rs.dispatch(a),
          }
        : null,
    );
    const trim = legal.find((a) => a.type === 'buySingle' && a.item === 'trim');
    body = (
      <Screen title="🛒 CORNER STORE">
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          <PromptNote
            title="PACKS"
            body="rip one open — pick 1 of 3 stickers of the pulled tier"
            buttons={packButtons.length ? packButtons : [{ label: '(broke)', onClick: () => {} }]}
          />
          <PromptNote
            title="SINGLES"
            body={`Trim a Card — remove 1 from your deck (floor ${ECONOMY.removalFloor}).`}
            buttons={[
              {
                label: `✂ TRIM — ${ECONOMY.trimCost} 🪙`,
                tone: 'red',
                disabled: !trim,
                onClick: () => trim && rs.dispatch(trim),
              },
            ]}
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button className="note-btn green" onClick={() => rs.dispatch({ type: 'skipShop' })}>
            LEAVE SHOP →
          </button>
        </div>
      </Screen>
    );
  } else if (pending.type === 'applySticker') {
    const d = describeEffect(pending.effectId);
    const clickable = new Set(
      legal.flatMap((a) => (a.type === 'applySticker' && a.cardId !== null ? [a.cardId] : [])),
    );
    const sheetSlots = legal.filter(
      (a): a is Extract<RunAction, { type: 'applySticker' }> =>
        a.type === 'applySticker' && a.sheetSuit !== undefined,
    );
    body = (
      <Screen title="✨ NEW STICKER!">
        <div style={{ textAlign: 'center', margin: '8px 0' }}>
          <span className="marker" style={{ fontSize: 22, background: 'var(--yellow)', padding: '4px 12px', borderRadius: 6, border: '2px solid #2b2b2b' }}>
            {d.name}
          </span>
          <div className="gochi" style={{ marginTop: 6, fontSize: 16 }}>{d.text}</div>
          <div className="gochi" style={{ fontSize: 13, opacity: 0.75 }}>
            stick it on a highlighted card, on the CHEAT SHEET below — or skip and it's gone
          </div>
        </div>
        {sheetSlots.length > 0 && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '6px 0 10px', flexWrap: 'wrap' }}>
            {sheetSlots.map((a) => {
              const suit = a.sheetSuit as Suit;
              const current = run.sheetStickers[suit];
              return (
                <button
                  key={suit}
                  className="note-btn yellow"
                  title={`your ${suit} spell becomes "${d.name}" (replaces ${current ? describeEffect(current).name : describeEffect(`default:${suit}`).name})`}
                  onClick={() => rs.dispatch(a)}
                >
                  📋 CHEAT SHEET {suit}
                  <span className="gochi" style={{ fontSize: 11, display: 'block' }}>
                    now: {current ? describeEffect(current).name : 'printed rule'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <DeckViewer
          deck={run.deck}
          clickableIds={clickable}
          suitOverrides={[run.sheetStickers, null]}
          onCardClick={(c) => rs.dispatch({ type: 'applySticker', cardId: c.id })}
        />
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button className="note-btn red" onClick={() => rs.dispatch({ type: 'applySticker', cardId: null })}>
            skip (forfeit the sticker)
          </button>
        </div>
      </Screen>
    );
  } else if (pending.type === 'pickSticker') {
    body = (
      <Screen title="🎁 PICK ONE">
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {pending.options.map((id) => {
            const d = describeEffect(id);
            const spec = getEffectSpec(id);
            const isNew =
              pending.unlock === true &&
              spec !== undefined &&
              !spec.preDiscovered &&
              !run.discoveryPool.includes(id);
            return (
              <div key={id} style={{ position: 'relative' }}>
                {isNew && (
                  <span
                    className="marker"
                    style={{ position: 'absolute', top: -10, right: -6, zIndex: 2, background: 'var(--red)', color: 'var(--cream)', borderRadius: 5, padding: '1px 8px', fontSize: 13, transform: 'rotate(6deg)' }}
                  >
                    NEW!
                  </span>
                )}
                <PromptNote
                  title={`${d.name}${spec ? ` (${spec.tier})` : ''}`}
                  body={d.text}
                  buttons={[{ label: isNew ? 'TAKE IT (unlocks!)' : 'TAKE IT', tone: 'green', onClick: () => rs.dispatch({ type: 'pickSticker', effectId: id }) }]}
                />
              </div>
            );
          })}
        </div>
      </Screen>
    );
  } else if (pending.type === 'removeCard') {
    const clickable = new Set(legal.flatMap((a) => (a.type === 'pickCard' ? [a.cardId] : [])));
    body = (
      <Screen title={`✂ TRIM ${pending.remaining > 1 ? `(${pending.remaining} to remove)` : ''}`}>
        <div className="gochi" style={{ textAlign: 'center' }}>
          click the card to remove — gone for the whole run
        </div>
        <DeckViewer deck={run.deck} clickableIds={clickable} suitOverrides={[run.sheetStickers, null]} onCardClick={(c) => rs.dispatch({ type: 'pickCard', cardId: c.id })} />
      </Screen>
    );
  } else if (pending.type === 'moveSticker' || pending.type === 'duplicateSticker') {
    const isMove = pending.type === 'moveSticker';
    const pairs = legal.filter((a) => a.type === pending.type) as Extract<
      RunAction,
      { type: 'moveSticker' | 'duplicateSticker' }
    >[];
    const clickable = moveFrom
      ? new Set(pairs.filter((p) => p.fromCardId === moveFrom).map((p) => p.toCardId))
      : new Set(pairs.map((p) => p.fromCardId));
    body = (
      <Screen title={isMove ? '🔁 SWAP MEET' : '📠 DOUBLE DOWN'}>
        <div className="gochi" style={{ textAlign: 'center' }}>
          {moveFrom
            ? 'now pick where it goes'
            : isMove
              ? 'pick the sticker to move (its card)'
              : 'pick the common sticker to copy (its card)'}
        </div>
        <DeckViewer
          deck={run.deck}
          clickableIds={clickable}
          suitOverrides={[run.sheetStickers, null]}
          onCardClick={(c) => {
            if (!moveFrom) setMoveFrom(c.id);
            else rs.dispatch({ type: pending.type, fromCardId: moveFrom, toCardId: c.id });
          }}
        />
        {moveFrom && (
          <div style={{ textAlign: 'center' }}>
            <button className="note-btn" onClick={() => setMoveFrom(null)}>
              ↺ pick a different sticker
            </button>
          </div>
        )}
      </Screen>
    );
  } else if (pending.type === 'bossReward') {
    body = (
      <Screen title="🏆 YOU BEAT HIM — PICK ONE">
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {pending.options.map((o: BossRewardOption, index: number) => {
            const label =
              o.kind === 'sheetMod'
                ? `📃 Sheet mod: ${SHEET_MODS.find((m) => m.id === o.modId)?.name}`
                : o.kind === 'sticker'
                  ? `✨ A ${o.tier} sticker`
                  : `🪙 ${o.amount} TBD coin`;
            const bodyText =
              o.kind === 'sheetMod' ? SHEET_MODS.find((m) => m.id === o.modId)?.scrawl : undefined;
            return (
              <PromptNote
                key={index}
                title={label}
                body={bodyText}
                buttons={[{ label: 'THIS ONE', tone: 'green', onClick: () => rs.dispatch({ type: 'pickReward', index }) }]}
              />
            );
          })}
        </div>
      </Screen>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px' }}>
        <button className="note-btn" onClick={onExit}>
          ← my room
        </button>
        {hud}
        <span />
      </div>
      {body}
      {deckModal}
      <RunDevPanel rs={rs} />
    </div>
  );
}
