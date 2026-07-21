# DECK SYSTEMS & WIN CONDITIONS — ARCHITECTURE PLAN
## House Rules (working title) — decision record + phased implementation plan

**Status (2026-07-20):** architecture direction settled in design session with Mitchell.
This is an ARCHITECTURE document — **no new deck, effect, or win-condition CONTENT is
designed or ratified here.** Every gameplay-visible question it raises is listed in
§5 for the design table (brother ratification), per the prime directive: never invent
rules. The decks themselves (tarot, mahjong, hanafuda, ganjifa, mamluk, minchiate,
German-suited, Swiss-suited) are deferred to a much later update; this plan exists so
the seams are cheap now instead of a rewrite later.

**Ratified premise:** ship Phase 1 with poker as the sole registered win condition and
the French 54-card deck as the sole deck system. Every Phase 1 change is
behavior-preserving — a poker-vs-poker duel plays identically before and after
(same pattern as the `EffectId` registry with `default:*` entries, and
`bankTriggerScaling` landing with the old behavior under `'off'`).

---

## 1. The long-term vision this serves (context, not commitment)

Future updates may add decks beyond French-suited: their own cheat sheets, mixed/
swapped decks (e.g. poker ♦ swapped for tarot wands), act bosses running a completely
different deck AND win condition than the player. Win-condition inspirations surveyed
(translation mappings recorded in §4): Mahjong (meld collection), French Tarot
(point threshold shrinking with oudlers held), Skat (contracts incl. Null = win by
losing), Schieber Jass (target score across hands), Ganjifa Hamrang/Ekrang (most
tricks), Koi-Koi (yaku + push-your-luck doubling), Minchiate (points + versicole
combos), Mamluk (no surviving rules — French-isomorphic 52×4 reskin, pure content).

---

## 2. Decisions (D1–D12, session of 2026-07-20)

- **D1 — Deck systems are data, not code branches.** A future deck = a `CardDef`
  table (id, name, optional numeric value, group ids, type, default `EffectId`,
  scoring facets) + registered win condition(s) + cheat-sheet data. No new
  `switch (card.rank)` logic per deck.
- **D2 — The effects seam is already sufficient.** `EffectId` registry +
  `effectiveEffect()` + `suitOverrides` need no rework for new decks; new decks
  reuse them as-is.
- **D3 — Win conditions are registered modules referenced by `{ id, params }`.**
  Registry pattern identical to `effects.ts` (config is serialized into replays, so
  ids + plain-data params only, never lambdas). Params are forced by Skat contracts
  (61/90/Schwarz/Null = one family, parameterized) and target-score games.
  **Per-seat** (like `overrides`/`suitOverrides`) and **PUBLIC via `viewFor`** —
  a boss on a different win condition is visible cheating, same rule as scrawls.
- **D4 — Three scoring surfaces, no more.** A win condition may read: (a) bank
  contents (poker, tarot points, yaku, versicole), (b) reducer-maintained per-seat
  stat counters (trick analogs: combats won → Ganjifa "most tricks", Skat Null
  "never win a combat"), (c) its own private per-seat state blob in `GameState`
  (Koi-Koi multiplier/declared-continue state). Recomputing from the event log is
  ruled out — state stays authoritative for save/resume.
