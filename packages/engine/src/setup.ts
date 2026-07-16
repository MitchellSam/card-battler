import { createDeck } from './cards.js';
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

function emptyPlayer(config: RulesConfig, deck: GameCard[]): PlayerState {
  return {
    deck,
    hand: [],
    monsters: Array.from({ length: config.monsterZones }, () => null),
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
    players: [emptyPlayer(config, decks[0]), emptyPlayer(config, decks[1])],
    stack: [],
    priority: firstPlayer,
    passes: 0,
    pendingWindow: null,
    pending: null,
    poly: null,
    normalSummonUsed: false,
    nextUid: 1,
    nextStackId: 1,
    deckOut: false,
    result: null,
  };

  for (const p of [0, 1] as PlayerId[]) {
    const ps = state.players[p];
    const drawn = ps.deck.splice(0, config.startingHand);
    ps.hand.push(...drawn);
    if (options.skipMulligan) ps.mulliganed = true;
    events.push({ type: 'CardsDrawn', player: p, count: drawn.length, cardIds: drawn.map((c) => c.id) });
  }

  events.push({ type: 'GameStarted', firstPlayer });
  if (options.skipMulligan) {
    // First player skips their first draw step, so turn 1 begins immediately.
    events.push({ type: 'TurnStarted', turn: 1, player: firstPlayer });
  }
  return { state, events };
}
