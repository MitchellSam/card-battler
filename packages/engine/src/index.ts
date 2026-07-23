// @house-rules/engine — headless, pure, dependency-free rules engine (M1).
//
// Engine contract (non-negotiable, see planning/RULESET_v6.md + planning/PROJECT_SPEC_v6.md):
//   applyAction(state, action, rng) => { state, events }   // pure
//   legalActions(state, player) => Action[]
//   viewFor(state, player) => PlayerView                    // redacted
//   serialize(state) / deserialize(str)                     // full round-trip

export * from './types.js';
export { createRng, shuffle, type SeededRNG } from './rng.js';
export {
  ALL_RANKS,
  FACE_RANKS,
  NUMBER_RANKS,
  SUITS,
  createDeck,
  effectiveEffect,
  effectivePower,
  isMonsterCard,
  isNumberRank,
  isSettableSpell,
  isSpellCard,
  monsterBasePower,
  numberValue,
  polyValue,
  sacrificeCost,
  suitWeight,
} from './cards.js';
export {
  EFFECT_SPECS,
  canApplySticker,
  describeEffect,
  effectiveCardEffect,
  effectiveFlipEffect,
  effectiveSuitEffect,
  getEffectSpec,
  isCatalogSticker,
  type EffectDescription,
  type EffectSpec,
  type EffectTier,
  type TargetKind,
} from './effects.js';
export { enumerateParams, validateParams, type EffectParams, type ParamContext } from './params.js';
export { cfg, cfgFor } from './config.js';
export { setupGame, type SetupOptions } from './setup.js';
export { applyAction } from './reducer.js';
export { legalActions, hasAnyActivation } from './legal.js';
export { viewFor, type PlayerView, type SideView, type MonsterView, type SetSpellView } from './view.js';
export { serialize, deserialize } from './serialize.js';
export {
  bestHand,
  compareBanks,
  compareScored,
  evaluate5,
  pokerRank,
  showdown,
  toHandResult,
  type ScoredHand,
} from './poker.js';
