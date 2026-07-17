import { describe, expect, it } from 'vitest';
import { legalActions } from '../src/legal.js';
import { applyAction } from '../src/reducer.js';
import { card, makeState, mon, rng0, run } from './helpers.js';

describe('turn structure', () => {
  it('walks Main 1 → Battle → Main 2 → End, then the opponent draws', () => {
    const s = makeState({ turn: 5, activePlayer: 0 });
    const handBefore = s.players[1].hand.length;
    const r = run(
      s,
      rng0(),
      { type: 'nextPhase', player: 0 }, // → battle (no opposing sets: window auto-closes)
      { type: 'nextPhase', player: 0 }, // → main2
      { type: 'nextPhase', player: 0 }, // → end → turn passes
    );
    expect(r.state.turn).toBe(6);
    expect(r.state.activePlayer).toBe(1);
    expect(r.state.phase).toBe('main1');
    expect(r.state.players[1].hand.length).toBe(handBefore + 2); // drawPerTurn = 2 (M2.5)
  });

  it('enforces the hand limit at end of turn, one discard at a time', () => {
    const hand = ['2', '3', '4', '5', '6', '7', '8', '9'].map((r) =>
      card(0, r as never, '♥'),
    );
    const s = makeState({ phase: 'main2', p0: { hand } });
    let r = applyAction(s, { type: 'nextPhase', player: 0 }, rng0());
    expect(r.state.pending).toEqual({ type: 'discard', player: 0 });
    expect(legalActions(r.state, 1)).toHaveLength(0); // opponent locked out
    r = applyAction(r.state, { type: 'discardCard', player: 0, handIndex: 0 }, rng0());
    expect(r.state.pending).not.toBeNull(); // still 7 > 6
    r = applyAction(r.state, { type: 'discardCard', player: 0, handIndex: 0 }, rng0());
    expect(r.state.pending).toBeNull();
    expect(r.state.turn).toBe(6);
    expect(r.state.players[0].hand).toHaveLength(6);
    expect(r.state.players[0].graveyard).toHaveLength(2);
  });

  it('non-active player has no actions with an empty stack and no window', () => {
    const s = makeState({ activePlayer: 0 });
    expect(legalActions(s, 1)).toHaveLength(0);
    expect(legalActions(s, 0).length).toBeGreaterThan(0);
    expect(() => applyAction(s, { type: 'nextPhase', player: 1 }, rng0())).toThrow();
  });

  it('ends the game on deck-out from the turn draw and scores banks', () => {
    const s = makeState({
      phase: 'main2',
      activePlayer: 0,
      p1: { deck: [card(1, '9', '♦')], bank: [card(1, 'K', '♠')] },
      p0: { bank: [card(0, '5', '♥'), card(0, '5', '♦')] },
    });
    const r = applyAction(s, { type: 'nextPhase', player: 0 }, rng0());
    // p1 drew their last card and the second draw (drawPerTurn 2) came up
    // empty → game over mid-draw. §10 partial scoring: the pair of 5s beats K-high.
    expect(r.state.phase).toBe('gameOver');
    expect(r.state.result?.winner).toBe(0);
    expect(() => applyAction(r.state, { type: 'nextPhase', player: 1 }, rng0())).toThrow();
    expect(legalActions(r.state, 0)).toHaveLength(0);
  });
});
