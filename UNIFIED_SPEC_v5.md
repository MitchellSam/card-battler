# House Rules (working title) — Unified Implementation Spec v5

**Status:** Design tree resolved. Next action is code (Milestone 1).
**Supersedes:** HANDOFF v1-v4. Those documents remain historical record; where they conflict with this document, this document wins. `EFFECT_CATALOG_v1.md` remains live content but its "cover" terminology is retired (see Vocabulary).

---

## 1. Product definition

- **Title:** deferred. Working/project name: **House Rules**. Final title locked at Steam-page creation. ("You Just Lost: The Game" is on the candidate list with recorded concerns: dated meme reference, SEO collision with meme content, communicates nothing about genre, leads with "Lost.")
- **Theme:** kids inventing and house-ruling their own card game. Mixed-media craft aesthetic (crayon, construction paper, stickers, whiteout, photocopied-paper palette).
- **v1 scope:** **Run mode only** (solo roguelite). Constructed PvP is a fast-follow, not v1.
- **Commercial model:** **free demo → paid full**, Steam. No gacha, no FOMO passes (standing rejection).
- **Platform:** **Windows at launch.** Mac/Linux post-launch. Portability preserved by architecture rules (§6), not shipped.
- **Team:** Mitchell (design + engineering), brother (co-designer; role beyond that **TBD** — content-drafting ownership is the recommended split and the open conversation to have).
- **Capacity:** 5-10 hrs/week. Honest timeline: M1-M3 ≈ 4-6 months; full v1 ≈ 18-30 months. Scope discipline is the primary schedule lever.

## 2. Vocabulary (canonical)

| Term | Meaning |
|---|---|
| **Sticker** | Effect applied to a single card, covering its default. (Retires "cover" as a noun.) |
| **Sleeve** | Portable effect holder, movable between cards. **Post-v1.** |
| **Sheet mod** | Global rule change applied to the Cheat Sheet. Rarest tier. |
| **Cheat Sheet** | The in-game rules-reference object. Confirmed name. Doubles as tutorial/reference UI; applied sheet mods are visibly scrawled on it. |
| **Discovery pool** | Permanent account-level set of every effect ever found. Packs draw from it. |
| **Allowance** | Permanent starting-money baseline for new runs. Distinct from in-run currency. |

## 3. Base ruleset (canonical baseline — Constructed ground truth)

The full tabletop ruleset in `HANDOFF_card_battler_design_v2.md` is the canonical baseline. "Canonical" guards against design drift (no tool or mockup may invent rules); it does not mean immutable — the **engine API is stable, while rules live as versioned data** (RulesConfig + effect definitions), so balance changes flow through data, never through engine rewrites. Baseline content: 54-card decks (52 + 2 jokers), summoning/positions, flip effects, combat + wall-punish, banking (unlimited bank, best-5 poker hand, bank-or-remove triggers), MTG-style full-priority stack, face-card rank/suit spell table, Polymerization blackjack, number-card flip table, jokers = Pot of Greed. No changes this session. Run mode layers on top of it; Constructed (fast-follow) uses it untouched.

## 4. Run mode — resolved design

### 4.1 Deck
- **Composition fixed at 54; shrink-only during a run.** No card addition, ever (protects poker-hand win condition).
- Removal is a **tempo weapon**: deck-out ends the game and best bank wins, so shrinking accelerates the clock — desirable when ahead on bank.
- **Removal floor: 40 cards** (provisional, tune in sim/playtest) to block degenerate insta-deck-out builds.

### 4.2 Card modification
- **Sticker slot = a stack in the schema, single-slot in the UI.** `effectiveEffect = top(stickerStack) ?? defaultEffect`. Peelable-stack UI is post-launch; data model supports it from day one.
- **Recast (type conversion) is a separate per-card `typeOverride` field, not a sticker-slot occupant.** A Recast card converts type AND retains an open sticker slot (designer decision). Conversion rules: face→monster = flat 10 power / 2-sac cost; number→spell = sorcery-speed, no cost scaling.
- Ace and 10 flip slots excluded from the common sticker pool (standing decision).

### 4.3 v1 feature set
| Feature | v1? | Notes |
|---|---|---|
| Stickers + packs | ✅ | Core loop |
| Events (?-nodes) | ✅ | Resource / power / genuine-risk categories |
| Sheet mods | ✅ | **Curated list of ~6-8 only**, each mapping to one pre-built engine parameter. No general rule editor. Whiteout deletion = flag-off mods. |
| Ban list | ✅ | Pack-pull filter + shoebox UI. Unlocks at 20 discoveries; 5 slots +1 per 10 further (provisional). |
| Favors/perks | ✅ | "Always in stock" capped at **2 slots** (provisional). |
| Sleeves | ❌ post-v1 | Schema-safe to add later (inventory item: effect ID + attachment pointer). |
| Achievement → alt Cheat Sheets | ❌ post-v1 | Content update material. |

