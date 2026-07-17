# House Rules (working title)

Card battler played with two standard 54-card decks — kids inventing and
house-ruling their own card game. Design docs:

- [UNIFIED_SPEC_v5.md](UNIFIED_SPEC_v5.md) — resolved design tree (canonical)
- [M1_IMPLEMENTATION_BRIEF.md](M1_IMPLEMENTATION_BRIEF.md) — complete base ruleset for the engine
- [M2_IMPLEMENTATION_BRIEF.md](M2_IMPLEMENTATION_BRIEF.md) — sim harness + heuristic agents
- [M2.5_IMPLEMENTATION_BRIEF.md](M2.5_IMPLEMENTATION_BRIEF.md) — ratified rules changes + re-simulation
- [M2-FINDINGS.md](M2-FINDINGS.md) — pacing verdicts + designer decisions (M2 data + M2.5 addendum)
- [RULES-GAPS.md](RULES-GAPS.md) — generated list of open rules questions found during implementation (decide with the designers)

## Layout

npm workspaces, no monorepo tooling.

- `packages/engine` — **M1: headless rules engine.** Pure TypeScript, event-sourced
  reducer, zero runtime dependencies, zero unseeded randomness. Engine contract:
  `applyAction(state, action, rng)` (pure) · `legalActions(state, player)` ·
  `viewFor(state, player)` (redacted) · `serialize`/`deserialize`.
- `packages/sim` — **M2: simulation harness.** Five heuristic agents (random,
  aggro, turtle, banker, greedy) that see only `PlayerView`, a deterministic
  game runner (seed reproduces the exact game, agent decisions included), JSONL
  per-game records, outlier replay capture, and a markdown report generator.
- `results/` — experiment outputs. `E*` = historical M2 runs (pre-ratification
  rules), `R0`/`R1`/`R4` = current-rules baseline matrix, ante sweep, and
  first-turn-draw experiment. Only the `REPORT.md` files are checked in; raw
  per-game JSONL and outlier replays are gitignored — the sim is deterministic,
  so both regenerate exactly from their seeds.
- `scripts/gen-rules-gaps.mjs` — regenerates `RULES-GAPS.md` from `// RULES-GAP:` code tags.

## Commands

```sh
npm install
npm test             # engine + sim test suites (Vitest)
npm run typecheck    # tsc --noEmit, strict, all workspaces
npm run bench        # random-agent games/sec floor check (target ≥100/s)
npm run sim -- run --p0 greedy --p1 turtle --games 10000 --seed 1 --out results/dir
npm run sim -- report results/dir --out results/dir/REPORT.md
./scripts/m2-experiments.sh   # R0 baseline matrix + R1 ante sweep (GAMES/JOBS env to override)
npm run gen:rules-gaps
```

## Status

- **M1 (headless engine): complete.** Full base ruleset — turn structure, mulligan,
  summons/sacrifice tiers, positions, flip effects (all 10), MTG-style stack +
  priority, face-card rank/suit spells, ♠ negate / ♥ revive / ♣ snipe / ♦
  Polymerization blackjack, combat + wall-punish, banking, deck-out clock, poker
  showdown with full tie-breaks. Exit criterion satisfied: a complete scripted
  game plays via tests alone (`packages/engine/test/fullgame.test.ts`, since
  updated to the M2.5 ratified rules), plus seeded random playouts of full
  54-card games.
- Every rule that varies lives in `RulesConfig`; Run-mode card mods hang off
  `GameCard.stickerStack`/`typeOverride` and resolve through `effectiveEffect()`,
  so M4 slots in without a refactor.
- **M2 (sim harness + heuristic AI v0): complete.** Agents in `packages/sim`,
  ≥100 games/sec floor met (hand-written state clone replaced `structuredClone`).
  Findings and the designer-decision agenda live in [M2-FINDINGS.md](M2-FINDINGS.md).
- **M2.5 (ratified rules changes): complete.** Designer-ratified rules landed:
  draw-2 baseline, game end only at a draw phase, no first-turn Battle Phase,
  Ace as 1-or-11 spell fuel, Poly total starts at the target's card value with
  Joker reshuffle, no debuff floor (≤0 power = destroyed), direct-attack
  interception, generalized mirror destruction, real poker categories for
  partial banks, and the Run-mode `ante` knob. Re-simulation results in
  `results/R0` (baseline matrix), `results/R1` (ante sweep — data recommends
  ante 5 for Run mode), and `results/R4` (`firstTurnDraw` experiment — the
  skip-first-draw compensation is real and roughly symmetric: combat mirrors
  sit at 46% first-player with it, 54% without). Only two provisional edges
  remain in RULES-GAPS.md.
- Headline sim verdicts (details in the findings addendum): pacing in band
  (greedy-mirror median 42 turns), poker layer engaged (44% full-house + 22%
  quads winning hands), zero crashes/stalls across 870k+ games. Open items for
  the designers: ante value, banker-mirror second-player edge, K+Ace-as-11
  as premier removal.
- Next: **M3** — browser prototype (ugly, playable vs AI). The greedy agent is
  the intended v1 opponent.
