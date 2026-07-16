// Core types for the House Rules base-game engine (M1: Constructed rules, headless).

export type PlayerId = 0 | 1;

export type Suit = '♠' | '♥' | '♣' | '♦';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'JOKER';

export type EffectId = string;

/**
 * A physical card plus its Run-mode modification slots. M1 never populates
 * stickerStack/typeOverride, but every effect lookup goes through
 * effectiveEffect() so M4 slots in without a refactor.
 */
export interface GameCard {
  id: string; // "<owner>:<rank><suit>" — unique across both decks
  owner: PlayerId;
  rank: Rank;
  suit: Suit | null; // null only for JOKER
  stickerStack: EffectId[];
  typeOverride?: 'monster' | 'spell';
}

export type Position = 'attack' | 'set' | 'defense';

export interface TempBuff {
  value: number;
  expiresTurn: number; // cleared when this turn number ends
}

export interface Monster {
  uid: number; // unique per field instance; targets reference uids so replaced monsters fizzle targeting
  card: GameCard;
  position: Position;
  power: number; // permanent base (K debuffs and Poly rewrite this)
  tempSet?: TempBuff; // "power becomes N until end of turn" (Ace flip)
  tempAdds: TempBuff[]; // "+N until end of turn" (Queen)
  summonedTurn: number;
  setTurn?: number; // turn it was set face-down (manual flip is illegal that turn)
  attackedTurn: number; // -1 = never
  posChangedTurn: number; // -1 = never (manual position change once per turn)
}

export interface SetSpell {
  card: GameCard;
  setTurn: number; // activatable only when currentTurn > setTurn
}

export interface PlayerState {
  deck: GameCard[]; // index 0 = top; ordered, hidden
  hand: GameCard[];
  monsters: (Monster | null)[]; // fixed length = config.monsterZones
  spellTraps: (SetSpell | null)[]; // fixed length = config.spellTrapZones
  graveyard: GameCard[]; // public, ordered
  bank: GameCard[]; // public
  removed: GameCard[]; // RULES-GAP: cards "removed" from a bank (bank-trigger removal, wall-punish) go to a removed-from-game zone, not the graveyard — YGO "remove" convention; grave would let Heart revive them, which seems unintended. Flag-free for M1.
  mulliganed: boolean;
}

export type Phase = 'mulligan' | 'main1' | 'battle' | 'main2' | 'end' | 'gameOver';

export type SpellEffectKey =
  | 'J-rank' // destroy any one monster on field
  | 'Q-rank' // discard number card: your monster +value (temp)
  | 'K-rank' // discard number card: opponent monster −value (permanent)
  | 'negate' // ♠: counter any card/effect on the stack
  | 'revive' // ♥: special summon from either graveyard, no flip effect
  | 'snipe' // ♣: destroy one face-down set spell/trap
  | 'poly'; // ♦: Polymerization

export type StackItem =
  | {
      id: number;
      kind: 'spell';
      controller: PlayerId;
      card: GameCard;
      effect: SpellEffectKey;
      targetMonsterUid?: number;
      targetStackItemId?: number;
      targetSTZone?: { player: PlayerId; zoneIndex: number };
      graveTarget?: { player: PlayerId; cardId: string };
      summonPosition?: 'attack' | 'defense';
      amount?: number; // Q/K: value of the discarded number card
    }
  | { id: number; kind: 'joker'; controller: PlayerId; card: GameCard }
  | {
      id: number;
      kind: 'flip';
      controller: PlayerId;
      monsterUid: number;
      effectRank: Rank; // resolved through effectiveEffect at trigger time
      targetMonsterUid?: number; // for 2 / 6
    }
  | {
      id: number;
      kind: 'attack';
      controller: PlayerId;
      attackerUid: number;
      target: number | 'direct'; // monster uid or direct
    }
  | {
      // internal: combat deferred until an attack-triggered flip effect resolves
      id: number;
      kind: 'combat';
      controller: PlayerId;
      attackerUid: number;
      targetUid: number;
    };

/** Omit that distributes over union members (plain Omit collapses a union). */
export type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type Pending =
  | { type: 'discard'; player: PlayerId } // end-phase discard to hand limit, one card at a time
  | { type: 'bankTrigger'; player: PlayerId }
  | { type: 'flipTarget'; player: PlayerId; stackItemId: number; effectRank: '2' | '6' }
  | { type: 'wallPunishPick'; player: PlayerId; attacker: PlayerId }
  | { type: 'polyAce'; player: PlayerId }
  | { type: 'polyHitStand'; player: PlayerId };

export interface PolyState {
  caster: PlayerId;
  targetUid: number;
  total: number;
  dealsRemaining: number; // initial auto-deal counter
  cardIds: string[]; // drawn so far (already moved to caster's graveyard)
}

export interface RulesConfig {
  handLimit: number;
  startingHand: number;
  monsterZones: number;
  spellTrapZones: number;
  wallPunish: boolean;
  wallPunishSelector: 'random' | 'defender' | 'attacker';
  jokersBankable: boolean;
  bankTriggerDeclinable: boolean;
  deckOutTrigger: 'zeroCards' | 'failedDraw';
  tieBreak: 'extendedKickers';
  polyInitialDeal: number;
  queenBuffDuration: 'endOfTurn' | 'permanent';
  mirrorCombat: 'mutualDestroy';
  mulliganStyle: 'shuffle' | 'bottom';
  removalFloor: number; // unused in M1 (Run mode only)
}

