# M4 IMPLEMENTATION BRIEF — Run Mode Layer
## House Rules (working title) — hand this file + M4_DESIGN_RECOMMENDATIONS.md + EFFECT_CATALOG_v1.md + UNIFIED_SPEC_v5.md to Claude Code

**Purpose of M4:** the roguelite loop exists. Node map → duels/events/shops → boss → run summary, with stickers, packs, a discovery pool, strikes, and persistence. **Exit gate (spec §10): a full run is completable start to finish.** Functional, not fun — fun is M5's exit criterion.

**Prime directive unchanged:** never invent rules or content. The ratified content set is in `M4_DESIGN_RECOMMENDATIONS.md` (status header lists what was ratified 2026-07-19); effect semantics come from `EFFECT_CATALOG_v1.md` verbatim. Where either is silent, tag `// RULES-GAP:` and implement the conservative reading — do not fill gaps creatively. All content lands as **data files**, because the brother's ratification pass runs in parallel and his edits must be config changes, not code changes.

**Ratified inputs this brief encodes:** Run ante 5 · 3 strikes flat (boss loss also 1; Recess restores 1) · per-player config overlay IS in scope · 6 sheet mods / 7 favors / 12 events / 9-effect starter seed as listed in the recommendations doc · procedural DAG node map, boss-terminated single act.

---

## PART A — ENGINE ADDITIONS (do first; each lands with tests)

### A1. Effect framework + catalog effects (the big one)

The hook already exists: every effect lookup goes through `effectiveEffect(card)` (`cards.ts`) which returns `top(stickerStack) ?? 'default:<rank>'`, and `effectiveFlipRank` currently **throws** on any non-default id. Replace that throw with a real registry:

```ts
// engine — data-driven effect definitions (the catalog in code-consumable form)
interface EffectDef {
  id: EffectId;                       // 'peek', 'skim', ... (kebab of catalog name)
  tier: 'common' | 'uncommon' | 'rare';
  slot: 'flip' | 'rank:J' | 'rank:Q' | 'rank:K' | 'suit:♠' | 'suit:♥' | 'suit:♣' | 'suit:♦';
  name: string;                       // display name, from the catalog
  text: string;                       // display rules text, from the catalog — THE anti-drift source
  // behaviour is implemented in the reducer keyed by id; no behaviour lambdas in data
}
```

- **The drift fix is a hard requirement (ratified):** `name`/`text` live HERE, in the engine package, and the web tooltip renders `describeEffect(effectiveEffect(card))` — never its own rank/suit tables. Delete the duplicated tables in `packages/web/src/ui/cardFace.ts` for effect text (keep pure face/label helpers); the ⚠ RUN-MODE DRIFT comment there marks the spot. One test: every registered EffectDef has non-empty text, and the tooltip path resolves a stickered card to the sticker's text, not the default's.
- **Reducer dispatch:** where flip effects resolve (`resolveFlip`) and where face-card effects resolve (`resolveSpell`), branch on `effectiveEffect(card)`: `default:<rank>` keeps today's path; a sticker id dispatches to its implementation. Flip-slot stickers ride the existing flip machinery (declinable via `flipDecision`, same stack timing); rank/suit-slot stickers ride the existing cast machinery (same targeting/priority).
- **Slot legality:** applying a sticker is legal only if its `slot` matches the card (flip → number cards 2–9 ONLY; A and 10 are excluded from the common pool — standing decision, spec §4.2; rank/suit → the matching face-card slot). Enforced by one `canApplySticker(card, def)` helper the run layer calls.
- **REQUIRED for exit:** the framework + the 9 seed effects — commons **peek, skim, rally, doorstop, needle, scavenge, warning-shot**; uncommons **leverage** (Q-rank alt), **executioners-toll** (J-rank alt).
- **TARGET (can slip to M5 without blocking exit):** the remaining commons (feint, stall, undertow, short-fuse, copycat, tax, graft). Flag the tricky ones: **copycat** (dynamic reference to a graveyard card's flip effect — resolve through `effectiveFlipRank` of the chosen card at resolution time), **graft** (touches the poker tie-break path — extend `compareBanks`' extended-kickers comparison, one dedicated test), **feint** (immediate position switch — reuse `changePosition` internals, bypassing the once-per-turn flag once).
- **NOT in M4:** all rares (incl. Recast/typeOverride behavior — schema stays, behavior M5), remaining uncommons, sleeve anything.
- Every implemented effect: at least one scripted test; the random-playout totality test extended to decks with random legal stickers applied (crash-prober for the framework).

### A2. Per-player config overlay (asymmetric rules — ratified IN)

```ts
// RulesConfig gains:
overrides?: [Partial<PerPlayerFields> | null, Partial<PerPlayerFields> | null];
// PerPlayerFields = Pick<RulesConfig, 'drawPerTurn' | 'ante' | 'handLimit' | 'startingHand' | 'monsterZones'>
// engine-internal accessor — ALL reads of these five fields go through it:
cfg(s: GameState, player: PlayerId, field: keyof PerPlayerFields): number
```

