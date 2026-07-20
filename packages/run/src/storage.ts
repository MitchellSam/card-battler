// Persistence (Part B): one interface, swappable backends. IndexedDB in the
// web shell, in-memory for tests; SQLite arrives with Electron (M6) behind the
// same interface. Blobs are versioned so later migrations have a hook.

import type { Account, RunState } from './types.js';

export interface Storage {
  loadAccount(): Promise<Account | null>;
  saveAccount(account: Account): Promise<void>;
  /** The resumable mid-run state; null when no run is in progress. */
  loadRun(): Promise<RunState | null>;
  saveRun(run: RunState): Promise<void>;
  clearRun(): Promise<void>;
  clear(): Promise<void>;
}

interface Blob<T> {
  version: number;
  data: T;
}

export const STORAGE_VERSION = 1;

export function encodeBlob<T>(data: T): string {
  return JSON.stringify({ version: STORAGE_VERSION, data } satisfies Blob<T>);
}

export function decodeBlob<T>(raw: string | null): T | null {
  if (raw === null) return null;
  const parsed = JSON.parse(raw) as Blob<T>;
  if (typeof parsed !== 'object' || parsed === null || typeof parsed.version !== 'number')
    throw new Error('corrupt save blob');
  if (parsed.version !== STORAGE_VERSION)
    throw new Error(`unsupported save version ${parsed.version}`);
  return parsed.data;
}

/** Test / headless backend. Round-trips through JSON like a real store would. */
export class InMemoryStorage implements Storage {
  private account: string | null = null;
  private run: string | null = null;

  loadAccount(): Promise<Account | null> {
    return Promise.resolve(decodeBlob<Account>(this.account));
  }
  saveAccount(account: Account): Promise<void> {
    this.account = encodeBlob(account);
    return Promise.resolve();
  }
  loadRun(): Promise<RunState | null> {
    return Promise.resolve(decodeBlob<RunState>(this.run));
  }
  saveRun(run: RunState): Promise<void> {
    this.run = encodeBlob(run);
    return Promise.resolve();
  }
  clearRun(): Promise<void> {
    this.run = null;
    return Promise.resolve();
  }
  clear(): Promise<void> {
    this.account = null;
    this.run = null;
    return Promise.resolve();
  }
}
