# PROJECT SPEC v6 — product, architecture & run-mode design
## House Rules (working title)

**Status:** consolidated 2026-07-23. Supersedes `UNIFIED_SPEC_v5.md` and the ratified portions of `M4_DESIGN_RECOMMENDATIONS.md` (both deleted; recoverable from git history). Where v5 conflicted with later ratifications (REVISION 2's slotless stickers, favors-as-meta-progression, per-seat config, IndexedDB-first persistence), this document records the ratified state. Duel rules live in `RULESET_v6.md`; current project state and gates live in `STATUS.md`; future deck systems in `DECK_SYSTEMS_PLAN.md`.

---

## 1. Product definition

- **Title:** deferred; working name **House Rules**. Locked at Steam-page creation. ("You Just Lost: The Game" remains on the candidate list with recorded concerns: dated meme, SEO collision, communicates nothing about genre, leads with "Lost.")
- **Theme:** kids inventing and house-ruling their own card game. Mixed-media craft aesthetic (crayon, construction paper, stickers, whiteout, photocopied paper). The UI *is* the fantasy — desk-paper look is the anchor across all screens.
- **v1 scope:** **Run mode only** (solo roguelite). Constructed PvP is a fast-follow, not v1.
- **Commercial model:** free demo → paid full, Steam. No gacha, no FOMO passes (standing rejection).
- **Platform:** Windows at launch; Mac/Linux post-launch, preserved by architecture discipline (§5.4).
- **Team:** Mitchell (design + engineering), brother (co-designer; content-drafting split still the open conversation). Capacity 5–10 hrs/week; scope discipline is the primary schedule lever.

## 2. Vocabulary (canonical)

| Term | Meaning |
|---|---|
| **Sticker** | An effect applied to a card or a Cheat Sheet suit slot, covering the default. **Slotless** — any sticker fits any non-Joker card; placement decides the trigger (see RULESET §9). |
| **Sheet mod** | Global rule change scrawled on the Cheat Sheet, applies to the whole duel (both players). Each = exactly one `RulesConfig` field. Whiteout mods = a flag turned off. |
| **Sheet sticker** | A sticker on one of the Cheat Sheet's 4 suit slots — replaces that suit's spell for YOUR casts only (asymmetric, public). |
| **Cheat Sheet** | The in-game rules-reference object; doubles as tutorial/reference UI. Applied sheet mods and sheet stickers are visibly scrawled on it. |
| **Favor** | Between-run progression perk: unlocked by account milestones, equipped ≤2 as a pre-run loadout. Never sold in-run. |
| **Strike** | Run life. Start with 3; any duel loss costs 1; 0 = run over. |
| **Discovery pool** | Permanent account-level set of every effect ever unlocked. Packs pull from it; picking an undiscovered win-reward unlocks it. |
| **Ante** | N random cards moved from deck-top to the public bank at duel start (Run pacing lever; ratified N=5). |
| **Allowance** | Permanent starting-money baseline for new runs. |
| **Sleeve** | Portable effect holder, movable between cards. **Post-v1.** |

## 3. Base ruleset

`RULESET_v6.md` is the complete current duel ruleset (Constructed ground truth = `DEFAULT_CONFIG`). Canonical guards against drift — no tool or mockup may invent rules; balance flows through versioned data (RulesConfig + the effect registry), never engine rewrites. Run mode layers on top; Constructed uses it untouched.

## 4. Run mode — resolved design (post-REVISION 2)

### 4.1 Deck
- Composition fixed at 54; **shrink-only** during a run (protects the poker win condition). Removal floor 40.
- Removal is a tempo weapon: deck-out ends the game and best bank wins, so shrinking accelerates the clock.

### 4.2 Stickers & effects (ratified REVISION 2, 2026-07-19)
- **Slotless stickers, context-free effects** — full semantics in RULESET §9. Data model: `RunCard.stickerStack` (top wins); `RunState.sheetStickers` → `config.suitOverrides`.
- **Base-game defaults are poolable, pre-discovered stickers** — players rearrange/duplicate the base game to taste. Provisional tiers: number flips common, J/Q/K + suits uncommon.
- **Apply-on-acquisition:** a granted sticker is immediately placed on a legal card (or skipped, forfeiting it). No sticker inventory in v1; the Swap Meet event is the re-slot valve.
- **Recast** (type conversion) remains a separate per-card `typeOverride`, not a sticker — schema landed, behavior M5. Jokers cannot be stickered (revisit with Recast).

### 4.3 Rewards & discovery
- **Every duel win offers a pick-1-of-3 sticker** (tier-weighted per encounter; elites/boss richer), drawn from ALL implemented effects — discovered ones included (copies are useful), undiscovered ones flagged NEW. **Picking an undiscovered sticker unlocks it** — THE discovery channel.
- Packs pull from the *unlocked* pool. Two tiers at launch — Corner Store (cheap, common-weighted) and Trade Binder (expensive, best-tier guarantee) — as config objects, with **grace degradation**: a tier reference resolves to the best implemented-and-discovered tier ≤ it (a "guaranteed rare" honestly yields an uncommon until rares exist).
- Shop = packs (restock per visit via `stockPerVisit`) + "Trim a Card" single (floor 40). No favor shelf.
- Boss win = pick-1-of-3 including ≥1 sheet mod, plus currency; demo discoveries carry into the full game.
- Allowance ramps over the first ~10 runs, then plateaus (provisional).

### 4.4 Favors (between-run meta-progression)
- Unlock from account milestones (runs completed / runs won / discoveries — thresholds in `packages/run/src/data/favors.ts`); equipped ≤2 as a pre-run **loadout** on the account home. Fresh accounts have zero favors.
- v1 set (7, economy/run-layer): Pack Rat, Lucky Coin, Sharpie Stash, Trade Binder Regular, Do-Over (one extra mulligan), Ban Runner, Second Wind (once/run, a loss costs no strike).
- In-duel favors (Study Hall, Quick Study, Thick Skin, Teacher's Pet, Piggy Bank) ride the per-seat config overlay in **M5**.

### 4.5 Sheet mods (v1 = 6, zero engine cost)
No Take-Backs `{wallPunish:false}` · Everlasting `{queenBuffDuration:'permanent'}` · Big Hand `{handLimit:8}` · Fast Rules `{drawPerTurn:3}` · High Stakes `{ante:8}` · Sudden Death `{bankTriggerScaling:'power'}`. Stretch (M5, need engine work): Wild Jokers (`jokersBankable` + wild flush scoring), Recycling (`removedDestination: 'graveyard'`).

### 4.6 Events (12 shipped, closed-union outcomes)
Lemonade Stand, Found a Pack, Yard Sale, Swap Meet, Trim a Card, Double Down, The Dare, Mystery Box, The Bully, Overtrim, Recess (+1 strike, cap 3), Rival Riley. Outcomes are a closed union (`gainCurrency | grantSticker | pickSticker | removeCard | restoreStrike | eliteDuel | loseCurrency | moveSticker | duplicateSticker`), NOT a scripting language; risk-event downsides are currency/sticker/deck-quality, never HP. Text/choices in data files.

### 4.7 Run structure & failure
- **Strikes: 3, flat** (boss loss also 1; Recess restores). Ratified as the simplest version; boss-costs-2 and close-loss softening are playtest tunables.
- **Map:** seeded StS-style branching DAG — ~6 columns pre-boss, 2–4 wide, equal path lengths, boss = single terminal node; ≥1 shop per path, no adjacent elites. Node weights: Duel ~45% / Event ~25% / Shop ~12% / Elite ~10% / Treasure ~8%. **Act length provisional at 12 nodes — gated on re-timed duels** (the interaction-ceremony fix landed; steady-state duel minutes not yet re-measured).
- **Encounter ladder — difficulty via config, not smarter AI:** greedy agent everywhere. Standard = RUN_CONFIG (ante 5). Elite = +1 ante override. **Act-1 boss "The Grown-Up" = ONE legible visible cheat** (default `overrides[AI] = { drawPerTurn: 3 }`, data-swappable), scrawled on the duel screen + Cheat Sheet.
- A run replays deterministically from `runSeed` + the action log + duel outcomes.

## 5. Engineering architecture

### 5.1 Stack
- **Client:** React + TypeScript, browser-first. **Electron** wrap at the Steamworks milestone (steamworks.js; Tauri rejected). No Phaser (UI game, not sprite game); PixiJS deferred-not-rejected as an effects overlay only (holofoil shader on rares).
- **Engine:** plain TS event-sourced reducer — NOT XState. Pure, deterministic, cheap cloning; the API that AI search and server-authoritative PvP both need.
- **Persistence:** versioned `Storage` interface — IndexedDB in web (current), in-memory for tests, SQLite behind the same interface at Electron (M6).
- **Repo:** single repo, npm workspaces, no monorepo tooling. All milestones commit directly to `main` (solo repo).

### 5.2 Engine contract (non-negotiable — PvP fast-follow depends on it)
```ts
applyAction(state, action, rng) => { state, events }   // pure
legalActions(state, player) => Action[]
viewFor(state, player) => PlayerView                   // redacted; config/overrides PUBLIC
serialize(state) / deserialize(...)
```
- **Two-layer log:** coarse *actions* (replay input) in, fine-grained *events* out (UI animation, log, replay rendering). Action log + seed reproduces any game.
- `viewFor` from day one; agents and UI read PlayerView only. Zero UI coupling; zero unseeded randomness.
- **Rules-as-parameters:** every variable rule is a `RulesConfig` field; per-seat asymmetry via `overrides` read through `cfg()`; per-seat suit spells via `suitOverrides`. All PUBLIC — rules are never hidden information.
- **Effect registry** (`effects.ts`): data-driven `EffectSpec` with `name`/`text` as THE anti-drift display source, machine-readable semantics fields (`harm`, targets, fuel). No rank/suit switches outside `cards.ts`/`effects.ts` (DECK_SYSTEMS_PLAN Phase 0).

### 5.3 Packages
- `packages/engine` — headless rules engine (M1 + M2.5 + M4 effect framework).
- `packages/sim` — 5 heuristic agents over PlayerView, deterministic runner, JSONL records, report generator; `/browser` subpath for the web client.
- `packages/run` — pure event-sourced run reducer; duels stay OUTSIDE (`startDuel` → `DuelSpec`; shell feeds back `duelOutcome`); mapgen, data files, Storage.
- `packages/web` — Vite + React. **Zero rules logic:** affordances filter `legalActions()`, prompts come from `state.pending`, text from the engine registries (CLAUDE.md hard rule + drift tests).

### 5.4 Portability
Platform code confined to a thin Electron main-process layer; path-safe file handling; CI builds all three OSes early (dev already spans Mac + Linux).

## 6. AI

Staged: **heuristic v1** (scoring over `legalActions`, 1–2 ply combat lookahead — the greedy agent), search-ready engine forever. **Difficulty comes from encounter design, not engine intelligence** — bosses visibly cheat via config, which the theme licenses. ISMCTS/determinization is a post-v1 drop-in when PvP practice bots justify it.

## 7. Presentation & onboarding

- **UI layout system (2026-07-23):** mobile-first. The Duel Screen was redesigned for a landscape phone (844×390 logical canvas, GDKeys-derived zoning: hero corners, 60/40 asymmetric board, persistent timeline/stack band, right-rail detail + actions) and **desktop converges on the same zoning grammar** with desktop affordances (persistent log, wide detail rail, hotkey zoom). Spec + state: `MOBILE_DESIGN_HANDOFF.md`. Mockups are Design Components in `mockups/` (Claude Design workflow; `CANON_FOR_DESIGN.md` must ride along in every design session — both AI tools have confabulated rules without it).
- **Art pipeline:** programmer placeholders → real-materials pass (scanned construction paper, crayon, real stickers/whiteout) → contract artist for Steam capsule/key art only. **No AI-generated shipped assets.**
- **Tutorial (v1, fixed):** scripted first duel + Cheat-Sheet-as-diegetic-reference + hover tooltips. Nothing more.
- **Sound:** physical craft SFX (sticker peel, marker squeak, paper riffle).

## 8. Demo (Steam)

First act of a run, fixed node count; full loop taught; ends before build-defining rares bloom. Demo discovery-pool progress carries into the full game. The demo's first duel doubles as the tutorial.

## 9. Validation

- Sim harness validates **pacing** and exposes **degeneracy** (≥10k games per config; 870k+ run to date); it cannot validate fun — that's human playtests (brother = playtest lead).
- **Standing lesson (playtest rounds 1–2): duel wall-clock is dominated by interaction ceremony, not turn count.** 66% → 62% of human actions were pass/nextPhase before the smarter auto-pass landed (auto-pass unless you actually hold a live response; interruptible with a RESPOND button). Re-timing 2–3 duels at steady state is the gate for act length. Last-resort lever (designer-only, not recommended): simplify full MTG priority to single-response windows.
- Headline verdicts on the current baseline: pacing in band (greedy-mirror median 42 turns), poker layer engaged (FH+quads ≈ 78% of winning hands with margin scaling), ante 5 kills the mutual-passivity draw class. Reports in `results/*/REPORT.md` (regenerable from seeds).

## 10. Milestones

| # | Milestone | Exit criterion | Status |
|---|---|---|---|
| M0 | Spec; brother-role conversation | Content ownership decided | spec ✅ · conversation still open |
| M1 | Headless engine | Complete scripted game via tests alone | ✅ committed |
| M2 (+2.5) | Sim harness + ratified rules re-sim | Pacing data; median in band | ✅ committed |
| M3 (+3.1) | Browser prototype | Brother completes a duel in-browser | ✅ implemented · human gate pending |
| M4 | Run mode layer | Full run completable start-to-finish | ✅ implemented · human full-run gate pending |
| — | UI redesign (mobile-first duel screens) | Both duel screens signed off on-device | in progress (screens 2–6 remain) |
| M5 | Content + balance (remaining catalog, rares/Recast, in-duel favors, Wild Jokers/Recycling, ban-list UI) | Run mode is fun per playtesters | next |
| M6 | Electron, Steamworks, real-materials art, demo build | Demo runs from Steam | — |
| M7 | Steam page, wishlists, Next Fest, launch | Demo live → release | — |
| — | Fast-follow: Constructed PvP (server-authoritative) | — | post-launch |

Current gates and open decisions: `STATUS.md`.

## 11. Provisional numbers (tune in playtest, none blocking)

Removal floor 40 · strikes 3 flat · ante 5 (Run) · act length 12 nodes (gated on re-timed duels) · favor slots 2 · ban list unlock at 20 discoveries, 5 slots +1/10 (UI in M5) · allowance ramp ~10 runs · pack odds from sim data.