- Default absent → identical to today; Constructed untouched; determinism/serialize round-trips it.
- Touch points to convert: draw phase (`drawPerTurn`), `performAnte` (`ante`), end-phase discard (`handLimit`), setup (`startingHand`, `monsterZones` zone-array width).
- `viewFor` exposes both sides' overrides — **boss cheats must be visible** (the Cheat Sheet scrawl and the UI read them; hidden cheating is off-theme and off-spec).
- Tests: asymmetric draw (3 vs 2), asymmetric ante (8 vs 5), zone-width asymmetry, serialize round-trip, sim determinism with overrides set.

### A3. Run-baseline config (data, not code)

`RUN_CONFIG = { ...DEFAULT_CONFIG, ante: 5 }` lives in the run package's data. Sheet mods are `Partial<RulesConfig>` patches layered on it per-duel. No engine change.

## PART B — PACKAGE `packages/run` (pure, headless, dep-free except engine)

Same discipline as the engine: event-sourced reducer, zero unseeded randomness, serializable, testable without a browser. A run is deterministic from `runSeed` + the action log + duel outcomes.

```ts
applyRunAction(run: RunState, action: RunAction, rng: SeededRNG) => { run: RunState, events: RunEvent[] }
legalRunActions(run: RunState) => RunAction[]

RunState  { runSeed, act, nodeMap, position, strikes, currency, deck: RunCard[],
            stickersApplied, sheetModsActive: SheetModId[], favorsEquipped: FavorId[],
            pendingChoice: RunPending | null, stats: RunStats, outcome: 'active'|'won'|'lost' }
RunAction { pickNode | eventChoice | buyPack | buySingle | applySticker | skipShop |
            startDuel | duelOutcome | pickReward | abandonRun }
Account   { discoveryPool: EffectId[], allowance, banList: EffectId[], favorsOwned, runsCompleted }
```