### 4.4 Economy
- **Starter pack: random from discovery pool, with a seeded pool.** New saves seed the discovery pool with a fixed starter set (~8-10 effects). Early runs are quasi-deterministic (teaches systems); variance ramps as the pool grows. No special-case code.
- **Pack tiers: two at launch** — Corner Store (cheap, common-weighted) and Trade Binder (expensive, guaranteed rare). Packs are config objects (`{cost, rarityWeights, guarantees}`); "Big Kid" middle tier added when catalog exceeds ~50 effects.
- **Reward channels (unchanged from v4):** duel wins grow the discovery pool; packs access it; starter loadout resets per run.
- **Allowance:** ramps over first ~10 runs, then plateaus (provisional curve).

## 5. AI

- **Staged: heuristic v1, search-ready engine forever.**
- v1: scoring heuristic over `legalActions`, 1-2 ply lookahead on combat math.
- **Difficulty comes from encounter design, not engine intelligence.** Run bosses may visibly cheat (asymmetric rules), which the theme explicitly licenses.
- ISMCTS/determinization is a post-v1 drop-in (hidden-information game; vanilla MCTS does not apply), justified when PvP practice bots exist.

## 6. Engineering architecture

### 6.1 Stack
- **Client:** React + TypeScript, browser-first development. **Electron** wrap at the Steamworks milestone (steamworks.js; same runtime as eventual PvP backend; Tauri rejected — Rust glue layer for no benefit that matters on Steam).
- **Engine:** **plain TS event-sourced reducer — not XState.** (Reverses v3.) XState models the phase cycle well and everything else awkwardly; a pure reducer gives determinism, replay, undo, action-based network sync, and cheap cloning — the exact API AI search and server-authoritative PvP both need.
- **Persistence:** SQLite (local saves, discovery pool, run state).
- **Repo:** single repo, `engine/` as a workspace package. Monorepo tooling deferred until the PvP repo split actually exists.

### 6.2 Engine contract (non-negotiable — PvP fast-follow depends on it)
```ts
applyAction(state: GameState, action: Action, rng: SeededRNG) => { state: GameState, events: GameEvent[] }  // pure
legalActions(state: GameState, player: PlayerId) => Action[]
viewFor(state: GameState, player: PlayerId) => PlayerView   // redacted: hands, deck order, set cards
serialize(state) / deserialize(...)   // full round-trip
```
- **Two-layer log:** the reducer consumes coarse *actions* (player intents — the replay input) and emits fine-grained *events* (`AttackDeclared`, `PriorityPassed`, `FlipTriggered`, `CardBanked`, `MonsterDestroyed`, ...). The event stream drives UI animation, the notebook-margin log, and replay rendering; the action log alone reproduces any game deterministically.
- `viewFor` is a required contract from day one, even in single-player — it is what a future server sends to clients, and what keeps the heuristic AI honest (the AI reads its own PlayerView, never FullGameState).
- Zero UI coupling. Zero unseeded randomness. Hidden-information zones modeled server-authoritative-ready (a future server holds true state; clients receive redacted views).
- **Rules-as-parameters:** every rule a sheet mod can touch is a field in a `RulesConfig` object (`wallPunish`, `handLimit`, `bankTriggers`, ...), defaulting to the frozen base ruleset. Constructed = default config, always.

### 6.3 Core schema sketch
```ts
Card      { id, rank, suit }                              // immutable, 54 per deck
RunCard   { cardId, stickerStack: EffectId[], typeOverride?: 'monster'|'spell' }
Effect    { id, tier: 'common'|'uncommon'|'rare', slotConstraint, ... }  // data-driven
Pack      { id, cost, rarityWeights, guarantees }          // config, not code
RunState  { deck: RunCard[], sheetMods: RulesConfigPatch[], currency, nodeMap, ... }
Account   { discoveryPool: EffectId[], allowance, banList: EffectId[], favors, ... }
```

### 6.4 Portability rules (Windows-first, Mac/Linux later)
- Platform-specific code confined to a thin Electron main-process layer.
- Path-safe file handling only (`path` APIs, `app.getPath`).
- CI builds Win/Mac/Linux from early on (dev already happens on Mac + Bazzite, so runtime breakage surfaces naturally).
- Mac shipping cost deferred: Apple dev account + notarization pipeline.

