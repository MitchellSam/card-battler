# M2 IMPLEMENTATION BRIEF — Simulation Harness + Heuristic Agents
## House Rules (working title) — hand this file + types.ts + UNIFIED_SPEC_v5.md to Claude Code

**Purpose of M2:** turn the deterministic engine into a data machine. Output is not a feature — it is `M2-FINDINGS.md`: a pacing verdict, degeneracy findings, and per-flag experiment data that converts every provisional RulesConfig default and RULES-GAPS entry from an opinion into a measured tradeoff. M2's consumers are the designers, not players.

**Prime directive unchanged:** never invent rules. The engine is the rules. If agent construction reveals an engine behavior that seems wrong, file it as a bug or a `// RULES-GAP:` — do not "fix" gameplay inside an agent.

---

## PREREQUISITE ENGINE ADDITIONS (small, do first)

1. `RulesConfig.maxTurns: number` (default 300): when `state.turn` exceeds it, the game ends immediately with `result.winner` computed by the normal showdown and a new `stalled: true` field on GameResult. Emit a `GameStalled` event. This is a sim-safety valve AND a degeneracy detector.
2. `RulesConfig.drawPerTurn: number` (default 1): the primary pacing lever. Deck math: 54 cards at ~1.1-1.5 cards/turn depletion (draw + occasional mill/Poly) predicts 35-50 turns per player — likely too slow. This knob must exist before experiments can test it.
3. Performance floor: add a `bench` script (vitest bench or a plain loop) measuring full random-agent games/sec, single thread. Target ≥100 games/sec (10k games < 2 min). If cloning is the bottleneck, optimize state copying (structural sharing on unchanged zones) BEFORE building the harness — every experiment multiplies this cost.

## PACKAGE: `packages/sim` (depends on engine; engine stays dependency-free)

### Agent contract
```ts
interface Agent {
  name: string;
  choose(view: PlayerView, legal: Action[], rng: SeededRNG): Action;
}
```
Agents receive ONLY PlayerView (never GameState) — the redaction contract keeps them honest and PvP-representative. Agents must be pure/deterministic given (view, legal, rng): the harness seeds each game's agent RNG separately from the engine RNG so replays reproduce agent behavior too.

### Runner
CLI: `sim run --p0 greedy --p1 turtle --games 10000 --seed 1 --config baseline.json --out results/`
- Per game, persist one JSONL record (schema below). For outlier games (longest, shortest, stalled, and any crash), ALSO persist the full action log + seeds to `results/replays/` — determinism makes every anomaly reproducible for human inspection.
- Config files are RulesConfig overrides layered on DEFAULT_CONFIG.
- Crash policy: an engine throw during a sim is a P0 bug; capture the replay and halt that matchup.

## AGENT ROSTER (M2 ships all five)

