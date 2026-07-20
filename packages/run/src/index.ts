// @house-rules/run — pure, headless run-mode layer (M4 Part B).
//
// Contract:
//   applyRunAction(run, action, rng) => { run, events }   // pure
//   legalRunActions(run) => RunAction[]
//   newRun(account, runSeed, favors) / finishRun(account, run)
//   Storage interface (IndexedDB in web, in-memory in tests)
// Duels stay outside: startDuel yields a DuelSpec; the shell plays it and
// feeds back duelOutcome.

export * from './types.js';
export { generateMap, nodeById, reachableNodes } from './mapgen.js';
export {
  applyRun,
  applyRunAction,
  duelSeedFor,
  favorUnlocked,
  finishRun,
  legalRunActions,
  newAccount,
  newRun,
  unlockedFavors,
} from './reducer.js';
export { InMemoryStorage, STORAGE_VERSION, decodeBlob, encodeBlob, type Storage } from './storage.js';
export { ECONOMY, MAP_CONFIG, RUN_CONFIG } from './data/config.js';
export { ENCOUNTERS } from './data/encounters.js';
export { EVENTS } from './data/events.js';
export { FAVORS } from './data/favors.js';
export { PACKS } from './data/packs.js';
export { SHEET_MODS } from './data/sheetMods.js';
export { STARTER_DISCOVERIES } from './data/seed.js';
