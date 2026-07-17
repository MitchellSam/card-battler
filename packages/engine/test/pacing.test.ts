// Pacing + game-end knobs: maxTurns (stall valve), drawPerTurn, and the M2.5 §2
// game-end semantics — the game ends ONLY at a draw phase.

import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/reducer.js';
import { card, makeState, mon, resolveStack, rng0, run, types } from './helpers.js';

function endTurn(state: ReturnType<typeof makeState>, player: 0 | 1) {
  return run(
    state,
    rng0(),
    { type: 'nextPhase', player }, // main1 → battle
    { type: 'nextPhase', player }, // battle → main2
    { type: 'nextPhase', player }, // main2 → end (turn rolls over)
  );
}

describe('maxTurns', () => {
  it('ends the game with a stalled showdown when the turn cap is exceeded', () => {
    const s = makeState({ turn: 10, config: { maxTurns: 10 } });
    s.players[0].bank = [{ id: '0:A♠', owner: 0, rank: 'A', suit: '♠', stickerStack: [] }];
    const { state, events } = endTurn(s, 0);
    expect(state.phase).toBe('gameOver');
    expect(state.result?.stalled).toBe(true);
    expect(state.result?.winner).toBe(0); // showdown still scores the banks
    expect(types(events)).toContain('GameStalled');
    const ended = events.find((e) => e.type === 'GameEnded');
    expect(ended?.stalled).toBe(true);
  });

  it('does not trigger before the cap', () => {
    const { state } = endTurn(makeState({ turn: 10, config: { maxTurns: 11 } }), 0);
    expect(state.phase).toBe('main1');
    expect(state.turn).toBe(11);
    expect(state.result).toBeNull();
  });
});

describe('game end: draw phase only (M2.5 §2)', () => {
  it('a draw phase due from an empty deck ends the game with a showdown', () => {
    const s = makeState({ turn: 3, p1: { deck: [] } });
    const { state, events } = endTurn(s, 0); // p1's turn starts; must draw from empty
    expect(state.phase).toBe('gameOver');
    expect(types(events)).toContain('DeckOut');
    expect(state.result?.stalled).toBe(false);
  });

  it('deck emptying mid-draw keeps the drawn card and ends the game on the spot', () => {
    const s = makeState({ turn: 3, config: { drawPerTurn: 2 } });
    s.players[1].deck = [{ id: '1:2♦', owner: 1, rank: '2', suit: '♦', stickerStack: [] }];
    const { state, events } = endTurn(s, 0);
    expect(state.phase).toBe('gameOver');
    expect(state.players[1].hand.map((c) => c.id)).toContain('1:2♦'); // kept
    expect(events.find((e) => e.type === 'CardsDrawn' && e.player === 1)?.count).toBe(1);
  });

  it('drawing your exact last card does NOT end the game; the next due draw does', () => {
    const s = makeState({ turn: 3, config: { drawPerTurn: 1 } });
    s.players[1].deck = [{ id: '1:2♦', owner: 1, rank: '2', suit: '♦', stickerStack: [] }];
    const r1 = endTurn(s, 0); // p1 draws its last card — game alive
    expect(r1.state.phase).toBe('main1');
    const r2 = endTurn(r1.state, 1); // p0 still has cards
    expect(r2.state.phase).toBe('main1');
    const r3 = endTurn(r2.state, 0); // p1 must draw from empty → game over
    expect(r3.state.phase).toBe('gameOver');
  });

  it('an effect draw from an empty deck draws nothing and does not end the game', () => {
    // Joker (draw 2) with 1 card left: partial draw of 1, game continues.
    const s = makeState({
      turn: 3,
      p0: { hand: [card(0, 'JOKER', null)], deck: [card(0, '3', '♣', 'x')] },
    });
    const cast = applyAction(s, { type: 'castJoker', player: 0, handIndex: 0 }, rng0());
    const r = resolveStack(cast.state, rng0());
    expect(r.state.players[0].hand.map((c) => c.id)).toEqual(['0:3♣x']);
    expect(r.state.players[0].deck).toHaveLength(0);
    expect(r.state.phase).not.toBe('gameOver');
  });

  it('a mill that comes up short never ends the game mid-turn', () => {
    // p0 attacks p1's set 5: the 5-flip mills the flip controller's OPPONENT
    // (p0), whose deck holds 1 card — mills 1, game continues.
    const s = makeState({
      phase: 'battle',
      p0: {
        monsters: [mon(card(0, '9', '♠'), 'attack', 1, { summonedTurn: 3 })],
        deck: [card(0, '3', '♣', 'x')],
      },
      p1: { monsters: [mon(card(1, '5', '♦'), 'set', 2)] },
    });
    const atk = applyAction(s, { type: 'declareAttack', player: 0, attackerZone: 0, targetZone: 0 }, rng0());
    const r = resolveStack(atk.state, rng0());
    expect(r.state.players[0].deck).toHaveLength(0);
    expect(r.state.players[0].graveyard.map((c) => c.id)).toContain('0:3♣x');
    expect(r.state.phase).not.toBe('gameOver');
  });
});

describe('drawPerTurn', () => {
  it('draws the configured number of cards at turn start', () => {
    const s = makeState({ turn: 3, config: { drawPerTurn: 2 } });
    const before = s.players[1].deck.length;
    const { state, events } = endTurn(s, 0);
    expect(state.players[1].hand.length).toBe(2);
    expect(state.players[1].deck.length).toBe(before - 2);
    const draw = events.find((e) => e.type === 'CardsDrawn');
    expect(draw?.count).toBe(2);
  });
});
