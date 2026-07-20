// @house-rules/run — types for the roguelite run layer (M4 Part B).
// Same discipline as the engine: event-sourced reducer, zero unseeded
// randomness, serializable, testable without a browser. A run is deterministic
// from runSeed + the action log + duel outcomes.

import type {
  EffectId,
  EffectTier,
  GameCard,
  PerPlayerFields,
  RulesConfig,
  Suit,
} from '@house-rules/engine';

export type SheetModId = string;
export type FavorId = string;
export type EventId = string;
export type PackId = 'cornerStore' | 'tradeBinder';

/** The human's run deck cards. Owner is always seat 0 in every duel. */
export type RunCard = GameCard;

// ---------------------------------------------------------------------------
// Node map
// ---------------------------------------------------------------------------

export type NodeType = 'duel' | 'event' | 'shop' | 'elite' | 'treasure' | 'boss';

export interface MapNode {
  id: string; // "n<col>-<idx>"; the boss is "boss"
  column: number; // 0-based; boss sits at column === NodeMap.columns
  index: number; // row within its column (drawing order)
  type: NodeType;
  next: string[]; // edges into the following column (boss has none)
  eventId?: EventId; // present iff type === 'event'
  encounterId?: string; // present iff type is duel/elite/boss
}

export interface NodeMap {
  columns: number; // pre-boss column count
  nodes: MapNode[];
}

// ---------------------------------------------------------------------------
// Content data shapes (ALL content ships as data — review criterion #5)
// ---------------------------------------------------------------------------

export interface SheetModDef {
  id: SheetModId;
  name: string;
  scrawl: string; // Cheat Sheet line
  patch: Partial<RulesConfig>; // exactly one field per the recommendations
}

/**
 * REVISION 2: favors are BETWEEN-RUN progression. They unlock from account
 * milestones and are equipped as a ≤2-slot loadout at run start — never bought
 * mid-run.
 */
export interface FavorUnlock {
  kind: 'runsCompleted' | 'runsWon' | 'discoveries';
  count: number;
}

export interface FavorDef {
  id: FavorId;
  name: string;
  text: string;
  unlock: FavorUnlock;
}

export interface EncounterDef {
  id: string;
  name: string;
  agentName: string; // every M4 node runs 'greedy' (spec §5)
  /** Seat-1 (AI) per-player cheat — VISIBLE via the engine overlay. */
  aiOverrides?: Partial<PerPlayerFields>;
  /** Seat-0 (human) override — event handicaps. */
  humanOverrides?: Partial<PerPlayerFields>;
  scrawl?: string; // cheat-sheet line for the cheat (boss)
  rewardCurrency: number;
  /**
   * REVISION 2: every win offers a pick-1-of-`count` sticker choice rolled
   * with these tier weights, drawn from ALL implemented effects — undiscovered
   * options flagged NEW; picking one unlocks it (THE discovery channel).
   */
  rewardPick: { count: number; weights: Record<EffectTier, number> };
}

export type EventOutcome =
  | { kind: 'gainCurrency'; amount: number }
  | { kind: 'loseCurrency'; amount: number }
  | { kind: 'grantSticker'; tier: EffectTier } // random discovered effect of (graced) tier
  | { kind: 'grantPack'; pack: PackId } // a free pack, opened now
  | { kind: 'pickSticker'; count: number } // shown N discovered options, pick 1
  | { kind: 'removeCard'; count: number } // trim, floor-enforced
  | { kind: 'restoreStrike'; amount: number }
  | { kind: 'moveSticker' } // Swap Meet re-slot
  | { kind: 'duplicateSticker' } // Double Down (commons only)
  | { kind: 'eliteDuel'; encounterId: string } // The Bully / Rival Riley
  | { kind: 'tempMod'; patch: Partial<RulesConfig>; label: string } // one-duel curse
  | { kind: 'random'; chance: number; win: EventOutcome[]; lose: EventOutcome[] };

