// IndexedDB implementation of the run package's Storage interface (M4 Part B
// persistence). One object store, key-value; blobs go through the run
// package's versioned encode/decode. SQLite (M6, Electron) swaps in behind the
// same interface.

import { decodeBlob, encodeBlob, type Storage } from '@house-rules/run';
import type { Account, RunState } from '@house-rules/run';

const DB_NAME = 'house-rules';
const STORE = 'saves';
const KEY_ACCOUNT = 'account';
const KEY_RUN = 'run';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error('idb get failed'));
    });
  } finally {
    db.close();
  }
}

async function idbPut(key: string, value: string | null): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
      const req = value === null ? store.delete(key) : store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error('idb put failed'));
    });
  } finally {
    db.close();
  }
}

export class IdbStorage implements Storage {
  async loadAccount(): Promise<Account | null> {
    return decodeBlob<Account>(await idbGet(KEY_ACCOUNT));
  }
  async saveAccount(account: Account): Promise<void> {
    await idbPut(KEY_ACCOUNT, encodeBlob(account));
  }
  async loadRun(): Promise<RunState | null> {
    return decodeBlob<RunState>(await idbGet(KEY_RUN));
  }
  async saveRun(run: RunState): Promise<void> {
    await idbPut(KEY_RUN, encodeBlob(run));
  }
  async clearRun(): Promise<void> {
    await idbPut(KEY_RUN, null);
  }
  async clear(): Promise<void> {
    await idbPut(KEY_ACCOUNT, null);
    await idbPut(KEY_RUN, null);
  }
}
