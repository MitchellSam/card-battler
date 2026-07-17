# Session Handoff — House Rules (working title)

---

## Goal

Ship a Steam roguelite card battler ("Run mode" first, Constructed PvP fast-follow) built on a designed-from-scratch tabletop game: standard 54-card poker decks, YuGiOh-style summoning/combat, MTG-style stack, win condition = best 5-card poker hand banked by deck-out. Theme: kids inventing and house-ruling their own card game (mixed-media craft aesthetic). Free demo → paid full. Solo dev (Mitchell, 5-10 hrs/week) + brother as co-designer.

## Role of this session

This chat is the **project's design partner and program manager**, not its coder. Responsibilities established over months: write implementation briefs for Claude Code sessions (just-in-time, never in advance), write/maintain the canon that constrains Claude Design sessions, run acceptance checks on claimed milestone completions, convert sim data into designer decisions, keep the spec current, and guard against the two recurring failure modes: **AI tools confabulating game content** (happened twice — mockups invented rules; the fix is canon-in-context every session) and **planning displacing shipping** (Mitchell's named pattern; the fix is one binary next action at all times, and refusing to write briefs before their inputs exist).

## Status

**State:** M2.5 in flight at Claude Code (ratified rules changes + re-simulation). M1 (headless engine, 84 tests, deterministic, ~900 games/sec) and M2 (sim harness, 5 agents, 520k games, zero crashes) are DONE and acceptance-verified.

## What Was Done (chronological, with the decisions that matter)

1. **Design interview** resolved the full decision tree: Run-first/PvP-fast-follow · free demo→paid, Steam · Electron over Tauri (steamworks.js, one runtime) · **plain TS event-sourced reducer, NOT XState** (cheap cloning + legalActions = what AI search and server-auth PvP both need) · staged AI (heuristic v1; difficulty from encounter design — bosses may visibly cheat, theme licenses it; ISMCTS later) · shrink-only run decks, floor 40 · sticker stack in schema/single-slot UI · Recast = separate typeOverride, keeps sticker slot · v1 = stickers+packs+events+sheet mods+ban list+favors; sleeves post-v1 · 2 pack tiers (Corner Store / Trade Binder) · seeded-pool random starter pack · art: placeholders → scanned real materials → contract artist for capsule only, NO AI-gen shipped assets · Windows launch, portability by discipline · demo = first act, progress carries · "Cheat Sheet" = the diegetic rules object AND tutorial surface · title deferred (working: House Rules; "You Just Lost: The Game" has recorded objections) · no Phaser (DOM/React + Motion; UI game, not sprite game) · PixiJS deferred-not-rejected as an effects overlay only (the one great idea: true holofoil shader on RARE stickers — the single glossy object in a handmade world).
2. **Mockup track (Claude Design):** 6 screens exist (Duel, CardAnatomy, NodeMap, Shop, CheatSheet, RunSummary), duel screen iterated to rules-accurate. Both tools invented content until CANON_FOR_DESIGN.md was created — it must be attached to EVERY design session. Last state: a canon-based fix-list prompt for the 5 new screens was issued; the corrected versions have NOT been re-verified.
3. **M1 engine** built from M1_IMPLEMENTATION_BRIEF (which inlined the full consolidated ruleset — the spec alone is NOT sufficient to code from). Produced RULES-GAPS.md (12 implementer questions).
4. **M2 sims** settled the old arguments: bank-trigger economy works (mindless aggro loses ~100% — feeding triggers); turtle stall impossible (draw clock bounds games) but mutual passivity = 0-0 draws; baseline pacing too slow; draw-2 fixes pacing AND poker engagement.
5. **Design session (brother) ratified everything** — recorded in M2.5_IMPLEMENTATION_BRIEF. Headlines: drawPerTurn 2 · game end ONLY at draw phase (failed draw) · first turn has NO battle phase · Poly's target card = first blackjack card (original intent) · no debuff floor (≤0 destroyed; K+Ace(11) now kills anything — WATCH ITEM) · Ace = 1/11 as Q/K discard · Poly Jokers shuffle back (edge: joker-only deck → forced stand) · direct attacks intercepted, not fizzled (multi-interceptor: defender picks, provisional) · mirror combat = mutual destroy, any position, no triggers · partial banks form real poker hands (KK pair beats 4-card ace-high) · **ante** (new): N random cards to public banks at start — Run-mode pacing lever, poker-themed, sticker-safe; N pending sim R1 · draws accepted in Constructed; in Run a draw ≠ win.

## What Is In Progress