- **Duels stay outside the run reducer:** `startDuel` yields a `DuelSpec { config (RUN_CONFIG + sheet-mod patches + node's PlayerConfig overrides), humanDeck: RunCard[], agentName, duelSeed }`; the shell plays it (GameSession in the browser, agents in tests) and feeds back `duelOutcome { won, stats }`. Duel seeds derive from `runSeed + nodeId` so a whole run replays deterministically modulo human play.
- **Node map gen (seeded):** StS-style DAG per recommendations §6 — ~6 columns pre-boss, 2–4 wide, equal path lengths, boss = single terminal node; constraints: ≥1 Shop on every path, no two Elites adjacent. Node pool weights: Duel 45% / Event 25% / Shop 12% / Elite 10% / Treasure 8%. **Act length is a config number (provisional 12 nodes incl. boss) — final value set by the next timed duels; nothing else may depend on it.**
- **Encounters:** greedy everywhere. Standard = RUN_CONFIG. Elite = +1 ante override. **Boss "The Grown-Up" = ONE legible cheat: `overrides[AI] = { drawPerTurn: 3 }`** (default; it's data — designer can swap to ante-8 or 6th zone by editing the boss def). Elite reward = guaranteed-best-available-tier sticker; boss win = pick-1-of-3 (≥1 sheet mod) + currency; boss loss = 1 strike (flat, ratified).
- **Stickers — apply-on-acquisition:** a pack/reward grants a sticker → the player immediately picks a legal card from the deck viewer (or skips, forfeiting it). No sticker inventory in v1 (fewer states; Swap Meet is the re-slot valve). `applySticker` pushes onto `stickerStack` (permanent for the run).
- **Economy data files:** packs `{ cornerStore: {cost, weights}, tradeBinder: {cost, weights, guarantee: 'best-available'} }` — **grace degradation rule:** any tier reference resolves to the best *implemented and discovered* tier ≤ it, so "guaranteed rare" honestly yields an uncommon until rares exist (M5). Shop = 2 packs + "Trim a Card" single (removal floor 40 enforced). Duel win = currency + 1 undiscovered effect into `Account.discoveryPool` (the growth channel); numbers provisional, in data.
- **Events: the 12** — Lemonade Stand, Found a Pack, Yard Sale, Swap Meet, Trim a Card (event form), Double Down, The Dare, Mystery Box, The Bully, Overtrim, Recess, Rival Riley. Outcomes are a closed union (`gainCurrency | grantSticker(tier) | pickSticker(n) | removeCard | restoreStrike | eliteDuel(mods) | loseCurrency | moveSticker | duplicateSticker`), NOT a scripting language. Mystery Box's "one-duel curse" = a one-duel config patch (same machinery as sheet mods, expiring). Text/choices in data files.
- **Sheet mods (6, zero-engine):** no-take-backs `{wallPunish:false}` · everlasting `{queenBuffDuration:'permanent'}` · big-hand `{handLimit:8}` · fast-rules `{drawPerTurn:3}` · high-stakes `{ante:8}` · sudden-death `{bankTriggerScaling:'power'}`. Apply to BOTH players (symmetric, on the Cheat Sheet).
- **Favors (7 economy, 2 slots):** pack-rat, lucky-coin, sharpie-stash, trade-binder-regular, do-over (one extra mulligan — pre-duel, run-layer), ban-runner, second-wind (once/run, a loss costs no strike). All run-layer; the in-duel favors (8–12) ride A2 in M5. Ban list: `Account.banList` field + pack-pull filter land now (trivial); shoebox UI deferred to M5 (unlock at 20 discoveries is unreachable until the catalog expands).
- **Strikes:** start 3; any duel loss −1 (boss included, flat); 0 = run lost. Recess +1 (cap 3).
- **Persistence:** `interface Storage { load/save Account, load/save RunState (resume mid-run), clear }` — IndexedDB implementation in web; in-memory implementation for tests; versioned serialized blobs. SQLite arrives with Electron (M6) behind the same interface.

## PART C — WEB UI (extends `packages/web`; run screens follow the mockups' component discipline)

Mockup references: `NodeMap.dc.html`, `Shop.dc.html`, `RunSummary.dc.html`, CheatSheet for scrawls. Ugly-but-navigable is fine; component boundaries mirror mockups so the M6 art pass swaps skins.

1. **Run shell / routing:** Account home (new run / resume / allowance display) → NodeMap → node screens → back to map. Run HUD everywhere: strikes ✎, currency (label "TBD coin" per canon — do not name it), deck count, equipped favors.
2. **NodeMap screen:** the DAG, reachable-next highlighting, node-type icons, boss at top. Click = `pickNode`.
3. **Duel integration:** GameSession constructed from `DuelSpec` — human deck = RunCard deck (stickered), config includes overrides. **Boss cheat rendering:** read `config.overrides` and show the scrawl ("HE DRAWS 3. THAT'S NOT FAIR. —Sam") on the duel screen + Cheat Sheet. Sticker text on hover comes from the engine's `describeEffect` (A1) — the drift fix made visible.
4. **Shop / pack opening / sticker application:** pack rip → reveal → deck viewer filtered to legal cards (`canApplySticker`) → apply or skip. Deck viewer is also standalone (browse your stickered deck from the map).
5. **Event screen:** sticky-note style (PromptNote family), choice buttons from `legalRunActions`.
6. **Run summary:** win/lose, stats, discoveries added, carried-to-account note.
7. **Dev panel additions:** run seed input, jump-to-node, grant-currency/sticker, force-win/lose-duel — needed to make the full loop testable by a human in minutes, not 45.

## INSTRUMENTATION (feeds the act-length decision)

Per-run record (exported like duel replays): per-duel wall-clock + turns (existing stats), per-run total minutes, nodes visited, strikes lost, currency curve, stickers applied. The first 2–3 real runs answer §6's duels-per-act question — that number is still provisional in the map config.

## EXIT CRITERIA (all must hold)

1. **A full run is completable start to finish in the browser** — map → ≥N duels/events/shops → boss → summary → discoveries persisted to Account; and a lost run (3 strikes) reaches the summary too.
2. Headless full-run test: agents drive both seats through a complete run via `applyRunAction` + `playGame` — no browser; deterministic (same runSeed + actions ⇒ same run) and serialize/round-trip green.
3. A1 required effects (seed 9) implemented with tests; a stickered card resolves the sticker's behavior in a scripted duel test AND shows the sticker's text through the tooltip path (drift test).
4. A2 lands with the listed tests; Constructed `DEFAULT_CONFIG` behavior byte-identical (existing 145+ tests stay green unmodified except where they name new fields).
5. All content in data files; changing a sheet mod / event / favor / pack requires no code edit (review criterion).
6. Boss cheat is visible in the UI (config-driven scrawl), not hardcoded copy.
7. Resume works: reload mid-run restores map position, deck (with stickers), strikes, currency.
8. `RULES-GAPS.md` regenerated; new gaps only where the catalog/recommendations were genuinely silent.

## OUT OF SCOPE FOR M4

Rare-tier effects incl. Recast behavior · uncommons beyond the seed 2 (target-only) · in-duel favors 8–12 · ban-list UI (field + filter only) · Wild-Jokers + Recycling sheet mods (need engine work — M5 with re-sim) · multiple acts (structure is act-indexed; content is act 1 only) · allowance ramp tuning (flat provisional number) · sleeves · balance passes (M5 measures with sims + humans, then tunes) · Motion/art/sound polish · Electron/SQLite (M6) · anything Constructed.
