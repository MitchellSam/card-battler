# House Rules (working title)

Card battler played with two standard 54-card decks — kids inventing and
house-ruling their own card game. Design docs:

- [UNIFIED_SPEC_v5.md](UNIFIED_SPEC_v5.md) — resolved design tree (canonical)
- [M1_IMPLEMENTATION_BRIEF.md](M1_IMPLEMENTATION_BRIEF.md) — complete base ruleset for the engine
- [M2_IMPLEMENTATION_BRIEF.md](M2_IMPLEMENTATION_BRIEF.md) — sim harness + heuristic agents
- [M2.5_IMPLEMENTATION_BRIEF.md](M2.5_IMPLEMENTATION_BRIEF.md) — ratified rules changes + re-simulation
- [M2-FINDINGS.md](M2-FINDINGS.md) — pacing verdicts + designer decisions (M2 data + M2.5 addendum)
- [M3_IMPLEMENTATION_BRIEF.md](M3_IMPLEMENTATION_BRIEF.md) — browser prototype (playable vs greedy AI)
- [EFFECT_CATALOG_v1.md](EFFECT_CATALOG_v1.md) — first-pass sticker/effect catalog (commons/uncommons/rares)
- [M4_DESIGN_RECOMMENDATIONS.md](M4_DESIGN_RECOMMENDATIONS.md) — Run-layer content + structure recommendations (ratified 2026-07-19 as the working set)
- [M4_IMPLEMENTATION_BRIEF.md](M4_IMPLEMENTATION_BRIEF.md) — Run mode layer: effect framework, per-player config, node map, economy, persistence
- [HANDOFF_M4.md](HANDOFF_M4.md) — implementation handoff for the M4 milestone (what shipped, what's next, gotchas)
- [DECK_SYSTEMS_PLAN.md](DECK_SYSTEMS_PLAN.md) — architecture plan + decision record for future deck systems (tarot, mahjong, …) and pluggable win conditions; Phase 1 seam hardening is behavior-preserving, decks deferred
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
  The `@house-rules/sim/browser` subpath exports the node-free subset (agents,
  `actorFor`, `agentSeed`) for the web client.
- `packages/run` — **M4: run-mode layer.** Pure, headless, dep-free except the
  engine. Event-sourced run reducer (`applyRunAction`/`legalRunActions`),
  seeded StS-style node-map generator (≥1 shop per path, no adjacent elites),
  encounters/economy/events/sheet-mods/favors as **data files** (changing
  content requires no code edit), grace-degraded pack tiers, discovery pool,
  strikes, and a versioned `Storage` interface (in-memory for tests, IndexedDB
  in web, SQLite later). Duels stay outside: `startDuel` yields a `DuelSpec`,
  the shell plays it and feeds back `duelOutcome` — a whole run replays
  deterministically from `runSeed` + the action log + duel outcomes.
- `packages/web` — **M3: browser prototype** (Vite + React). Playable duel vs
  the greedy agent. The UI contains zero rules logic: every affordance is a
  filter over `legalActions()`, prompts come from `state.pending`, whose-turn
  comes from the sim's `actorFor`, and components render only from
  `viewFor(state, HUMAN)` + the event log. `GameSession` (plain TS, headless-
  tested) owns the full state, RNGs, logs, AI pacing, auto-pass, decision-time
  instrumentation, and deterministic replay export. M3.1 playtest polish:
  confirm-first cascade (no board click ever fires without a confirm popup;
  tributes are always picked explicitly), a coloured/uid-named event log,
  acting-card highlights, own-set-card peek, hover tooltips, and pass-vs-continue
  labelling.
- `results/` — experiment outputs. `E*` = historical M2 runs (pre-ratification
  rules), `R0`/`R1`/`R4` = current-rules baseline matrix, ante sweep, and
  first-turn-draw experiment. Only the `REPORT.md` files are checked in; raw
  per-game JSONL and outlier replays are gitignored — the sim is deterministic,
  so both regenerate exactly from their seeds.
- `scripts/gen-rules-gaps.mjs` — regenerates `RULES-GAPS.md` from `// RULES-GAP:` code tags.

## Commands

```sh
npm install
npm test             # engine + sim + web test suites (Vitest)
npm run typecheck    # tsc --noEmit, strict, all workspaces
npm run web          # serve the M3 duel prototype (Vite dev server)
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
- **Ratified rules (2026-07 playtest round):** two rules landed in the engine
  from the first browser playtest — (1) a manually flipped monster cannot switch
  position the same turn; (2) **flip effects are declinable** (the controller is
  offered a new `flipDecision` pending — activate or skip — before the trigger
  hits the stack); (3) **bank-trigger scaling by effective power** — a combat bank
  trigger now grants a card count banded by the winning blow's power (1-4 → 1
  card, 5-7 → 2, 8+ → 3). Ratified default is **`margin`** (YGO-style: a direct
  hit lands full attacker power, a combat kill scales by winner-minus-loser); the
  `bankTriggerScaling` knob also offers `power` (winner's own power) and `off`
  (flat 1). Simulated across 120k games before ratification — see `results/R6`
  and the R6 section of M2-FINDINGS.md.
- **M3 (browser prototype): implemented, awaiting the human gate.** `npm run
  web` serves a full duel vs greedy from a shown seed. Every action type and
  pending decision from the brief's inventory is operable (mulligan multi-
  select, summon with sacrifice cascade, set/cast spells with the full target
  cascade, Joker, attacks + direct, bank triggers, flip targets, interceptor,
  wall-punish pick, Poly hit/stand + Ace 1-or-11, response windows with
  auto-pass). EndScreen reports wall-clock minutes, turns, human decision
  count and mean seconds-per-decision (clocked only while the human holds the
  decision), and exports a deterministic replay (verified: re-running the
  action log through the engine reproduces the same `GameResult`). Dev panel:
  seed/restart, agent picker, AI delay, auto-pass toggle, loud reveal-all,
  wall-punish selector (to smoke-test the pick prompt), greedy
  decide-for-me. Cheat Sheet ships as a visibly-placeholder page with the
  canon corrections list. **Remaining exit gate: the brother completes a full
  duel in-browser and the wall-clock number goes to the design chat.**
- **M4 (run mode layer): implemented, awaiting the human full-run gate.**
  - **A1 — effect framework, REVISION 2 (2026-07-19): slotless stickers +
    context-free effects.** The engine owns a data-driven registry
    (`packages/engine/src/effects.ts`): 9 catalog seed effects + all 17
    base-game DEFAULTS as poolable stickers, name/text as THE anti-drift source
    (`describeEffect`; the web's duplicated tables are deleted). One
    context-free resolver serves every trigger: a sticker on a number card is
    its flip effect, on a face card it replaces the rank spell, and suit spells
    live on the CHEAT SHEET (`config.suitOverrides`, per player, public) —
    stickering the sheet's ♦ replaces YOUR Polymerization. `params.ts` gives
    casts and flips one shared target/fuel enumeration+validation (Q as a flip
    prompts for its discard). Any sticker fits any non-Joker card. The playout
    prober runs randomly stickered decks + random sheet overrides. Remaining
    catalog commons/uncommons and all rares are M5.
  - **A2 — per-player config overlay.** `RulesConfig.overrides` (per-seat
    drawPerTurn/ante/handLimit/startingHand/monsterZones) read exclusively
    through `cfg()`; absent = byte-identical to before; PUBLIC in `viewFor`
    (boss cheats are visible by design). Boss "The Grown-Up" cheats via data
    (`drawPerTurn: 3`) and the scrawl renders on the duel screen + Cheat Sheet.
  - **Part B — `packages/run`** (see Layout). Headless full-run test: seeded
    agents drive complete runs (map → duels/events/shops → boss → summary)
    with REAL engine duels, deterministically.
  - **Part C — run mode in the browser.** Account home (new/resume/wipe +
    favor LOADOUT: favors are between-run progression, unlocked by account
    milestones, equipped ≤2 per run — never sold in-run) → node map (DAG,
    reachable highlighting) → duel (GameSession from the DuelSpec, stickered
    deck, scrawls incl. sheet stickers) → shop (packs restock, pack rip =
    pick-1-of-3 of the rolled tier, trim) → events (sticky notes) → boss
    pick-1-of-3 → run summary + run-record export. **Every duel win offers a
    pick-1-of-3 sticker** (drawn from ALL implemented effects, NEW-flagged;
    picking an undiscovered one unlocks it — THE discovery channel), and the
    apply screen targets any deck card OR a Cheat Sheet suit slot. Post-duel
    rewards note on the map. IndexedDB persistence: reload resumes mid-run.
    Run dev panel: seed input, jump-to-node, grant coin/sticker, force
    win/lose duel.
  - **Bugfixes (2026-07-20):** React StrictMode's dev double-mount was
    disposing the freshly-created `GameSession` (dead buttons on duel entry
    until a dev-panel restart) — fixed with `GameSession.activate()` re-armed
    in the owner's effect setup; suit tooltips ignored Cheat Sheet stickers —
    `cardTooltip` now reads `view.suitOverrides` (threaded through
    Board/Zone/DeckViewer); a dispatch guard drops clicks that land while the
    AI holds priority.
  - **Test count: 232 green** (167 engine · 42 run · 5 sim · 18 web);
    `npm run typecheck` clean; `npx vite build` bundles clean.
  - **Remaining exit gate: a human completes a full run start-to-finish in the
    browser** (the headless equivalent is green in
    `packages/run/test/fullrun.test.ts`).
