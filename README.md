# House Rules (working title)

Card battler played with two standard 54-card decks — kids inventing and
house-ruling their own card game. Design docs:

- [UNIFIED_SPEC_v5.md](UNIFIED_SPEC_v5.md) — resolved design tree (canonical)
- [M1_IMPLEMENTATION_BRIEF.md](M1_IMPLEMENTATION_BRIEF.md) — complete base ruleset for the engine
- [RULES-GAPS.md](RULES-GAPS.md) — generated list of open rules questions found during implementation (decide with the designers)

## Layout

npm workspaces, no monorepo tooling.

- `packages/engine` — **M1: headless rules engine.** Pure TypeScript, event-sourced
  reducer, zero runtime dependencies, zero unseeded randomness. Engine contract:
  `applyAction(state, action, rng)` (pure) · `legalActions(state, player)` ·
  `viewFor(state, player)` (redacted) · `serialize`/`deserialize`.
- `scripts/gen-rules-gaps.mjs` — regenerates `RULES-GAPS.md` from `// RULES-GAP:` code tags.

## Commands

```sh
npm install
npm test             # engine test suite (Vitest)
npm run typecheck    # tsc --noEmit, strict
npm run gen:rules-gaps
```

## Status

- **M1 (headless engine): complete.** Full base ruleset — turn structure, mulligan,
  summons/sacrifice tiers, positions, flip effects (all 10), MTG-style stack +
  priority, face-card rank/suit spells, ♠ negate / ♥ revive / ♣ snipe / ♦
  Polymerization blackjack, combat + wall-punish, banking, deck-out clock, poker
  showdown with full tie-breaks. Exit criterion satisfied: a complete 18-turn
  scripted game plays via tests alone (`packages/engine/test/fullgame.test.ts`),
  plus seeded random playouts of full 54-card games.
- Every rule that varies lives in `RulesConfig`; Run-mode card mods hang off
  `GameCard.stickerStack`/`typeOverride` and resolve through `effectiveEffect()`,
  so M4 slots in without a refactor.
- Next: **M2** — sim harness + heuristic AI v0 over `legalActions`/`viewFor`.