1. **random** — uniform over legalActions. Purpose: crash-finder, stall-finder, floor baseline. (The playout test proved legality; random at scale proves totality — no unreachable dead states.)
2. **aggro** — summons biggest available attacker, attacks whenever legal (biggest attacker into weakest target), always takes bank triggers (bank > remove), never sets monsters, never passes priority with a playable negate... no: aggro ignores spells except J-rank kills. Purpose: upper bound on aggression.
3. **turtle** — never declares attacks. Sets every monster. Sets spells. Passes. Purpose: THE degeneracy probe. turtle-vs-turtle answers the double-turtle stall question empirically: do these games hit maxTurns? What do final banks look like (predicted: near-empty — no triggers ever fire)? This single matchup settles the oldest open design question in the project.
4. **banker** — plays toward the poker win: banks aggressively on every trigger, evaluates bank choices with the engine's own poker evaluator (import it — do not reimplement), prefers removal only when it strictly downgrades the opponent's best-5 category. Purpose: tests whether poker-optimization is a viable strategy axis.
5. **greedy** — the real heuristic, 1-ply: score every legal action by applying it to a cloned view-consistent state... it cannot apply actions to a PlayerView. Instead: score actions by static features WITHOUT engine lookahead in v1 of this agent:
   - board power differential (own face-up power sum − visible opponent power sum)
   - bank delta: own best-5 strength − opponent best-5 strength (poker evaluator on public banks)
   - hand size, deck remaining
   - **clock awareness (the game's unique axis):** if ahead on bank delta, weight actions that deplete own deck (Poly, banking now, aggression); if behind, weight card conservation and defense. Without this term the sims misrepresent pacing — real players race the clock when ahead.
   - small weights for: taking bank triggers (remove when opponent bank ≤5 cards, bank otherwise — the early-denial/late-accumulation curve from the spec), wall-punish risk (don't attack into set monsters when own bank holds high cards), keeping one negate set.
   Tuning by hand to "not obviously stupid" is sufficient; greedy is a measuring instrument, not a product.

## PER-GAME RECORD (JSONL schema)
`{ seed, config, p0, p1, turns, stalled, winner, endedBy: 'deckOut'|'maxTurns', firstPlayer, perPlayer: [{ bankSize, bestHandCategory, bestHandName, cardsRemaining, attacksDeclared, attacksIntoDefense, wallPunishesSuffered, bankTriggersEarned, bankChoices: {bank, remove, decline}, spellsCast: {byKey}, jokersCast, polys: {cast, bust, stand, avgResult}, setRateByRank: {...}, flipTriggersByRank: {...}, sacSummons: {one, two}, milledBy, milledAgainst }] }`

## REPORT GENERATOR
`sim report results/` → markdown summary per matchup×config: median/p10/p90/max turns, stall rate, first-player win rate, draw rate, per-rank set rate and mean turns-until-flip (the 8/9/10 flip-effect question), attack-vs-defense action ratio, bank size distributions, hand-category distribution at showdown, wall-punish frequency and average bank damage, Joker cast rate vs win rate.

## EXPERIMENT MATRIX (run in this order)

- **E0 Baseline:** DEFAULT_CONFIG, all 15 agent pairings (5×5, both seats), 10k games each. Everything below compares against E0.
- **E1 Turtle stall:** turtle×turtle, turtle×greedy. Question: does passive play stall or starve? Metric: stall rate, bank sizes, endedBy.
- **E2 Pacing levers:** drawPerTurn ∈ {1, 2} × deck handled as-is. Question: where does median game length land, and is it in band? **Provisional target band: median 30-70 total turns, p95 < 150, stall rate < 1%** (greedy×greedy). Band is a starting hypothesis — M2's job is to measure, then the designers move the band or the levers.
- **E3 Wall-punish severity:** wallPunishSelector ∈ {random, defender, attacker} × greedy/aggro pairings. Metrics: attacks-into-defense rate, winner bank sizes. Question: which setting keeps attacking-into-boards a live decision rather than never/always?
- **E4 First-player advantage:** from E0 data (no extra runs): first-player win rate per matchup. The skip-first-draw compensation is validated if within 48-52%.
- **E5 Deck-out trigger:** deckOutTrigger ∈ {zeroCards, failedDraw} — does the extra turn change outcomes at margin? (Cheap; settles RulesConfig flag with data.)
- **E6 Joker Poly value (needs tiny engine change):** joker blackjack value ∈ {0, wild-choose} behind a flag. Data for the RULES-GAPS #2 decision.

## EXIT CRITERIA (all must hold)
1. Five agents, runner, report generator exist; bench shows ≥100 games/sec or a documented perf note.
2. E0-E5 complete (E6 optional if the engine change is trivial); reports checked into `results/`.
3. Zero engine crashes across all runs (or: every crash reproduced, fixed, and regression-tested).
4. `M2-FINDINGS.md` at repo root: pacing verdict vs band, turtle-stall verdict, recommended RulesConfig changes with data citations, first-player verdict, and a "Designer Decisions Required" section merging the RulesConfig flags, the 12 RULES-GAPS entries, and any new questions — THE agenda document for the brother session.

## OUT OF SCOPE FOR M2
UI of any kind. ISMCTS/search agents. Run-mode anything (stickers, packs, economy). Balance *changes* — M2 measures; designers decide; config edits land after the decisions, verified by re-running the affected experiments.
