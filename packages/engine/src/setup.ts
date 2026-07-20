import { createDeck } from './cards.js';
import { cfgFor } from './config.js';
import { shuffle, type SeededRNG } from './rng.js';
import {
  DEFAULT_CONFIG,
  type GameCard,
  type GameEvent,
  type GameState,
  type PlayerId,
  type PlayerState,
  type RulesConfig,
} from './types.js';

export interface SetupOptions {
  config?: Partial<RulesConfig>;
  /**
   * Test affordance: preset deck orders (index 0 = top, drawn first). When
   * omitted, each player's 54-card deck is built and shuffled with the seeded
   * RNG. Preset decks skip the shuffle so scripted tests are deterministic.
   */
  decks?: [GameCard[], GameCard[]];
  /** Test affordance: fix the first player instead of rolling with the RNG. */
  firstPlayer?: PlayerId;
  /** Test affordance: skip the mulligan phase entirely. */
  skipMulligan?: boolean;
}

/**
 * M2.5 §11 ante: after mulligans, each player moves config.ante cards from the
 * top of their shuffled deck to their PUBLIC bank. Jokers are never bankable:
 * an ante'd Joker is shuffled back and a different card is ante'd.
 */
export function performAnte(state: GameState, rng: SeededRNG, events: GameEvent[]): void {
  for (const p of [0, 1] as PlayerId[]) {
    const ante = cfgFor(state.config, p, 'ante');
    if (ante <= 0) continue;
    const ps = state.players[p];
    for (let i = 0; i < ante; i++) {
      let card = ps.deck.shift();
      while (card && card.rank === 'JOKER') {
        ps.deck.push(card);
        shuffle(ps.deck, rng);
        if (ps.deck.every((c) => c.rank === 'JOKER')) {
          card = undefined;
          break;
        }
        card = ps.deck.shift();
      }
      if (!card) break; // deck exhausted (only reachable with pathological ante values)
      ps.bank.push(card);
      events.push({ type: 'CardBanked', player: p, cardId: card.id, cause: 'ante' });
    }
  }
}

function emptyPlayer(config: RulesConfig, player: PlayerId, deck: GameCard[]): PlayerState {
  return {
    deck,
    hand: [],
    monsters: Array.from({ length: cfgFor(config, player, 'monsterZones') }, () => null),
    spellTraps: Array.from({ length: config.spellTrapZones }, () => null),
    graveyard: [],
    bank: [],
    removed: [],
    mulliganed: false,
  };
}

export function setupGame(
  rng: SeededRNG,
  options: SetupOptions = {},
): { state: GameState; events: GameEvent[] } {
  const config: RulesConfig = { ...DEFAULT_CONFIG, ...options.config };
  const events: GameEvent[] = [];

  const decks: [GameCard[], GameCard[]] = options.decks
    ? [options.decks[0].map((c) => ({ ...c })), options.decks[1].map((c) => ({ ...c }))]
    : [shuffle(createDeck(0), rng), shuffle(createDeck(1), rng)];

  const firstPlayer: PlayerId = options.firstPlayer ?? (rng.int(2) as PlayerId);

  const state: GameState = {
    config,
    turn: 1,
    firstPlayer,
    activePlayer: firstPlayer,
    phase: options.skipMulligan ? 'main1' : 'mulligan',
    players: [emptyPlayer(config, 0, decks[0]), emptyPlayer(config, 1, decks[1])],
    stack: [],
    priority: firstPlayer,
    passes: 0,
    pendingWindow: null,
    pending: null,
    poly: null,
    normalSummonUsed: false,
    nextUid: 1,
    nextStackId: 1,
    result: null,
  };

  for (const p of [0, 1] as PlayerId[]) {
    const ps = state.players[p];
    const drawn = ps.deck.splice(0, cfgFor(config, p, 'startingHand'));
    ps.hand.push(...drawn);
    if (options.skipMulligan) ps.mulliganed = true;
    events.push({ type: 'CardsDrawn', player: p, count: drawn.length, cardIds: drawn.map((c) => c.id) });
  }

  events.push({ type: 'GameStarted', firstPlayer });
  if (options.skipMulligan) {
    performAnte(state, rng, events); // ante happens after mulligans (here: skipped)
    events.push({ type: 'TurnStarted', turn: 1, player: firstPlayer });
    // Canonical: first player skips their turn-1 draw phase. The experiment
    // knob restores it (deck is always deep enough here to draw safely).
    if (config.firstTurnDraw) {
      const ps = state.players[firstPlayer];
      const drawn = ps.deck.splice(0, cfgFor(config, firstPlayer, 'drawPerTurn'));
      ps.hand.push(...drawn);
      if (drawn.length > 0)
        events.push({ type: 'CardsDrawn', player: firstPlayer, count: drawn.length, cardIds: drawn.map((c) => c.id) });
    }
  }
  return { state, events };
}
