// App: session lifecycle + all interaction wiring. Every affordance below is
// computed by filtering session.legal() (the engine's legalActions) — the UI
// never decides legality on its own. Prompts come from view.pending /
// view.pendingWindow; whose-decision comes from session.actor() (sim's
// actorFor). Zero rules logic lives here.

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { describeEffect, type Action, type GameCard, type PlayerId, type RulesConfig } from '@house-rules/engine';
import {
  applyChoice,
  handOrigins,
  monsterOrigins,
  nextStep,
  stZoneOrigins,
  type Sel,
  type Step,
  type VerbKey,
} from './interact/cascade.js';
import { actionSummary, selfTargetWarning } from './interact/summary.js';
import { AI, GameSession, HUMAN } from './session/GameSession.js';
import { PLAYER_NAMES } from './session/describeEvent.js';
import { faceFromId, faceLabel, faceOf } from './ui/cardFace.js';
import { Board, cellKey, type Cell, type PileId } from './components/Board.js';
import { Card, type Highlight } from './components/Card.js';
import { CheatSheet } from './components/CheatSheet.js';
import { DevPanel, type DevSettings } from './components/DevPanel.js';
import { EndScreen } from './components/EndScreen.js';
import { EventLog } from './components/EventLog.js';
import { PhaseStrip } from './components/PhaseStrip.js';
import { PileModal } from './components/PileModal.js';
import { PromptNote, type NoteButton } from './components/PromptNote.js';
import { StackPanel } from './components/StackPanel.js';

function useStageScale(): number {
  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / 1600, window.innerHeight / 900),
  );
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900));
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return scale;
}

function makeSession(seed: number, s: DevSettings): GameSession {
  // Accumulate a single config override — a second `config` spread would clobber the first.
  const config: Partial<RulesConfig> = {};
  if (s.wallPunishSelector !== 'random') config.wallPunishSelector = s.wallPunishSelector;
  if (s.ante !== 0) config.ante = s.ante;
  return new GameSession(seed, {
    agentName: s.agentName,
    aiDelayMs: s.aiDelayMs,
    autoPass: s.autoPass,
    ...(Object.keys(config).length ? { config } : {}),
  });
}

const DEFAULT_SETTINGS: DevSettings = {
  agentName: 'greedy',
  aiDelayMs: 400,
  autoPass: true,
  wallPunishSelector: 'random',
  ante: 5,
};

export interface DuelScreenProps {
  session: GameSession;
  /** Run mode: cheat-sheet scrawls (sheet mods, boss cheat, curses) shown on this duel. */
  scrawls?: string[];
  /** Overlay rendered when the duel ends (constructed: EndScreen; run: continue note). */
  endOverlay?: React.ReactNode;
  /** Extra chrome (dev panel) rendered inside the stage wrap. */
  extra?: React.ReactNode;
}

/**
 * The duel screen (M3's App, made embeddable for M4 run mode). The session is
 * OWNED by the caller — ConstructedApp for sandbox duels, RunShell for run
 * duels built from a DuelSpec.
 */
