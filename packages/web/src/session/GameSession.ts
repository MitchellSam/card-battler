// GameSession: the M3 session store. Owns the full GameState, the engine RNG,
// the AI agent + its RNG, and the action/event logs. Plain TS, no React —
// components subscribe and render exclusively from humanView() + the event
// log; full-state access is confined to this class (and the loud dev-panel
// reveal-all toggle via debugFullState()).
//
// The UI contains ZERO rules logic: every affordance is a filter over legal(),
// every prompt comes from humanView().pending / .pendingWindow, and actorFor
// (from the sim) is the single source of "whose decision point is this".

import {
  applyAction,
  createDeck,
  createRng,
  legalActions,
  setupGame,
  shuffle,
  viewFor,
  type Action,
  type GameCard,
  type GameEvent,
  type GameState,
  type PlayerId,
  type PlayerView,
  type RulesConfig,
  type SeededRNG,
} from '@house-rules/engine';
import { actorFor, agentSeed, getAgent, type Agent } from '@house-rules/sim/browser';

export const HUMAN: PlayerId = 0;
export const AI: PlayerId = 1;

export interface SessionOptions {
  /** Agent for seat 1. Default 'greedy'; dev panel may offer 'random' for smoke-testing. */
  agentName?: string;
  /** Pause between AI actions so events read as beats. 0 = fully synchronous (tests). */
  aiDelayMs?: number;
  /** Auto-dispatch response-window passes (see pump). Pacing lever — dev-panel toggle. */
  autoPass?: boolean;
  /** Visible pulse before a *forced* auto-pass (nothing to respond with). 0 = immediate (tests). */
  autoPassDelayMs?: number;
  /**
   * Pulse before an *interruptible* auto-pass — a response window where the
   * human COULD activate a set card but usually just wants to pass. Longer than
   * autoPassDelayMs so there's time to hit RESPOND. 0 disables interruptible
   * auto-pass (so tests keep the old only-pass-auto-passes behaviour).
   */
  autoPassRespondMs?: number;
  /** Dev-panel-only config overrides (e.g. wallPunishSelector for smoke-testing the pick prompt). */
  config?: Partial<RulesConfig>;
  /**
   * Run mode (M4): the human's stickered run deck (seat 0). Both it and the
   * AI's stock deck are shuffled with the session's engine RNG, so a duelSeed
   * fully determines the deal — exactly like the headless full-run test.
   */
  humanDeck?: GameCard[];
}

export interface SessionStats {
  wallClockMs: number;
  turns: number;
  humanDecisions: number;
  /** Clock runs only while actorFor() === HUMAN — AI delay never pollutes it. */
  meanHumanMsPerDecision: number | null;
}

export interface Replay {
  engineSeed: number;
  agentSeed: number;
  agentName: string;
  config: RulesConfig;
  actionLog: Action[];
  stats: SessionStats;
}

export class GameSession {
  readonly seed: number;
  readonly agentName: string;

  private state: GameState;
  private readonly engineRng: SeededRNG;
  private readonly agent: Agent;
  private readonly agentRng: SeededRNG;
  private readonly now: () => number;

  readonly events: GameEvent[] = [];
  readonly actionLog: Action[] = [];

  /** uid → card face ("7♠") once that monster's identity is public to the human. */
  private readonly uidFace = new Map<number, string>();

  /** Monotonic change counter for useSyncExternalStore snapshots. */
  version = 0;
  /** true while an auto-pass timer is pending — UI pulses the priority marker. */
  autoPassing = false;
  /** True while the pending auto-pass is interruptible — the UI shows RESPOND. */
  autoPassRespondable = false;

  private aiDelayMs: number;
  private autoPassEnabled: boolean;
  private readonly autoPassDelayMs: number;
  private readonly autoPassRespondMs: number;
  /** Set when the human hits RESPOND; suppresses auto-pass for the current window only. */
  private autoPassSuppressed = false;

  private readonly startedAt: number;
  private endedAt: number | null = null;
  private humanDecisions = 0;
  private humanThinkMs = 0;
  private thinkStart: number | null = null;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private readonly listeners = new Set<() => void>();

  constructor(seed: number, opts: SessionOptions = {}, now: () => number = Date.now) {
    this.seed = seed;
    this.agentName = opts.agentName ?? 'greedy';
    this.aiDelayMs = opts.aiDelayMs ?? 400;
    this.autoPassEnabled = opts.autoPass ?? true;
    this.autoPassDelayMs = opts.autoPassDelayMs ?? 600;
    this.autoPassRespondMs = opts.autoPassRespondMs ?? 3000;
    this.now = now;

    this.engineRng = createRng(seed);
    this.agent = getAgent(this.agentName);
    this.agentRng = createRng(agentSeed(seed, AI));

    const setup = setupGame(this.engineRng, {
      ...(opts.config ? { config: opts.config } : {}),
      ...(opts.humanDeck
        ? {
            decks: [
              shuffle(structuredClone(opts.humanDeck), this.engineRng),
              shuffle(createDeck(AI), this.engineRng),
            ] as [GameCard[], GameCard[]],
          }
        : {}),
    });
    this.state = setup.state;
    this.events.push(...setup.events);
    this.startedAt = now();
    this.pump();
  }

