// Random-playout smoke test: seeded random agents play full 54-card games.
// Asserts: no deadlocks (someone always has a legal action), every enumerated
// legal action applies without throwing, applyAction never mutates its input,
// and every game terminates in a showdown.

import { describe, expect, it } from 'vitest';
import { createDeck } from '../src/cards.js';
import { EFFECT_SPECS, canApplySticker } from '../src/effects.js';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { createRng, shuffle } from '../src/rng.js';
import { serialize } from '../src/serialize.js';
import { setupGame } from '../src/setup.js';
import type { GameCard, PlayerId } from '../src/types.js';
import { viewFor } from '../src/view.js';

describe('random playouts', () => {
  it('completes seeded random games without errors', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const rng = createRng(seed);
      const pick = createRng(seed * 7919);
      let state = setupGame(rng).state;
      let steps = 0;
      while (state.phase !== 'gameOver') {
        if (++steps > 30000) throw new Error(`seed ${seed}: game did not terminate`);
        const acts = [...legalActions(state, 0), ...legalActions(state, 1)];
        expect(acts.length, `seed ${seed} deadlock at step ${steps}`).toBeGreaterThan(0);
        // legalActions is the sole gate: EVERY enumerated action must apply cleanly
        if (steps <= 15) {
          for (const a of acts) {
            expect(
              () => applyAction(state, a, createRng(1)),
              `legal action failed to apply: ${JSON.stringify(a)}`,
            ).not.toThrow();
          }
        }
        const action = acts[pick.int(acts.length)]!;
        const before = steps <= 25 ? serialize(state) : null;
        const r = applyAction(state, action, rng);
        if (before !== null) {
          expect(serialize(state), 'applyAction mutated its input').toBe(before);
        }
        state = r.state;
      }
      expect(state.result).not.toBeNull();
      expect(state.result?.stalled).toBe(false);
      // redacted views still render at game end
      expect(viewFor(state, 0).result).toEqual(state.result);
    }
  }, 60000);

  // M4 A1 crash-prober: same totality guarantee with random LEGAL stickers
  // applied across both decks (framework dispatch, targeting, and pendings all
  // get exercised by the random walk).
  it('completes seeded random games with randomly stickered decks', () => {
    for (let seed = 101; seed <= 106; seed++) {
      const rng = createRng(seed);
      const poolable = EFFECT_SPECS.filter((d) => d.poolable);
      const stickerDeck = (owner: PlayerId): GameCard[] => {
        const deck = createDeck(owner);
        for (const card of deck) {
          if (rng.float() > 0.4) continue; // ~40% of cards get a sticker try
          const legalDefs = poolable.filter((d) => canApplySticker(card, d));
          if (legalDefs.length > 0) card.stickerStack.push(legalDefs[rng.int(legalDefs.length)]!.id);
        }
        return shuffle(deck, rng);
      };
      const pick = createRng(seed * 7919);
      // Random Cheat Sheet suit stickers exercise the per-player suit override path.
      const sheet = (): Partial<Record<'♠' | '♥' | '♣' | '♦', string>> | null => {
        if (rng.float() < 0.5) return null;
        const suits = ['♠', '♥', '♣', '♦'] as const;
        return { [suits[rng.int(4)]!]: poolable[rng.int(poolable.length)]!.id };
      };
      let state = setupGame(rng, {
        decks: [stickerDeck(0), stickerDeck(1)],
        config: { suitOverrides: [sheet(), sheet()] },
      }).state;
      let steps = 0;
      while (state.phase !== 'gameOver') {
        if (++steps > 30000) throw new Error(`seed ${seed}: stickered game did not terminate`);
        const acts = [...legalActions(state, 0), ...legalActions(state, 1)];
        expect(acts.length, `seed ${seed} deadlock at step ${steps}`).toBeGreaterThan(0);
        if (steps <= 15) {
          for (const a of acts) {
            expect(
              () => applyAction(state, a, createRng(1)),
              `legal action failed to apply: ${JSON.stringify(a)}`,
            ).not.toThrow();
          }
        }
        state = applyAction(state, acts[pick.int(acts.length)]!, rng).state;
      }
      expect(state.result).not.toBeNull();
    }
  }, 60000);
});