export const DEFAULT_CONFIG: RulesConfig = {
  handLimit: 6,
  startingHand: 5,
  monsterZones: 5,
  spellTrapZones: 5,
  wallPunish: true,
  wallPunishSelector: 'random',
  jokersBankable: false,
  bankTriggerDeclinable: true,
  deckOutTrigger: 'zeroCards',
  tieBreak: 'extendedKickers',
  polyInitialDeal: 2,
  queenBuffDuration: 'endOfTurn',
  mirrorCombat: 'mutualDestroy',
  mulliganStyle: 'shuffle',
  removalFloor: 40,
};

export interface HandResult {
  /** -1 = partial (<5 cards); 0..8 = high card .. straight flush */
  category: number;
  name: string;
  cards: GameCard[]; // the best 5 (or all, if partial), sorted desc
}

export interface GameResult {
  winner: PlayerId | 'draw';
  hands: [HandResult, HandResult];
}

export interface GameState {
  config: RulesConfig;
  turn: number; // 1-based; turn 1 belongs to firstPlayer
  firstPlayer: PlayerId;
  activePlayer: PlayerId;
  phase: Phase;
  players: [PlayerState, PlayerState];
  stack: StackItem[];
  priority: PlayerId;
  passes: number; // consecutive priority passes on a non-empty stack
  pendingWindow: { to: 'battle' | 'main2' | 'end' } | null; // opponent response window opened by nextPhase
  pending: Pending | null;
  poly: PolyState | null;
  normalSummonUsed: boolean;
  nextUid: number;
  nextStackId: number;
  deckOut: boolean; // a deck hit 0; game ends once stack/pendings fully resolve
  result: GameResult | null;
}

// ---------------------------------------------------------------------------
// Actions: coarse player intents. The action log + seed reproduces any game.
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'mulligan'; player: PlayerId; discardHandIndices: number[] }
  | {
      type: 'summon';
      player: PlayerId;
      handIndex: number;
      zoneIndex: number;
      mode: 'attack' | 'set';
      sacrificeZoneIndices?: number[];
    }
  | { type: 'setSpell'; player: PlayerId; handIndex: number; zoneIndex: number }
  | { type: 'flipMonster'; player: PlayerId; zoneIndex: number }
  | { type: 'changePosition'; player: PlayerId; zoneIndex: number }
  | {
      type: 'castSpell';
      player: PlayerId;
      source: { from: 'hand'; handIndex: number } | { from: 'zone'; zoneIndex: number };
      mode: 'rank' | 'suit';
      targetMonsterUid?: number;
      targetStackItemId?: number;
      targetSTZone?: { player: PlayerId; zoneIndex: number };
      graveTarget?: { player: PlayerId; cardId: string };
      summonPosition?: 'attack' | 'defense';
      discardHandIndex?: number;
    }
  | { type: 'castJoker'; player: PlayerId; handIndex: number }
  | {
      type: 'declareAttack';
      player: PlayerId;
      attackerZone: number;
      targetZone?: number;
      direct?: boolean;
    }
  | { type: 'nextPhase'; player: PlayerId }
  | { type: 'pass'; player: PlayerId }
  | { type: 'discardCard'; player: PlayerId; handIndex: number }
  | {
      type: 'bankChoice';
      player: PlayerId;
      choice: 'bank' | 'remove' | 'decline';
      handIndex?: number;
      bankIndex?: number;
    }
  | { type: 'chooseFlipTarget'; player: PlayerId; monsterUid: number }
  | { type: 'wallPunishPick'; player: PlayerId; bankIndex: number }
  | { type: 'polyHit'; player: PlayerId }
  | { type: 'polyStand'; player: PlayerId }
  | { type: 'polyAce'; player: PlayerId; value: 1 | 11 };

// ---------------------------------------------------------------------------
// Events: fine-grained outputs for UI animation, logs, and replay rendering.
// ---------------------------------------------------------------------------

export interface GameEvent {
  type:
    | 'GameStarted'
    | 'MulliganTaken'
    | 'TurnStarted'
    | 'TurnEnded'
    | 'PhaseChanged'
    | 'CardsDrawn'
    | 'CardDiscarded'
    | 'CardsMilled'
    | 'MonsterSummoned'
    | 'MonsterSet'
    | 'MonsterSacrificed'
    | 'SpellSet'
    | 'SpellCast'
    | 'SpellActivated'
    | 'JokerCast'
    | 'StackResolved'
    | 'EffectNegated'
    | 'EffectFizzled'
    | 'PriorityPassed'
    | 'AttackDeclared'
    | 'MonsterFlipped'
    | 'FlipTriggered'
    | 'PositionChanged'
    | 'CombatResolved'
    | 'MonsterDestroyed'
    | 'SetCardDestroyed'
    | 'MonsterReturnedToHand'
    | 'MonsterSpecialSummoned'
    | 'WallPunish'
    | 'BankTriggerAwarded'
    | 'BankTriggerSkipped'
    | 'CardBanked'
    | 'BankCardRemoved'
    | 'BankTriggerDeclined'
    | 'HandRevealed'
    | 'PowerChanged'
    | 'PolyStarted'
    | 'PolyCardDrawn'
    | 'PolyBust'
    | 'PolyStand'
    | 'DeckOut'
    | 'GameEnded';
  [key: string]: unknown;
}

export class IllegalActionError extends Error {
  constructor(message: string, public readonly action?: Action) {
    super(message);
    this.name = 'IllegalActionError';
  }
}