  // --- reads ---------------------------------------------------------------

  humanView(): PlayerView {
    return viewFor(this.state, HUMAN);
  }

  legal(): Action[] {
    return legalActions(this.state, HUMAN);
  }

  /** Whose decision point is it (sim's actorFor — never re-derived in the UI). */
  actor(): PlayerId {
    return actorFor(this.state);
  }

  isOver(): boolean {
    return this.state.phase === 'gameOver';
  }

  /**
   * DEV PANEL ONLY. The one sanctioned full-state escape hatch, for the
   * visually-loud reveal-all toggle. Board components must never touch this.
   */
  debugFullState(): GameState {
    return this.state;
  }

  stats(): SessionStats {
    return {
      wallClockMs: (this.endedAt ?? this.now()) - this.startedAt,
      turns: this.state.turn,
      humanDecisions: this.humanDecisions,
      meanHumanMsPerDecision:
        this.humanDecisions > 0 ? this.humanThinkMs / this.humanDecisions : null,
    };
  }

  exportReplay(): string {
    const replay: Replay = {
      engineSeed: this.seed,
      agentSeed: agentSeed(this.seed, AI),
      agentName: this.agentName,
      config: this.state.config,
      actionLog: this.actionLog,
      stats: this.stats(),
    };
    return JSON.stringify(replay, null, 2);
  }

  // --- writes --------------------------------------------------------------

  /** Human action entry point. Throws if it is not the human's decision point. */
  dispatch(action: Action): void {
    if (this.disposed) throw new Error('session disposed');
    if (this.isOver()) throw new Error('game is over');
    if (actorFor(this.state) !== HUMAN) throw new Error('not your decision point');
    // A human action supersedes a scheduled auto-pass — cancel it or its stale
    // pass would fire after the state has moved on.
    if (this.autoPassing) {
      this.clearTimer();
      this.autoPassing = false;
      this.autoPassRespondable = false;
    }
    if (this.thinkStart !== null) {
      this.humanThinkMs += this.now() - this.thinkStart;
      this.thinkStart = null;
    }
    this.humanDecisions++;
    this.apply(action);
    this.pump();
  }

  getAiDelayMs(): number {
    return this.aiDelayMs;
  }

  setAiDelayMs(ms: number): void {
    this.aiDelayMs = ms;
    this.notify();
  }

  getAutoPass(): boolean {
    return this.autoPassEnabled;
  }

