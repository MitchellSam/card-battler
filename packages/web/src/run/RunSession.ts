// RunSession: the run-mode session store (GameSession's sibling, one level
// up). Owns the Account + active RunState + storage; every dispatch goes
// through the run package's pure reducer and is persisted immediately, so a
// reload resumes exactly where the run left off (exit criterion 7).
// Plain TS, no React — components subscribe and render from `run`/`account`.

import {
  applyRun,
  finishRun,
  legalRunActions,
  newAccount,
  newRun,
  type Account,
  type FavorId,
  type RunAction,
  type RunEvent,
  type RunState,
  type Storage,
} from '@house-rules/run';

export class RunSession {
  private readonly storage: Storage;

  account: Account | null = null;
  run: RunState | null = null;
  /** True once the initial storage load has settled. */
  loaded = false;

  readonly runEvents: RunEvent[] = [];
  /** Events from the most recent duelOutcome — the post-duel rewards readout. */
  lastDuelEvents: RunEvent[] | null = null;
  version = 0;
  private readonly listeners = new Set<() => void>();

  constructor(storage: Storage) {
    this.storage = storage;
    void this.load();
  }

  private async load(): Promise<void> {
    const [account, run] = await Promise.all([this.storage.loadAccount(), this.storage.loadRun()]);
    this.account = account ?? newAccount();
    if (!account) await this.storage.saveAccount(this.account);
    this.run = run;
    this.loaded = true;
    this.bump();
  }

  startRun(seed: number, favors: FavorId[] = []): void {
    if (!this.account) throw new Error('account not loaded');
    this.run = newRun(this.account, seed, favors);
    this.runEvents.length = 0;
    void this.storage.saveRun(this.run);
    this.bump();
  }

  legal(): RunAction[] {
    return this.run ? legalRunActions(this.run) : [];
  }

  dispatch(action: RunAction): void {
    if (!this.run) throw new Error('no active run');
    const r = applyRun(this.run, action);
    this.run = r.run;
    this.runEvents.push(...r.events);
    if (action.type === 'duelOutcome') this.lastDuelEvents = r.events;
    void this.storage.saveRun(this.run); // persist every step — reload resumes here
    this.bump();
  }

  dismissDuelRewards(): void {
    this.lastDuelEvents = null;
    this.bump();
  }

  /** Summary acknowledged: merge the finished run into the account. */
  concludeRun(): void {
    if (!this.account || !this.run) throw new Error('nothing to conclude');
    if (this.run.outcome === 'active') throw new Error('run still active');
    this.account = finishRun(this.account, this.run);
    this.run = null;
    this.runEvents.length = 0;
    void this.storage.saveAccount(this.account);
    void this.storage.clearRun();
    this.bump();
  }

  /**
   * DEV PANEL ONLY: clone-mutate-persist escape hatch (jump-to-node, grant
   * currency/sticker). Real flows always go through dispatch().
   */
  devMutate(fn: (run: RunState) => void): void {
    if (!this.run) return;
    const next = structuredClone(this.run);
    fn(next);
    this.run = next;
    void this.storage.saveRun(next);
    this.bump();
  }

  /** Dev panel: wipe everything (account + run). */
  async wipe(): Promise<void> {
    await this.storage.clear();
    this.account = newAccount();
    this.run = null;
    this.runEvents.length = 0;
    await this.storage.saveAccount(this.account);
    this.bump();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private bump(): void {
    this.version++;
    for (const fn of this.listeners) fn();
  }
}