- **M2.5 at Claude Code:** engine changes above + re-sims R0 (new baseline matrix), R1 (ante ∈ {0,5,8} → picks the Run ante), R2 (first-player check — combat mirrors were P2-favored 46% BEFORE adding no-battle-T1; if ≤43% after, flag), R3 (K+Ace kill-rate instrumentation).

## Key Decisions (rationale a fresh session must not relitigate)

| Decision | Why |
|---|---|
| Just-in-time briefs only | Briefs written before their inputs exist encode guesses that real outputs falsify; also feeds the planning-over-shipping pattern. M3 brief is written ONLY after M2.5 verifies, from actual outputs |
| Acceptance check before accepting any "done" | Coding sessions declare victory optimistically; M1's check forced real new work (determinism test, full scripted game) |
| Canon file in every design session | Both AI tools confabulate plausible game content; the fake "suit combo" rule propagated across two mockup files before being caught |
| Sim measures, designers decide | M2 was forbidden from tuning; config changes land only after ratification, then affected experiments re-run |
| Outcome-neutral config flags = sheet-mod content mine | E3/E5/E6 neutrality means severity variants are pre-balanced Run content, not dead experiments |
| Draws accepted | Only occur between two non-finishers; anti-draw valves all reward turtles; Run mode's "draw ≠ win" deletes the exploit rule-free |
| Ante over deck-removal for Run pacing | Random removal breaks sticker builds; ante shrinks effective deck, makes poker layer live turn 1, on-theme |

## Blockers / Open Questions

1. **Brother content-split** — STILL undecided after months; favor list, event spread, sheet-mod list, catalog expansion are M4/M5 blockers needing an owner. The single most recurring open thread.
2. **Run ante N + duel-count budget** — decided by R1 data; 40-turn duels × 8-12 duels overshoots genre run length (~45-60 min target).
3. **Watch items** (data-flagged, no action yet): K+Ace kill rate (R3) · first-player after stacked compensation (R2) · Run-duel human minutes (M3 playtests).
4. **Sheet-mod v1 list is >half written by accident** — accumulated candidates: whiteout No-Take-Backs (wall-punish off) · wall-punish: defender picks · Jokers bankable/wild · removed cards → graveyard instead of exile · ante size variants. Needs formal drafting to 6-8 (a brother task).
5. Mockup fix-pass unverified (see #2 above). Title decision deferred to Steam-page time.

## Next Steps (in order)

1. Verify M2.5 via acceptance check (each § has a test; determinism green; R0-R3 reports exist; findings addendum written; RULES-GAPS regenerated with only the 2 new provisional edges).
2. Ante decision from R1 → lock Run pacing numbers.
3. **Write M3 brief** (browser prototype, playable vs heuristic AI). Inputs: post-M2.5 engine API + events list, R0 baseline config, the 6 mockups + CANON (visual spec), component extraction (Card/Zone/StackEntry/PromptNote). Exit criterion: brother completes a full duel in browser. M3 is where wall-clock duel length gets measured for real.
4. Then M4 (Run layer) — needs the brother content decisions; force that conversation before M4, not during.

## Relevant Context

**File routing (attach per session type; all files current unless noted):**

| File | Give to |
|---|---|
| THIS HANDOFF | any new design-partner/PM session (alone is sufficient to resume the role) |
| UNIFIED_SPEC_v5.md | any session needing architecture/product context |
| M1_IMPLEMENTATION_BRIEF.md | reference only — contains the full inlined ruleset, but M2.5 supersedes conflicting lines |
| M2.5_IMPLEMENTATION_BRIEF.md | the authoritative rules delta; goes with types.ts to engine sessions |
| M2-FINDINGS.md + DESIGN_SESSION_AGENDA.md | historical record of the data → decisions chain |
| CANON_FOR_DESIGN.md | EVERY Claude Design session, no exceptions — needs a small update pass post-M2.5 (draw 2, no first-turn battle, ante, Poly target-as-first-card, partial hands) |
| CLAUDE_DESIGN_BRIEF.md | design sessions, alongside canon |
| RATIFIED_RULES_DELTA.md | stale duplicate of M2.5 — delete |

**Repo:** `card-battler/packages/engine` (dep-free, strict TS, vitest), `packages/sim`. Engine contract: `applyAction → {state, events}`, `legalActions`, `viewFor` (agents/UI see PlayerView only), `serialize`. Everything deterministic from seed + action log; outlier games kept as replays.

**Working agreements:** dense, direct, structure over filler; recommendations with reasoning, not options-dumps; push back with data; always end milestones with one binary next action; planning is bounded — when a decision tree is resolved, the next artifact is code, not another document.