  setAutoPass(on: boolean): void {
    this.autoPassEnabled = on;
    if (!on && this.autoPassing) {
      // Cancel the pending auto-pass and hand the decision back to the human.
      this.clearTimer();
      this.autoPassing = false;
    }
    this.pump();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  dispose(): void {
    this.disposed = true;
    this.clearTimer();
    this.listeners.clear();
  }

  /**
   * Re-arm a disposed session and resume driving it. React StrictMode (dev)
   * runs every effect's cleanup+setup TWICE on mount, so an owner's
   * `return () => session.dispose()` kills the session right after the first
   * mount — every click then throws 'session disposed' and the AI timer never
   * fires. Owners must call activate() in the effect setup to undo it.
   */
  activate(): void {
    if (!this.disposed) return;
    this.disposed = false;
    this.pump();
  }

  // --- internals -----------------------------------------------------------

  /** Human-readable card face for a monster uid, if its identity is public. */
  uidName(uid: number): string | null {
    return this.uidFace.get(uid) ?? null;
  }

  private apply(action: Action): void {
    const r = applyAction(this.state, action, this.engineRng);
    this.state = r.state;
    this.events.push(...r.events);
    this.actionLog.push(action);
    this.recordIdentities(r.events);
    this.autoPassSuppressed = false; // new state → a fresh window may auto-pass again
    this.version++;
  }

  /**
   * RESPOND: the human wants to act in a window that was about to auto-pass.
   * Cancels the pending auto-pass and suppresses it for THIS window only (until
   * the next state change), handing a real decision point back.
   */
  cancelAutoPass(): void {
    this.clearTimer();
    this.autoPassing = false;
    this.autoPassRespondable = false;
    this.autoPassSuppressed = true;
    if (this.thinkStart === null) this.thinkStart = this.now();
    this.notify();
  }

  /** Track uid→face for events that reveal a monster's identity to the human. */
  private recordIdentities(events: GameEvent[]): void {
    for (const e of events) {
      const uid = e.uid as number | undefined;
      const cardId = e.cardId as string | undefined;
      if (uid === undefined || cardId === undefined) continue;
      // A face-down set is public only if it is the human's own.
      if (e.type === 'MonsterSet' && e.player !== HUMAN) continue;
      const face = cardId.slice(cardId.indexOf(':') + 1);
      this.uidFace.set(uid, face.startsWith('JOKER') ? 'Joker' : face);
    }
  }

  /**
   * Drive the session until it needs a real human decision (or ends). AI moves
   * and auto-passes are paced with timers when the delays are > 0 so each
   * state change renders as a beat.
   */
  private pump(): void {
    if (this.disposed) return;
    if (this.timer !== null) {
      // A beat is already scheduled; it will re-pump when it fires.
      this.notify();
      return;
    }
    while (this.state.phase !== 'gameOver') {
      if (actorFor(this.state) === AI) {
        if (this.aiDelayMs > 0) {
          this.schedule(this.aiDelayMs, () => this.stepAI());
          return;
        }
        this.stepAI();
        continue;
      }
      const legal = this.legal();
      const kind = this.autoPassEnabled && !this.autoPassSuppressed ? autoPassKind(legal) : 'none';
      // 'forced' = pass is the only option (nothing to respond with) → quick pulse.
      // 'optional' = a response window where the human COULD activate a set card
      // but usually just wants to pass → longer, interruptible pulse with RESPOND.
      // Interruptible auto-pass only runs in real time (delay > 0), so headless
      // tests keep the original "only pass auto-passes" behaviour.
      const doForced = kind === 'forced';
      // Interruptible auto-pass is a real-time UX beat (needs time to hit
      // RESPOND); autoPassDelayMs === 0 is synchronous/test mode, where it's off.
      const doOptional =
        kind === 'optional' && this.autoPassRespondMs > 0 && this.autoPassDelayMs > 0;
      if (doForced || doOptional) {
        this.thinkStart = null; // not a human decision — never bill it to the think clock
        const delay = doOptional ? this.autoPassRespondMs : this.autoPassDelayMs;
        if (delay > 0) {
          this.autoPassing = true;
          this.autoPassRespondable = doOptional;
          this.version++;
          this.schedule(delay, () => {
            this.autoPassing = false;
            this.autoPassRespondable = false;
            // Revalidate at fire time — never apply a stale captured action.
            const fresh = this.legal();
            if (
              actorFor(this.state) === HUMAN &&
              !this.autoPassSuppressed &&
              autoPassKind(fresh) !== 'none'
            )
              this.apply({ type: 'pass', player: HUMAN });
          });
          return;
        }
        this.apply({ type: 'pass', player: HUMAN });
        continue;
      }
      // A real human decision point: start the think clock.
      if (this.thinkStart === null) this.thinkStart = this.now();
      break;
    }
    if (this.state.phase === 'gameOver' && this.endedAt === null) {
      this.endedAt = this.now();
      this.thinkStart = null;
      this.version++;
    }
    this.notify();
  }

  private stepAI(): void {
    const legal = legalActions(this.state, AI);
    if (legal.length === 0) throw new Error('deadlock: no legal action for the AI'); // engine bug — file it
    const action = this.agent.choose(viewFor(this.state, AI), legal, this.agentRng);
    this.apply(action);
  }

  private schedule(ms: number, fn: () => void): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.disposed) return;
      fn();
      this.pump();
    }, ms);
    this.notify();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }
}

/**
 * Classify a human decision point for auto-pass. `pass` is only ever legal in a
 * response/priority window (never on your own empty-stack main phase), so its
 * presence marks a window:
 *   - 'forced'   → pass is the only option (nothing to respond with).
 *   - 'optional' → pass plus set-card activations you *could* use but usually
 *                  won't (a single set trap otherwise disables auto-pass for the
 *                  whole rest of the game — the main source of pass ceremony).
 *   - 'none'     → a real decision (summon / attack / phase advance / pending).
 */
export function autoPassKind(legal: Action[]): 'forced' | 'optional' | 'none' {
  if (!legal.some((a) => a.type === 'pass')) return 'none';
  const others = legal.filter((a) => a.type !== 'pass');
  if (others.length === 0) return 'forced';
  // In a pass window the only non-pass options are set-card activations; guard
  // anyway so a future response action can't get silently auto-passed away.
  if (others.every((a) => a.type === 'castSpell' && a.source.from === 'zone')) return 'optional';
  return 'none';
}