## 7. Presentation & onboarding

- **Art pipeline:** programmer placeholders → **real-materials pass** (scanned/photographed construction paper, crayon, actual sticker sheets, real whiteout) → **contract artist for Steam capsule/key art only.** **No AI-generated shipped assets** (Steam disclosure requirement, hostile audience segment, and stylistic mismatch with the handmade aesthetic).
- **Tutorial (v1 scope, fixed):** scripted first duel + Cheat-Sheet-as-diegetic-reference + hover tooltips. Nothing more.
- Sound identity: physical craft SFX (sticker peel, marker squeak, paper riffle) — cheap to source, on-theme.

## 8. Demo (Steam)

- **First act of a run, fixed node count.** Full loop taught; ends before rare-tier build-defining stickers bloom.
- Demo discovery-pool progress **carries into the full game**.
- Demo's first duel doubles as the tutorial — no separate content.

## 9. Validation plan

- **Match pacing is validated by simulation before any UI exists:** AI-vs-AI harness over the headless engine, ≥10k games per config. Per-run metrics: game length (median/min/max turns), bank size at end, best poker hand achieved, attack-vs-defense action ratio, per-rank set rate and turns-until-flip (validates the 8-10 flip-effect risk), flip trigger frequency, spell usage by card, sacrifice-summon frequency, wall-punish frequency and bank damage dealt, Joker impact on win rate, cards remaining at game end, first-player win rate. Tunes: removal floor, mill rates, pack odds, wall-punish severity.
- **Scope of validity:** heuristic-AI sims validate *pacing* and expose *degeneracy* (e.g., double-turtle stall, first-player advantage); they cannot validate fun or strategic tension. The project's core design risk — whether "should I bank this?" stays a live question all game — is answered only by human playtests (M3+), not the harness.
- Human playtests (brother = playtest lead) begin at the browser prototype milestone.

## 10. Build order & milestones

| # | Milestone | Exit criterion |
|---|---|---|
| M0 | This spec; brother-role conversation | Content-drafting ownership decided |
| M1 | Headless engine: types, reducer, `legalActions`, seeded RNG, full base ruleset, unit tests | A complete scripted game plays via tests alone |
| M2 | Sim harness + heuristic AI v0 | Pacing data exists; median game length in target band; floor/mill tuned |
| M3 | Browser prototype (ugly, playable vs AI) | Brother completes a full duel in-browser |
| M4 | Run mode layer: node map, stickers/packs/discovery pool (SQLite), events, sheet-mod flags, ban list, favors | A full run is completable start to finish |
| M5 | Content + balance: catalog expansion, favor/event/sheet-mod lists, sim + human playtests | Run mode is fun per playtesters, not just functional |
| M6 | Electron wrap, Steamworks, real-materials art pass, capsule commission, demo build | Demo build runs from Steam |
| M7 | Steam page, wishlists, Next Fest, launch | Demo live → full release |
| — | Fast-follow: Constructed PvP (server-authoritative Node backend, Colyseus/ws, seasons) | Post-launch |

## 11. Provisional numbers (all tune-in-playtest, none blocking)

Removal floor 40 · ban list unlock at 20 discoveries, 5 slots +1/10 · favor stock cap 2 · starter seed pool 8-10 effects · allowance ramp ~10 runs then plateau · pack odds TBD from sim data.

## 12a. Open rules questions (decide with brother before M1 encodes them)

1. **Wall-punish card selection:** the removed bank card is "not the attacker's choice" — but who chooses? Defender-picks (brutal) vs random (gamble) vs attacker-picks (toothless) changes the rule's severity enormously. The ruleset is silent.
2. **Banked Jokers:** banking allows "any card in hand," and hands contain Jokers. Can a Joker be banked, and what is it in poker scoring? A full wild would dwarf every rare (Wildcard Bank's deliberate narrowness implies wilds were never intended) — but it's unwritten. Likely answer: Jokers cannot be banked; must be explicit.
3. **Polymerization initial deal:** blackjack-style, but does the mini-game auto-deal 2 cards before HIT/STAND (as the mockup assumed) or start from zero draws? Standing at zero is nonsense, so something is unstated.

## 12. Open items (content drafting, not decision forks)

1. Brother role conversation (only true open *decision*).
2. Favor list (target ~10-12 with unlock conditions).
3. Event spread across resource/power/risk (target ~15-20 nodes).
4. v1 sheet-mod list (6-8, each = one `RulesConfig` field).
5. Effect catalog expansion, commons first (evening slot coverage across 2-9).
6. Final title (deadline: Steam-page creation).
