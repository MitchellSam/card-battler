// Persistence: versioned blobs round-trip, and a run saved mid-way resumes
// EXACTLY where it left off (rngState checkpoint) — exit criterion 7's
// headless half.

import { describe, expect, it } from 'vitest';
import { applyRun, legalRunActions, newAccount, newRun } from '../src/reducer.js';
import { InMemoryStorage, decodeBlob, encodeBlob } from '../src/storage.js';
import type { RunState } from '../src/types.js';

describe('storage', () => {
  it('account and run blobs round-trip through the interface', async () => {
    const store = new InMemoryStorage();
    expect(await store.loadAccount()).toBeNull();
    expect(await store.loadRun()).toBeNull();

    const account = newAccount();
    const run = newRun(account, 9);
    await store.saveAccount(account);
    await store.saveRun(run);
    expect(await store.loadAccount()).toEqual(account);
    expect(await store.loadRun()).toEqual(run);

    await store.clearRun();
    expect(await store.loadRun()).toBeNull();
    expect(await store.loadAccount()).toEqual(account);

    await store.clear();
    expect(await store.loadAccount()).toBeNull();
  });

  it('rejects blobs from an unknown save version', () => {
    const raw = encodeBlob({ x: 1 }).replace('"version":1', '"version":999');
    expect(() => decodeBlob(raw)).toThrow(/version/);
  });

  it('a mid-run save resumes identically to an uninterrupted run', async () => {
    const walk = (run: RunState, n: number): RunState => {
      for (let i = 0; i < n && run.outcome === 'active'; i++) {
        const legal = legalRunActions(run).filter((a) => a.type !== 'abandonRun');
        if (legal.length === 0) break;
        run = applyRun(run, legal[0]!).run; // deterministic policy: first legal
      }
      return run;
    };

    const uninterrupted = walk(newRun(newAccount(), 21), 30);

    const store = new InMemoryStorage();
    const half = walk(newRun(newAccount(), 21), 15);
    await store.saveRun(half); // reload mid-run…
    const resumed = await store.loadRun();
    const finished = walk(resumed!, 15);

    expect(JSON.stringify(finished)).toBe(JSON.stringify(uninterrupted));
  });
});