export function DuelScreen({ session, scrawls = [], endOverlay = null, extra = null }: DuelScreenProps) {
  const scale = useStageScale();
  const version = useSyncExternalStore(
    useCallback((cb: () => void) => session.subscribe(cb), [session]),
    () => session.version,
  );

  // interaction state
  const [sel, setSel] = useState<Sel | null>(null);
  // Confirm-first: a fully-composed cascade action awaiting an explicit
  // Confirm click (no board action ever fires straight from a click).
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [msel, setMsel] = useState<Set<number>>(new Set()); // mulligan multi-select
  const [peekOrder, setPeekOrder] = useState<number[]>([]); // peekArrange build-up
  const [flipSel, setFlipSel] = useState<number | null>(null); // flipTarget two-phase (target → fuel)
  const [bankSub, setBankSub] = useState<'bank' | 'remove' | null>(null);
  const [pileOpen, setPileOpen] = useState<PileId | null>(null);
  const [cheatOpen, setCheatOpen] = useState(false);

  // Any engine state change invalidates in-flight selections.
  const lastVersion = useRef(version);
  useEffect(() => {
    if (lastVersion.current !== version) {
      lastVersion.current = version;
      setSel(null);
      setConfirm(null);
      setBankSub(null);
      setMsel(new Set());
      setPeekOrder([]);
      setFlipSel(null);
    }
  }, [version]);

  const view = session.humanView();
  const legal = useMemo(() => session.legal(), [session, version]);
  const actor = session.actor();
  const over = session.isOver();

  const dispatch = useCallback(
    (action: Action | undefined) => {
      // Drop clicks that land while the AI still holds the decision point
      // (e.g. clicking KEEP ALL before Riley's mulligan beat resolves) —
      // throwing from an onClick just eats the click and logs an error.
      if (action && !session.isOver() && session.actor() === HUMAN) session.dispatch(action);
    },
    [session],
  );

  // ---- mode -----------------------------------------------------------------
  const pending = view.pending;
  const humanPending = pending && pending.player === HUMAN ? pending : null;
  const mulliganActive = !over && legal.some((a) => a.type === 'mulligan');
  const step: Step | null = sel ? nextStep(legal, sel) : null;

  // ---- helpers over the visible field ---------------------------------------
  const monsterCellByUid = (uid: number): Cell | null => {
    for (const [side, sv] of [['you', view.you], ['opp', view.opponent]] as const) {
      const zone = sv.monsters.findIndex((m) => m !== null && m.uid === uid);
      if (zone >= 0) return side === 'you' ? { t: 'myMonster', zone } : { t: 'oppMonster', zone };
    }
    return null;
  };
  const uidAtCell = (cell: Cell): number | null => {
    if (cell.t === 'myMonster') return view.you.monsters[cell.zone]?.uid ?? null;
    if (cell.t === 'oppMonster') return view.opponent.monsters[cell.zone]?.uid ?? null;
    return null;
  };
  const originCard = (s: Sel): GameCard | null => {
    if (s.origin.kind === 'hand') return view.you.hand?.[s.origin.handIndex] ?? null;
    if (s.origin.kind === 'stZone') return view.you.spellTraps[s.origin.zoneIndex]?.card ?? null;
    return view.you.monsters[s.origin.zoneIndex]?.card ?? null;
  };
  const uidFaceLabel = (uid: number): string => {
    for (const sv of [view.you, view.opponent]) {
      const m = sv.monsters.find((x) => x?.uid === uid);
      if (m?.card) return faceLabel({ rank: m.card.rank, suit: m.card.suit });
    }
    return session.uidName(uid) ?? 'the monster';
  };

  // ---- highlights ------------------------------------------------------------
  const baseHighlights = useMemo(() => {
    const h = new Map<string, Highlight>();
    const put = (c: Cell, v: Highlight) => h.set(cellKey(c), v);
    if (over) return h;

    if (humanPending) {
      switch (humanPending.type) {
        case 'discard':
          for (const a of legal) if (a.type === 'discardCard') put({ t: 'hand', i: a.handIndex }, 'act');
          break;
        case 'bankTrigger':
          if (bankSub === 'bank') {
            for (const a of legal)
              if (a.type === 'bankChoice' && a.choice === 'bank' && a.handIndex !== undefined)
                put({ t: 'hand', i: a.handIndex }, 'act');
          } else if (bankSub === 'remove') {
            for (const a of legal)
              if (a.type === 'bankChoice' && a.choice === 'remove' && a.bankIndex !== undefined)
                put({ t: 'oppBank', i: a.bankIndex }, 'target');
          }
          break;
        case 'flipTarget':
          for (const a of legal)
            if (a.type === 'chooseFlipTarget' && a.monsterUid !== undefined) {
              const c = monsterCellByUid(a.monsterUid);
              if (c) put(c, flipSel === a.monsterUid ? 'sel' : 'target');
            }
          break;
        case 'interceptor':
          for (const a of legal)
            if (a.type === 'chooseInterceptor') {
              const c = monsterCellByUid(a.monsterUid);
              if (c) put(c, 'target');
            }
          break;
        case 'battleReplay':
          for (const a of legal)
            if (a.type === 'replayAttack' && a.targetZone !== undefined)
              put({ t: 'oppMonster', zone: a.targetZone }, 'target');
          break;
        case 'wallPunishPick':
          for (const a of legal)
            if (a.type === 'wallPunishPick')
              put(humanPending.attacker === HUMAN ? { t: 'myBank', i: a.bankIndex } : { t: 'oppBank', i: a.bankIndex }, 'target');
          break;
        // polyAce / polyHitStand: note buttons only
      }
      return h;
    }

    if (mulliganActive) {
      const handLen = view.you.hand?.length ?? 0;
      for (let i = 0; i < handLen; i++) put({ t: 'hand', i }, msel.has(i) ? 'sel' : 'act');
      return h;
    }

    if (sel && step) {
      // origin stays marked
      if (sel.origin.kind === 'hand') put({ t: 'hand', i: sel.origin.handIndex }, 'sel');
      else if (sel.origin.kind === 'monster') put({ t: 'myMonster', zone: sel.origin.zoneIndex }, 'sel');
      else put({ t: 'myST', zone: sel.origin.zoneIndex }, 'sel');
      switch (step.kind) {
        case 'chooseSacrifices':
          for (const z of step.chosen) put({ t: 'myMonster', zone: z }, 'sel');
          for (const z of step.options) put({ t: 'myMonster', zone: z }, 'target');
          break;
        case 'chooseZone':
          for (const z of step.options)
            put(sel.verb === 'setSpell' || (!sel.verb && false) ? { t: 'myST', zone: z } : { t: 'myMonster', zone: z }, 'target');
          break;
        case 'chooseMonsterTarget':
          for (const uid of step.options) {
            const c = monsterCellByUid(uid);
            if (c) put(c, 'target');
          }
          break;
        case 'chooseSTTarget':
          for (const t of step.options)
            put(t.player === HUMAN ? { t: 'myST', zone: t.zoneIndex } : { t: 'oppST', zone: t.zoneIndex }, 'target');
          break;
        case 'chooseDiscard':
          for (const i of step.options) put({ t: 'hand', i }, 'target');
          break;
        case 'chooseAttackTarget':
          for (const o of step.options)
            if (o !== 'direct') put({ t: 'oppMonster', zone: o }, 'target');
          break;
        // chooseVerb / chooseStackTarget / chooseGraveTarget / buttons handled elsewhere
      }
      return h;
    }

    // A parked confirm suppresses idle affordances — only Confirm/Cancel act.
    if (confirm) return h;

    // idle: origin affordances straight from legal()
    for (const i of handOrigins(legal)) put({ t: 'hand', i }, 'act');
    for (const z of monsterOrigins(legal)) put({ t: 'myMonster', zone: z }, 'act');
    for (const z of stZoneOrigins(legal)) put({ t: 'myST', zone: z }, 'act');
    return h;
  }, [legal, humanPending, bankSub, mulliganActive, msel, sel, step, view, over, confirm]);

  // Acting-card highlights: whatever monster the top-of-stack items involve.
  const highlights = useMemo(() => {
    const h = new Map(baseHighlights);
    const markUid = (uid: number) => {
      const c = monsterCellByUid(uid);
      if (c && !h.has(cellKey(c))) h.set(cellKey(c), 'acting');
    };
    for (const item of view.stack) {
      if (item.kind === 'attack') {
        markUid(item.attackerUid);
        if (typeof item.target === 'number') markUid(item.target);
      } else if (item.kind === 'combat') {
        markUid(item.attackerUid);
        markUid(item.targetUid);
      } else if (item.kind === 'flip') {
        markUid(item.monsterUid);
        if (item.targetMonsterUid !== undefined) markUid(item.targetMonsterUid);
      }
    }
    return h;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseHighlights, view.stack]);

  // ---- cascade advance -------------------------------------------------------
  // A finished cascade never dispatches straight away — it parks the action in
  // `confirm` for an explicit Confirm click.
  const choose = useCallback(
    (value: unknown) => {
      if (!sel || !step) return;
      const s2 = applyChoice(sel, step, value);
      const st2 = nextStep(legal, s2);
      if (st2.kind === 'ready') {
        setSel(null);
        setConfirm(st2.action);
      } else if (st2.kind === 'dead') {
        setSel(null);
      } else {
        setSel(s2);
      }
    },
    [sel, step, legal],
  );

  const startCascade = useCallback(
    (origin: Sel['origin']) => {
      const st = nextStep(legal, { origin });
      if (st.kind === 'ready') setConfirm(st.action);
      else if (st.kind !== 'dead') setSel({ origin });
    },
    [legal],
  );

  // ---- cell click routing ------------------------------------------------------
  const onCell = useCallback(
    (cell: Cell) => {
      if (over || confirm) return; // a parked confirm blocks all board clicks
      if (humanPending) {
        switch (humanPending.type) {
          case 'discard':
            if (cell.t === 'hand')
              dispatch(legal.find((a) => a.type === 'discardCard' && a.handIndex === cell.i));
            return;
          case 'bankTrigger':
            if (bankSub === 'bank' && cell.t === 'hand')
              dispatch(legal.find((a) => a.type === 'bankChoice' && a.choice === 'bank' && a.handIndex === cell.i));
            else if (bankSub === 'remove' && cell.t === 'oppBank')
              dispatch(legal.find((a) => a.type === 'bankChoice' && a.choice === 'remove' && a.bankIndex === cell.i));
            return;
          case 'flipTarget': {
            const uid = uidAtCell(cell);
            if (uid === null) return;
            const matches = legal.filter(
              (a) => a.type === 'chooseFlipTarget' && a.monsterUid === uid,
            );
            if (matches.length === 1) dispatch(matches[0]);
            else if (matches.length > 1) setFlipSel(uid); // fuel/param variants → note buttons
            return;
          }
          case 'interceptor': {
            const uid = uidAtCell(cell);
            if (uid !== null)
              dispatch(legal.find((a) => a.type === 'chooseInterceptor' && a.monsterUid === uid));
            return;
          }
          case 'battleReplay':
            if (cell.t === 'oppMonster')
              dispatch(legal.find((a) => a.type === 'replayAttack' && a.targetZone === cell.zone));
            return;
          case 'wallPunishPick':
            if (cell.t === 'myBank' || cell.t === 'oppBank')
              dispatch(legal.find((a) => a.type === 'wallPunishPick' && a.bankIndex === cell.i));
            return;
          default:
            return;
        }
      }
      if (mulliganActive) {
        if (cell.t === 'hand')
          setMsel((prev) => {
            const next = new Set(prev);
            if (next.has(cell.i)) next.delete(cell.i);
            else next.add(cell.i);
            return next;
          });
        return;
      }
      if (sel && step) {
        switch (step.kind) {
          case 'chooseSacrifices':
            if (cell.t === 'myMonster' && step.options.includes(cell.zone)) choose(cell.zone);
            return;
          case 'chooseZone':
            if ((cell.t === 'myMonster' || cell.t === 'myST') && step.options.includes(cell.zone))
              choose(cell.zone);
            return;
          case 'chooseMonsterTarget': {
            const uid = uidAtCell(cell);
            if (uid !== null && step.options.includes(uid)) choose(uid);
            return;
          }
          case 'chooseSTTarget': {
            if (cell.t !== 'myST' && cell.t !== 'oppST') return;
            const target = { player: (cell.t === 'myST' ? HUMAN : AI) as PlayerId, zoneIndex: cell.zone };
            if (step.options.some((o) => o.player === target.player && o.zoneIndex === target.zoneIndex))
              choose(target);
            return;
          }
          case 'chooseDiscard':
            if (cell.t === 'hand' && step.options.includes(cell.i)) choose(cell.i);
            return;
          case 'chooseAttackTarget':
            if (cell.t === 'oppMonster' && step.options.includes(cell.zone)) choose(cell.zone);
            return;
          default:
            return;
        }
      }
      // idle: start a cascade from an origin
      if (cell.t === 'hand' && handOrigins(legal).has(cell.i)) startCascade({ kind: 'hand', handIndex: cell.i });
      else if (cell.t === 'myMonster' && monsterOrigins(legal).has(cell.zone))
        startCascade({ kind: 'monster', zoneIndex: cell.zone });
      else if (cell.t === 'myST' && stZoneOrigins(legal).has(cell.zone))
        startCascade({ kind: 'stZone', zoneIndex: cell.zone });
    },
    [over, confirm, humanPending, bankSub, mulliganActive, sel, step, legal, dispatch, choose, startCascade, view],
  );

  // ---- prompt column content ---------------------------------------------------
  const prompt = buildPrompt();

  function buildPrompt(): React.ReactNode {
    if (over) return null;

    // Confirm-first: a parked action awaits an explicit Confirm click. Every
    // spell/attack routes through here, so this popup is the universal cancel.
    if (confirm) {
      const warn = selfTargetWarning(confirm, view, (uid) => session.uidName(uid));
      return (
        <PromptNote
          title="✔ CONFIRM"
          body={
            <>
              {actionSummary(confirm, view, (uid) => session.uidName(uid))}
              {warn && (
                <div className="marker" style={{ color: 'var(--red)', marginTop: 6 }}>
                  ⚠ {warn}
                </div>
              )}
            </>
          }
          buttons={[
            {
              label: warn ? '⚠ CONFIRM ANYWAY' : 'CONFIRM',
              tone: warn ? 'red' : 'green',
              onClick: () => {
                const a = confirm;
                setConfirm(null);
                dispatch(a);
              },
            },
            { label: '✕ cancel', onClick: () => setConfirm(null) },
          ]}
        />
      );
    }

    if (humanPending) {
      switch (humanPending.type) {
        case 'discard':
          return <PromptNote title="⚡ HAND LIMIT" body="Too many cards — click one to discard." />;
        case 'bankTrigger': {
          const canBank = legal.some((a) => a.type === 'bankChoice' && a.choice === 'bank');
          const canRemove = legal.some((a) => a.type === 'bankChoice' && a.choice === 'remove');
          const canDecline = legal.some((a) => a.type === 'bankChoice' && a.choice === 'decline');
          const buttons: NoteButton[] = [];
          if (canBank)
            buttons.push({ label: bankSub === 'bank' ? '▶ pick a hand card…' : 'BANK A CARD', tone: 'blue', onClick: () => setBankSub('bank') });
          if (canRemove)
            buttons.push({ label: bankSub === 'remove' ? '▶ pick their bank card…' : 'WRECK THEIR BANK', tone: 'red', onClick: () => setBankSub('remove') });
          if (canDecline)
            buttons.push({ label: 'DECLINE', onClick: () => dispatch(legal.find((a) => a.type === 'bankChoice' && a.choice === 'decline')) });
          return (
            <PromptNote
              title="⚡ BANK TRIGGER"
              body={
                <>
                  Bank a card from your hand <b className="marker">OR</b> remove a card from their bank.
                  {humanPending.remaining > 1 && (
                    <>
                      {' '}
                      <b className="marker" style={{ color: 'var(--red)' }}>
                        {humanPending.remaining} left!
                      </b>
                    </>
                  )}
                </>
              }
              buttons={buttons}
            />
          );
        }
        case 'flipDecision':
          return (
            <PromptNote
              title="⚡ FLIP EFFECT?"
              body={`${uidFaceLabel(humanPending.sourceUid)} flipped up — use its "${describeEffect(humanPending.effect).name}" effect?`}
              buttons={[
                {
                  label: 'ACTIVATE',
                  tone: 'green',
                  onClick: () => dispatch(legal.find((a) => a.type === 'flipChoice' && a.choice === 'activate')),
                },
                {
                  label: 'DECLINE',
                  onClick: () => dispatch(legal.find((a) => a.type === 'flipChoice' && a.choice === 'decline')),
                },
              ]}
            />
          );
        case 'flipTarget': {
          // REVISION 2: any effect can be a flip effect — some need fuel or
          // non-monster targets, offered as buttons (cast-style params).
          const opts = legal.filter(
            (a): a is Extract<Action, { type: 'chooseFlipTarget' }> =>
              a.type === 'chooseFlipTarget',
          );
          const label = (a: Extract<Action, { type: 'chooseFlipTarget' }>): string => {
            const parts: string[] = [];
            if (a.targetStackItemId !== undefined) parts.push(`stack #${a.targetStackItemId}`);
            if (a.targetSTZone)
              parts.push(`${a.targetSTZone.player === HUMAN ? 'your' : "Riley's"} S${a.targetSTZone.zoneIndex + 1}`);
            if (a.graveTarget)
              parts.push(`${faceLabel(faceFromId(a.graveTarget.cardId))}${a.summonPosition ? ` (${a.summonPosition})` : ''}`);
            if (a.discardHandIndex !== undefined) {
              const c = view.you.hand?.[a.discardHandIndex];
              parts.push(`discard ${c ? faceLabel(faceOf(c)) : '?'}${a.aceValue ? ` as ${a.aceValue}` : ''}`);
            }
            return parts.join(' · ') || 'resolve';
          };
          const monsterTargeted = opts.some((a) => a.monsterUid !== undefined);
          if (!monsterTargeted) {
            return (
              <PromptNote
                title="⚡ FLIP EFFECT"
                body="Pick how it resolves:"
                buttons={opts.slice(0, 10).map((a, i) => ({
                  label: `${i + 1}. ${label(a)}`,
                  tone: 'blue' as const,
                  onClick: () => dispatch(a),
                }))}
              />
            );
          }
          if (flipSel !== null) {
            const forTarget = opts.filter((a) => a.monsterUid === flipSel);
            return (
              <PromptNote
                title="⚡ FLIP EFFECT — fuel"
                body={`Target ${uidFaceLabel(flipSel)} — pick the cost:`}
                buttons={[
                  ...forTarget.slice(0, 10).map((a, i) => ({
                    label: `${i + 1}. ${label(a)}`,
                    tone: 'blue' as const,
                    onClick: () => dispatch(a),
                  })),
                  { label: '↺ different target', onClick: () => setFlipSel(null) },
                ]}
              />
            );
          }
          return <PromptNote title="⚡ FLIP EFFECT" body="Pick a target monster (highlighted)." />;
        }
        case 'interceptor':
          return <PromptNote title="⚡ INTERCEPT!" body="A monster appeared under the direct attack — pick which of yours intercepts." />;
        case 'battleReplay': {
          const direct = legal.find((a) => a.type === 'replayAttack' && a.direct);
          const buttons: NoteButton[] = [];
          if (direct)
            buttons.push({ label: '💥 ATTACK DIRECTLY', tone: 'red', onClick: () => dispatch(direct) });
          buttons.push({ label: "DON'T ATTACK", onClick: () => dispatch(legal.find((a) => a.type === 'replayDecline')) });
          return (
            <PromptNote
              title="↻ BATTLE REPLAY"
              body={
                direct
                  ? 'Your target was destroyed and their board is now empty — attack directly, or stop.'
                  : 'Your target was destroyed — pick a new monster to attack (highlighted), or stop.'
              }
              buttons={buttons}
            />
          );
        }
        case 'wallPunishPick':
          return <PromptNote title="⚡ WALL PUNISH" body={`Pick which card leaves ${humanPending.attacker === HUMAN ? 'your' : "Riley's"} bank (highlighted).`} />;
        case 'polyAce':
          return (
            <PromptNote
              title="✦ ACE! count it as…"
              buttons={[
                { label: '1', tone: 'blue', onClick: () => dispatch(legal.find((a) => a.type === 'polyAce' && a.value === 1)) },
                { label: '11', tone: 'blue', onClick: () => dispatch(legal.find((a) => a.type === 'polyAce' && a.value === 11)) },
              ]}
            />
          );
        case 'polyHitStand':
          return <PolyNote />;
        case 'peekArrange': {
          // Sticker: Peek — order the peeked cards; first click = new top.
          const deckTop = view.you.deckTop ?? [];
          const done = peekOrder.length === deckTop.length;
          const confirmAction = legal.find(
            (a) =>
              a.type === 'peekArrange' &&
              a.order.length === peekOrder.length &&
              a.order.every((x, i) => x === peekOrder[i]),
          );
          return (
            <PromptNote
              title="👀 PEEK"
              body={
                <>
                  Top of your deck — click cards in the order they should sit (first click = top).
                  <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
                    {deckTop.map((c, i) => {
                      const pos = peekOrder.indexOf(i);
                      return (
                        <div key={c.id} style={{ position: 'relative' }}>
                          <Card
                            rank={c.rank}
                            suit={c.suit}
                            w={44}
                            h={62}
                            highlight={pos >= 0 ? 'sel' : 'act'}
                            onClick={() =>
                              setPeekOrder((prev) => (prev.includes(i) ? prev : [...prev, i]))
                            }
                          />
                          {pos >= 0 && (
                            <span
                              className="marker"
                              style={{ position: 'absolute', top: -8, right: -6, color: 'var(--red)', fontSize: 16 }}
                            >
                              {pos + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              }
              buttons={[
                { label: 'CONFIRM ORDER', tone: 'green', disabled: !done || !confirmAction, onClick: () => dispatch(confirmAction) },
                { label: '↺ reset', onClick: () => setPeekOrder([]) },
              ]}
            />
          );
        }
        case 'needlePick': {
          // Sticker: Needle — their hand is revealed; pick one to discard.
          const oppHand = view.opponent.hand ?? [];
          return (
            <PromptNote
              title="📌 NEEDLE"
              body={
                <>
                  Their whole hand, face-up. Pick one card — they discard it.
                  <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
                    {oppHand.map((c, i) => (
                      <Card
                        key={c.id}
                        rank={c.rank}
                        suit={c.suit}
                        w={44}
                        h={62}
                        highlight="target"
                        onClick={() =>
                          dispatch(legal.find((a) => a.type === 'needlePick' && a.handIndex === i))
                        }
                      />
                    ))}
                  </div>
                </>
              }
            />
          );
        }
      }
    }

    // AI-side pending / waiting
    if (pending && pending.player === AI) {
      if (pending.type === 'polyHitStand' || pending.type === 'polyAce') return <PolyNote />;
      return <PromptNote title="⏳ RILEY IS DECIDING…" body={`(${pending.type})`} />;
    }

    if (mulliganActive) {
      const action = legal.find(
        (a) => a.type === 'mulligan' && sameSet(a.discardHandIndices, msel),
      );
      return (
        <PromptNote
          title="✂ MULLIGAN"
          body="Click cards to shuffle back (redrawn), then confirm."
          buttons={[
            {
              label: msel.size === 0 ? 'KEEP ALL' : `MULLIGAN ${msel.size}`,
              tone: 'green',
              onClick: () => dispatch(action),
              disabled: !action,
            },
          ]}
        />
      );
    }

    if (sel && step) {
      const card = originCard(sel);
      const cancel: NoteButton = { label: '✕ cancel', onClick: () => setSel(null) };
      switch (step.kind) {
        case 'chooseVerb':
          return (
            <PromptNote
              title={card ? `${faceLabel(faceOf(card))} — do what?` : 'do what?'}
              buttons={[
                ...step.verbs.map((v) => ({
                  label: verbLabel(v, card),
                  tone: 'blue' as const,
                  onClick: () => choose(v),
                })),
                cancel,
              ]}
            />
          );
        case 'chooseSacrifices':
          return (
            <PromptNote
              title="🔥 SACRIFICE"
              body={`Pick ${step.required - step.chosen.length} more monster${step.required - step.chosen.length > 1 ? 's' : ''} to sacrifice (highlighted).`}
              buttons={[cancel]}
            />
          );
        case 'chooseZone':
          return <PromptNote title="📍 PLACE IT" body="Pick a highlighted zone." buttons={[cancel]} />;
        case 'chooseMonsterTarget':
          return <PromptNote title="🎯 TARGET" body="Pick a highlighted monster." buttons={[cancel]} />;
        case 'chooseStackTarget':
          return <PromptNote title="🎯 NEGATE WHAT?" body="Pick an item on the stack." buttons={[cancel]} />;
        case 'chooseSTTarget':
          return <PromptNote title="🎯 SNIPE" body="Pick a highlighted set spell/trap." buttons={[cancel]} />;
        case 'chooseGraveTarget':
          return <PromptNote title="🎯 REVIVE" body="Pick a monster from either graveyard (browser open)." buttons={[cancel]} />;
        case 'chooseSummonPosition':
          return (
            <PromptNote
              title="⚔ or 🛡 ?"
              buttons={[
                ...step.options.map((p) => ({
                  label: p === 'attack' ? 'ATTACK position' : 'DEFENSE position',
                  tone: (p === 'attack' ? 'red' : 'blue') as NoteButton['tone'],
                  onClick: () => choose(p),
                })),
                cancel,
              ]}
            />
          );
        case 'chooseDiscard':
          return <PromptNote title="💸 FUEL" body="Discard a number card from your hand (highlighted) to power this." buttons={[cancel]} />;
        case 'chooseAceValue':
          return (
            <PromptNote
              title="✦ ACE FUEL — worth…"
              buttons={[
                ...step.options.map((v) => ({ label: String(v), tone: 'blue' as const, onClick: () => choose(v) })),
                cancel,
              ]}
            />
          );
        case 'chooseAttackTarget':
          return (
            <PromptNote
              title="⚔ ATTACK"
              body="Pick a highlighted monster."
              buttons={[
                ...(step.options.includes('direct')
                  ? [{ label: '💥 ATTACK DIRECTLY', tone: 'red' as const, onClick: () => choose('direct') }]
                  : []),
                cancel,
              ]}
            />
          );
        default:
          return null;
      }
    }

    return null;
  }

  function PolyNote() {
    const poly = view.poly;
    if (!poly) return null;
    const mine = poly.caster === HUMAN;
    const hit = legal.find((a) => a.type === 'polyHit');
    const stand = legal.find((a) => a.type === 'polyStand');
    return (
      <PromptNote
        title={`✦ POLYMERIZATION${mine ? '' : ' (RILEY)'}`}
        body={
          <>
            Blackjack toward 21 — starts at the monster's value. STAND = power ⌈total÷2⌉, BUST = torn up.
            <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
              {poly.cardIds.map((id) => {
                const f = faceFromId(id);
                return <Card key={id} rank={f.rank} suit={f.suit} w={38} h={54} />;
              })}
            </div>
            <span className="marker" style={{ fontSize: 26, color: poly.total > 21 ? 'var(--red)' : poly.total === 21 ? 'var(--green)' : 'var(--ink)' }}>
              TOTAL: {poly.total}
            </span>
          </>
        }
        buttons={
          mine && humanPending?.type === 'polyHitStand'
            ? [
                { label: 'HIT', tone: 'green', onClick: () => dispatch(hit) },
                { label: 'STAND', tone: 'yellow', onClick: () => dispatch(stand) },
              ]
            : []
        }
      />
    );
  }

  // ---- priority / phase buttons ------------------------------------------------
  const passAction = legal.find((a) => a.type === 'pass');
  const nextPhaseAction = legal.find((a) => a.type === 'nextPhase');
  const phaseButtonLabel =
    view.phase === 'main1' ? 'END MAIN ▸' : view.phase === 'battle' ? 'END BATTLE ▸' : 'END TURN ▸';
  const inWindow = view.stack.length > 0 || view.pendingWindow !== null;
  // "Pass" only when there is a live stack to decline responding to; a phase
  // window with an empty stack reads better as "Continue".
  const passLabel = view.stack.length > 0 ? 'PASS' : 'CONTINUE ▸';

  const priorityColumn = over ? null : (
    <div style={{ width: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {actor === AI ? (
        <div
          className={`marker ${session.autoPassing ? '' : 'prio-pulse'}`}
          style={{ fontSize: 17, color: 'var(--cream)', background: 'var(--red)', borderRadius: 5, padding: '8px 16px', textAlign: 'center', boxShadow: '0 3px 6px rgba(0,0,0,.3)' }}
        >
          RILEY'S MOVE
          <div style={{ fontFamily: "'Patrick Hand'", fontSize: 12, opacity: 0.9 }}>thinking…</div>
        </div>
      ) : session.autoPassing ? (
        <div
          className="marker prio-pulse"
          style={{ fontSize: 15, color: '#3a2f14', background: 'var(--yellow)', borderRadius: 5, padding: '8px 16px', textAlign: 'center' }}
        >
          {session.autoPassRespondable
            ? 'auto-passing — hit RESPOND to act'
            : 'nothing to respond with — auto-passing…'}
        </div>
      ) : (
        <div
          className="marker"
          style={{ fontSize: 17, color: 'var(--cream)', background: 'var(--ballpoint)', borderRadius: 5, padding: '8px 16px', textAlign: 'center', boxShadow: '0 3px 6px rgba(0,0,0,.3)' }}
        >
          {inWindow ? 'YOUR WINDOW' : 'YOUR MOVE'}
          {inWindow && (
            <div style={{ fontFamily: "'Patrick Hand'", fontSize: 12, opacity: 0.9 }}>respond or pass</div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        {session.autoPassing && session.autoPassRespondable && (
          <button className="note-btn" onClick={() => session.cancelAutoPass()} style={{ transform: 'rotate(-1deg)' }}>
            ✋ RESPOND
          </button>
        )}
        {passAction && !session.autoPassing && (
          <button className="note-btn" onClick={() => dispatch(passAction)} style={{ transform: 'rotate(1deg)' }}>
            {passLabel}
          </button>
        )}
        {nextPhaseAction && (
          <button className="note-btn green" onClick={() => dispatch(nextPhaseAction)} style={{ transform: 'rotate(-1deg)' }}>
            {phaseButtonLabel}
          </button>
        )}
      </div>
    </div>
  );

  // ---- grave / revive modals -----------------------------------------------------
  const graveStep = step?.kind === 'chooseGraveTarget' ? step : null;
  const pileModal = graveStep ? (
    <PileModal
      title="🎯 REVIVE — pick a monster"
      subtitle="either graveyard works — face-up, no flip effect"
      sections={[
        { title: 'YOUR GRAVEYARD', cards: view.you.graveyard },
        { title: "RILEY'S GRAVEYARD", cards: view.opponent.graveyard },
      ]}
      clickableIds={new Set(graveStep.options.map((o) => o.cardId))}
      onCardClick={(c) => {
        const opt = graveStep.options.find((o) => o.cardId === c.id);
        if (opt) choose(opt);
      }}
      onClose={() => setSel(null)}
    />
  ) : pileOpen ? (
    <PileModal
      title={`${pileOpen.side === 'you' ? 'YOUR' : "RILEY'S"} ${pileOpen.pile === 'graveyard' ? 'GRAVEYARD' : 'REMOVED PILE'}`}
      subtitle={pileOpen.pile === 'graveyard' ? 'discard pile — public, either player can target it ✎' : 'removed from the game — never comes back'}
      sections={[
        {
          title: pileOpen.pile.toUpperCase(),
          cards: (pileOpen.side === 'you' ? view.you : view.opponent)[pileOpen.pile],
        },
      ]}
      onClose={() => setPileOpen(null)}
    />
  ) : null;

  // ---- render --------------------------------------------------------------------
  return (
    <div className="stage-wrap">
      <div className="stage" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <div className="board-col">
          {scrawls.length > 0 && (
            <div
              className="marker"
              style={{ display: 'flex', gap: 18, flexWrap: 'wrap', color: 'var(--red)', fontSize: 14, padding: '2px 8px' }}
              title="today's house rules — also on the Cheat Sheet"
            >
              {scrawls.map((s) => (
                <span key={s} style={{ transform: 'rotate(-0.6deg)' }}>
                  ✎ {s}
                </span>
              ))}
            </div>
          )}
          <PhaseStrip
            turn={view.turn}
            phase={view.phase}
            activePlayer={view.activePlayer}
            normalSummonUsed={view.normalSummonUsed}
            onCheatSheet={() => setCheatOpen(true)}
          />
          <Board
            view={view}
            highlights={highlights}
            onCell={onCell}
            onOpenPile={setPileOpen}
            center={
              <>
                <div style={{ width: 250, display: 'flex', flexDirection: 'column', gap: 10 }}>{prompt}</div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <StackPanel
                    view={view}
                    targetIds={new Set(step?.kind === 'chooseStackTarget' ? step.options : [])}
                    onItemClick={(id) => {
                      if (step?.kind === 'chooseStackTarget' && step.options.includes(id)) choose(id);
                    }}
                  />
                </div>
                {priorityColumn}
              </>
            }
          />
        </div>
        <EventLog events={session.events} resolveUid={(uid) => session.uidName(uid)} />
      </div>

      {pileModal}
      {cheatOpen && <CheatSheet scrawls={scrawls} onClose={() => setCheatOpen(false)} />}
      {view.result && endOverlay}
      {extra}
    </div>
  );
}

/** The M3 sandbox: constructed duel vs the AI, dev panel, rematch loop. */
export function ConstructedApp() {
  const [settings, setSettings] = useState<DevSettings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState(() => makeSession(Date.now() % 100_000_000, DEFAULT_SETTINGS));
  const [revealAll, setRevealAll] = useState(false);
  // Subscribe here too: endOverlay is computed at THIS component's render.
  useSyncExternalStore(
    useCallback((cb: () => void) => session.subscribe(cb), [session]),
    () => session.version,
  );
  // activate() undoes StrictMode's dev-mode mount→cleanup→mount dispose.
  useEffect(() => {
    session.activate();
    return () => session.dispose();
  }, [session]);
  const restart = useCallback(
    (seed: number) => {
      session.dispose();
      setSession(makeSession(seed, settings));
    },
    [session, settings],
  );
  const result = session.humanView().result;
  return (
    <DuelScreen
      session={session}
      endOverlay={
        result ? (
          <EndScreen
            result={result}
            stats={session.stats()}
            seed={session.seed}
            onExportReplay={() => downloadReplay(session)}
            onRematch={() => restart(Date.now() % 100_000_000)}
            onReplaySameSeed={() => restart(session.seed)}
          />
        ) : null
      }
      extra={
        <DevPanel
          session={session}
          settings={settings}
          revealAll={revealAll}
          onChangeSettings={setSettings}
          onToggleReveal={setRevealAll}
          onRestart={restart}
        />
      }
    />
  );
}

function sameSet(xs: number[], set: Set<number>): boolean {
  return xs.length === set.size && xs.every((x) => set.has(x));
}

function verbLabel(v: VerbKey, card: GameCard | null): string {
  switch (v) {
    case 'summon:attack':
      return 'SUMMON — attack position';
    case 'summon:set':
      return 'SET face-down';
    case 'setSpell':
      return 'SET spell/trap';
    case 'cast:rank':
      switch (card?.rank) {
        case 'J':
          return 'CAST rank — DESTROY a monster';
        case 'Q':
          return 'CAST rank — BUFF (discard fuel)';
        case 'K':
          return 'CAST rank — WEAKEN (discard fuel)';
        default:
          return 'CAST — rank effect';
      }
    case 'cast:suit':
      switch (card?.suit) {
        case '♠':
          return 'CAST suit — NEGATE ♠';
        case '♥':
          return 'CAST suit — REVIVE ♥';
        case '♣':
          return 'CAST suit — SNIPE ♣';
        case '♦':
          return 'CAST suit — POLY ♦';
        default:
          return 'CAST — suit effect';
      }
    case 'castJoker':
      return 'CAST Joker — draw 2';
    case 'attack':
      return 'ATTACK ⚔';
    case 'flip':
      return 'FLIP face-up';
    case 'position':
      return 'SWITCH position';
  }
}

function downloadReplay(session: GameSession): void {
  const blob = new Blob([session.exportReplay()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `house-rules-replay-${session.seed}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