/** Declarative choice gates — a closed set, NOT a scripting language. */
export type EventRequirement =
  | 'strikesBelowMax'
  | 'hasAnySticker'
  | 'hasCommonSticker'
  | 'deckAboveFloor';

export interface EventChoice {
  id: string;
  label: string;
  cost?: number; // currency, paid on choice
  requires?: EventRequirement[];
  outcomes: EventOutcome[];
}

export interface EventDef {
  id: EventId;
  name: string;
  text: string; // sticky-note body
  choices: EventChoice[];
}

export interface PackDef {
  id: PackId;
  name: string;
  cost: number;
  /** Tier weights for one pull; resolved through grace degradation. */
  weights: Record<EffectTier, number>;
  /** 'best-available': the pull is forced to the best discovered+implemented tier. */
  guarantee?: 'best-available';
  /** A pull offers pick-1-of-this-many stickers of the rolled tier (min 1). */
  choices: number;
  /** Copies buyable per shop visit; absent = unlimited. */
  stockPerVisit?: number;
}

// ---------------------------------------------------------------------------
// Run state
// ---------------------------------------------------------------------------

export interface DuelStats {
  turns?: number;
  seconds?: number; // wall-clock, supplied by the shell (reducer stays pure)
}

export interface DuelSpec {
  config: RulesConfig; // RUN_CONFIG + sheet mods + temp mods + encounter overrides
  humanDeck: RunCard[]; // the stickered run deck (seat 0)
  agentName: string;
  duelSeed: number; // derived from runSeed + nodeId: whole runs replay deterministically
  nodeId: string;
  encounterId: string;
  scrawls: string[]; // cheat-sheet lines (sheet mods, boss cheat, temp mods)
  doOver: boolean; // do-over favor: one pre-duel redraw available to the shell
}

export type BossRewardOption =
  | { kind: 'sheetMod'; modId: SheetModId }
  | { kind: 'sticker'; tier: EffectTier }
  | { kind: 'currency'; amount: number };

export type RunPending =
  | { type: 'startDuel'; nodeId: string; encounterId: string } // shell confirms, spec is built
  | { type: 'duel'; spec: DuelSpec } // shell plays the duel, feeds back duelOutcome
  | { type: 'event'; nodeId: string; eventId: EventId }
  | { type: 'shop'; nodeId: string; bought: string[] } // per-visit stock keys already sold
  // Pick a legal deck card OR a Cheat Sheet suit slot, or skip (forfeit).
  | { type: 'applySticker'; effectId: EffectId }
  // Pick 1 of N. `unlock` (win rewards): an undiscovered pick joins the pool.
  | { type: 'pickSticker'; options: EffectId[]; unlock?: boolean }
  | { type: 'removeCard'; remaining: number } // trim (floor-enforced)
  | { type: 'moveSticker' } // Swap Meet
  | { type: 'duplicateSticker' } // Double Down
  | { type: 'bossReward'; options: BossRewardOption[] };

export interface StickerApplication {
  effectId: EffectId;
  cardId: string;
}

export interface RunStats {
  nodesVisited: string[];
  duels: { nodeId: string; encounterId: string; won: boolean; turns?: number; seconds?: number }[];
  /** Currency sampled after every resolved node — the instrumentation curve. */
  currencyCurve: number[];
  strikesLost: number;
  stickersApplied: number;
}

export type RunOutcome = 'active' | 'won' | 'lost';