- **D5 — Completion is a hook, not only a terminal comparison.** Win conditions may
  opt into observing event batches; the check runs for BOTH seats after any batch
  (Null-style conditions terminate on the OPPONENT's action). A completion may be
  terminal OR raise a decision pending (Koi-Koi stop/continue), reusing the
  `flipDecision`/`flipChoice` shape. Poker opts out entirely → hot path unchanged.
- **D6 — The engine stays one duel; match/session scoring lives in `packages/run`.**
  Jass-to-1000 / Minchiate sessions / Koi-Koi rounds = a future run-layer "match"
  node running N duels and accumulating — deferred until a target-score ruleset
  exists (no consumer today).
- **D7 — No in-duel bidding phase, ever (current stance).** Tarot taker / Skat
  declaration translate to the run layer: contract selection is a node choice
  (risk/reward), landing as `{ id, params }` in the `DuelSpec`. Zero engine cost.
  Koi-Koi's in-duel stop/continue is the one push-your-luck piece that belongs in
  the engine (D5 pending).
- **D8 — `GameResult` widens BEFORE M5 content lands.** From poker-shaped
  `hands: [HandResult, HandResult]` to per-seat generic scores (§3 P1.1). Two
  consumers force the timing: replays and run-layer `duelOutcome` (a future match
  node needs score payloads, not just `winner | 'draw'`). Widening later = a
  migration across replays, sim reports, and saves.
- **D9 — Shipping the seams with poker as sole tenant keeps the game fully
  playable.** Dormant machinery is unreachable in poker-vs-poker duels. Costs
  accepted: serialized-shape changes invalidate old saves/replays (handled by
  version gates — run storage already has `STORAGE_VERSION` hard-fail; engine
  serialize gains one), and dormant-code rot (mitigated by a test-only dummy win
  condition, same role the random-sticker playout prober serves for effects).
- **D10 — Deferred until a real second tenant exists:** the `CardDef` registry
  itself, card-id format change, per-seat `DeckSpec`, scoring facets, cheat-sheet
  group content, the match node, cross-system comparator values. Building the
  framework with one implementation risks shaping it wrong for mahjong.
- **D11 — A win condition's definition of done includes a sim agent + R-series
  pacing run** (the way R6 gated `bankTriggerScaling`). Inverted conditions (Null)
  break greedy's evaluation outright; pacing of completion races vs the ~40-turn
  deck-out clock is unvalidated by definition.
- **D12 — Mixed decks are an economy knob, flagged for design.** Swapping a suit
  out of a French deck thins flushes and weakens banks — a difficulty lever, not
  just flavor. Decide deliberately (§5).

---

## 3. Phased plan

### Phase 0 — discipline, in force NOW (zero cost)

- **No new `switch`/branch on `card.rank`/`card.suit` outside `engine/src/cards.ts`
  and `engine/src/effects.ts`.** Those two files are the future `CardDef` lookup;
  keeping the derivations funneled there keeps the eventual refactor mechanical.
- **NEVER hardcode rules in the UI (ratified 2026-07-20, enforced in
  `CLAUDE.md`).** All rules-derived UI text/values come from the engine:
  `describeEffect` + `effective*` lookups for effects, `view.config` (now on
  `PlayerView` — public) via `cfg`/`cfgFor` for config facts, machine-readable
  `EffectSpec` fields (e.g. `harm`) for semantics the UI branches on. Each fix
  lands with a drift test. First enforcement pass landed same day (Cheat Sheet,
  cast-button labels, Joker text, self-target warnings).
- When code touching `suitOverrides` keys or card ids is edited for other reasons,
  prefer the widened shapes (`Record<string, EffectId>` group keys; ids that could
  carry a system qualifier) — do not do a dedicated churn pass.
- This document exists; README + workspace notes point at it.

### Phase 1 — engine seam hardening (pre-M5 or early-M5; each item lands with tests)

All behavior-preserving. Order matters: P1.1 first (everything downstream consumes
`GameResult`), then P1.2; the rest are independent.

- **P1.1 `GameResult` widening.** Target shape:

  ```ts
  interface SeatScore {
    system: string;        // win-condition id ('default:poker')
    ordinal: number;       // cross-system comparable rank; poker = category (0..8) for now
    display: string;       // human name ('Full House')
    cards: GameCard[];     // the scoring cards (poker: best 5)
  }
  interface GameResult {
    winner: PlayerId | 'draw';
    scores: [SeatScore, SeatScore]; // replaces hands: [HandResult, HandResult]
    stalled: boolean;
  }
  ```

  Consumers to migrate in the same change: sim stats/report generator, web
  `EndScreen`, run `duelOutcome`/`finishRun` path, replay round-trip test. While
  both seats share one system, comparison stays fully delegated to that system
  (poker keeps `compareBanks` verbatim — extended kickers untouched); the
  cross-system meaning of `ordinal` is a design gap (§5), NOT resolved by this
  refactor.
- **P1.2 Win-condition registry, poker as sole entry.**

  ```ts
  interface WinConditionDef {
    id: string;                                  // 'default:poker'
    name: string; text: string;                  // display — THE anti-drift source, same hard rule as EffectDef
    evaluate(s: GameState, seat: PlayerId, params: WCParams): SeatScore;  // pure
    isComplete?(s: GameState, seat: PlayerId, params: WCParams): boolean; // completion-race systems only
    observes?: GameEvent['type'][];              // opt-in event hook; ABSENT for poker → hot path adds one null check
    // onEvents reaction: nothing | terminal result | raise winConditionDecision pending
  }
  type WCParams = Record<string, number | string | boolean>;
  // RulesConfig gains (PUBLIC via viewFor, per-seat like overrides/suitOverrides):
  winConditions?: [{ id: string; params?: WCParams } | null, { id: string; params?: WCParams } | null];
  // absent/null = 'default:poker'
  ```

  The single game-end site (`reducer.ts` showdown call) routes through the
  registry. `DEFAULT_CONFIG` omits the field.
- **P1.3 Per-seat stat counters in `GameState`.** Write-only until a tenant reads
  them; incremented at existing resolution sites; exact field list finalized at
  implementation (candidates: `combatsWon`, `combatsLost`, `directHits`,
  `monstersLost`, `cardsBanked`, `banksRemoved`). Serialized, cloned by the
  hand-written cloner. Sim instrumentation may adopt them opportunistically.
- **P1.4 Observer hook + generic decision pending.** After each event batch, for
  each seat whose registered def declares `observes` matching the batch: run the
  check (both seats — D5). New `Pending` entry
  `{ type: 'winConditionDecision', player, choiceIds: string[] }` + one response
  action, routed to the def. Unreachable with poker registered.
- **P1.5 `winConditionState?: [unknown, unknown]` on `GameState`.** Opaque
  serializable blob owned by the registered def, mutated only through its hooks
  (`PolyState` generalized). Cloner shares the ref when unchanged (the
  `structuredClone` perf lesson).
- **P1.6 `bankProtected: boolean` joins `PerPlayerFields`.** Default `false`;
  gates the two bank-removal paths (opponent's bank-trigger `'remove'` choice,
  wall-punish pick). Rides the existing M4 A2 overlay — PUBLIC, boss-visible.
  (`drawPerTurn` is already per-seat, so "heavy-draw archetype" costs nothing.)
  **Deliberately NOT in Phase 1:** graveyard-banking (`bankSources`) — open design
  question whether it's a sheet RULE or an EFFECT (§5).
- **P1.7 Engine serialize version gate.** A version constant in
  `engine/src/serialize.ts` checked on deserialize (mirror of run
  `STORAGE_VERSION`); bump invalidates pre-change replays/saves — acceptable
  pre-release, but it is a decision, not an accident.
- **P1.8 Test-only dummy win condition** exercising `isComplete`, the observer
  hook both-seats path, the decision pending, a stats-reading condition, and
  `winConditionState` round-trip. Not in the shipping registry.

**Phase 1 verification gate (all mechanical, all existing tooling):** full test
suite green (232 at M4 commit) · sim seed-reproduction — same seeds produce
byte-identical `GameResult`s across the change · replay export/re-run round-trip ·
`npm run bench` floor (≥100/s) holds.

### Phase 2 — with the FIRST real second deck/win condition (much later update)

Deliberately unbuilt until then (D10): `CardDef` registry + `GameCard.defId` ·
system-qualified card ids (current `"<owner>:<rank><suit>"` format leaks into
replays) · per-seat `DeckSpec` (defId list + stickers) in `DuelSpec`, PUBLIC ·
scoring facets on card defs (`poker: { rank, suit }`, etc. — each scoring system
reads only its facet, ignores cards without it) · cheat-sheet group-keyed data ·
run-layer match node (D6) · cross-system `ordinal` values ratified · per-condition
sim agent + R-series run (D11) · win-condition HUD/cheat-sheet rendering via
`describeProgress` (visible-cheating rule) · web card faces rendered from defs.

---

## 4. Win-condition translation mappings (recorded, NOT ratified)

How each surveyed game maps onto House Rules structures — the capability column is
what forced each Phase 1 seam. All gameplay specifics are design-table material.

| Inspiration | Translated win shape | Surfaces / capabilities |
|---|---|---|
| Mahjong | Race: bank forms 4 melds + pair (~14 cards); needs heavy draw, protected bank, graveyard-banking | bank · `isComplete` race · P1.6 knobs |
| French Tarot | Bank card-points ≥ threshold; threshold shrinks with oudler-analogs held (56→36) | bank · derived-param `evaluate` |
| Skat | Contract family: ≥61/≥90 points, all combats, or Null (win by never winning a combat) | params (D3) · stats · opponent-triggered termination |
| Schieber Jass | Target score across hands | match node (run layer, D6) |
| Ganjifa (Hamrang/Ekrang) | Most combats won over the duel | stats |
| Koi-Koi | Complete a bank combo (yaku-analog) → stop (terminal) or continue for doubled stakes | bank · decision pending · `winConditionState` |
| Minchiate | Captured points + combo bonuses (versicole-analog), cumulative across a session | bank + combos · match node |
| Mamluk | No surviving rules — French-isomorphic reskin, borrow any ruleset | pure content, no new capability |

---

## 5. Design gaps — for the design table, in scope ONLY when this work is scheduled

These become `// RULES-GAP:` code tags at the point of implementation; recorded here
so they aren't rediscovered. None block Phase 1 (poker-only behavior is unchanged).

1. **Cross-system deck-out ordering.** What beats what when a completion race
   doesn't finish: "47 of 91 tarot points, incomplete" vs a flush. The `ordinal`
   scale is pure design.
2. **Mid-turn game end.** M2.5 ratified "game ends ONLY at a draw phase" (against
   mid-turn deck-out). Instant-completion wins reintroduce mid-turn endings by
   design — needs explicit re-ratification, engine must not assume it.
3. **Completion declinability.** Auto-win on completion vs optional declaration
   (mahjong "wait for a better hand"; Koi-Koi makes it a core mechanic). Proposed
   knob: `'auto' | 'optional'` per condition.
4. **Trick translation.** Is a combat a trick? Do direct hits count? Interceptions?
   Defines the stats fields Skat/Ganjifa analogs read.
5. **Graveyard-banking: sheet rule or effect?** Effects get targeting/response
   windows for free (`CardRecovered` machinery exists); a rule is always-on.
6. **Ante × completion races.** Ante seeds the bank pre-game — a far bigger head
   start for a meld-collector than for poker.
7. **Mixed-deck economy (D12).** Suit-swaps thin flushes → weaker banks; feature
   or bug?
8. **Combo definitions over hybrid cards.** What versicole/yaku-analogs mean over
   French + sticker cards, and what the poker evaluator does with facet-less
   foreign cards in a bank (proposed: ignores them — "junk in bank").
9. **Mamluk ruleset choice.** Which existing ruleset its reskin borrows.

---

## 6. Non-goals (current stance, revisit when decks are scheduled)

No in-duel bidding/auction phases (D7) · no generic plugin/mod API — registries are
compile-time code + data like `effects.ts` · no multi-deck matchmaking/balance
promises · no changes to UNIFIED_SPEC_v5.md until the design table ratifies content
(this doc feeds a future spec revision, it does not amend the spec).