export interface RunState {
  version: number;
  runSeed: number;
  /** Mulberry32 state: resuming a saved run continues the same random stream. */
  rngState: number;
  act: number; // M4: always 1 (structure is act-indexed; content is act 1)
  nodeMap: NodeMap;
  position: string | null; // null before the first pick
  strikes: number;
  currency: number;
  deck: RunCard[];
  stickersApplied: StickerApplication[];
  /**
   * REVISION 2: Cheat Sheet suit stickers — a sticker over a suit's printed
   * entry replaces that suit's spell for YOUR casts (engine suitOverrides).
   */
  sheetStickers: Partial<Record<Suit, EffectId>>;
  sheetModsActive: SheetModId[];
  /** One-duel config patches (Mystery Box curse); cleared after the next duel. */
  tempMods: { patch: Partial<RulesConfig>; label: string }[];
  favorsEquipped: FavorId[];
  favorUses: { secondWind: boolean };
  /**
   * Snapshot of Account.discoveryPool at run start, grown live by duel wins;
   * merged back into the Account when the run ends (spec §8).
   */
  discoveryPool: EffectId[];
  discoveredThisRun: EffectId[];
  banList: EffectId[]; // snapshot; pack pulls filter through it
  pendingChoice: RunPending | null;
  /** Suspended pendings (e.g. the shop while a pack's sticker is applied). */
  queued: RunPending[];
  stats: RunStats;
  outcome: RunOutcome;
  /** Boss reward pick, recorded for the summary (acts beyond 1 would consume it). */
  bossRewardTaken?: BossRewardOption;
}

// ---------------------------------------------------------------------------
// Account (meta-progression)
// ---------------------------------------------------------------------------

export interface Account {
  version: number;
  discoveryPool: EffectId[];
  /** Starting currency per run — flat provisional number (ramp tuning is M5). */
  allowance: number;
  banList: EffectId[];
  /** Ban-list capacity (shoebox UI is M5; the field + pack filter land now). */
  banSlots: number;
  favorsOwned: FavorId[];
  runsCompleted: number;
  runsWon: number;
}

// ---------------------------------------------------------------------------
// Actions & events
// ---------------------------------------------------------------------------

export type RunAction =
  | { type: 'pickNode'; nodeId: string }
  | { type: 'startDuel' }
  // RULES-GAP: (provisional) the docs price a duel LOSS at one strike and say
  // nothing about a showdown DRAW — conservative reading: a draw is neither a
  // win (no rewards) nor a loss (no strike).
  | { type: 'duelOutcome'; won: boolean; draw?: boolean; stats?: DuelStats }
  | { type: 'eventChoice'; choiceId: string }
  | { type: 'buyPack'; pack: PackId }
  | { type: 'buySingle'; item: 'trim' }
  | { type: 'skipShop' }
  // cardId = deck card; sheetSuit = a Cheat Sheet suit slot; null/absent = skip.
  | { type: 'applySticker'; cardId: string | null; sheetSuit?: Suit }
  | { type: 'pickSticker'; effectId: EffectId }
  | { type: 'pickCard'; cardId: string } // removeCard pending
  | { type: 'moveSticker'; fromCardId: string; toCardId: string }
  | { type: 'duplicateSticker'; fromCardId: string; toCardId: string }
  | { type: 'pickReward'; index: number } // bossReward pending
  | { type: 'abandonRun' };

export interface RunEvent {
  type:
    | 'RunStarted'
    | 'NodeEntered'
    | 'DuelStarted'
    | 'DuelWon'
    | 'DuelLost'
    | 'DuelDrawn'
    | 'StrikeLost'
    | 'StrikeRestored'
    | 'SecondWindUsed'
    | 'CurrencyGained'
    | 'CurrencySpent'
    | 'CurrencyLost'
    | 'EffectDiscovered'
    | 'RewardOffered'
    | 'PackOpened'
    | 'StickerGranted'
    | 'StickerApplied'
    | 'StickerSkipped'
    | 'StickerMoved'
    | 'StickerDuplicated'
    | 'CardTrimmed'
    | 'FavorGained'
    | 'SheetModGained'
    | 'TempModApplied'
    | 'EventResolved'
    | 'BossRewardOffered'
    | 'BossRewardTaken'
    | 'RunWon'
    | 'RunLost'
    | 'RunAbandoned';
  [key: string]: unknown;
}

export class IllegalRunActionError extends Error {
  constructor(message: string, public readonly action?: RunAction) {
    super(message);
    this.name = 'IllegalRunActionError';
  }
}
