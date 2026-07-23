# STATUS — current state, gates & open decisions
## House Rules (working title)

**Snapshot: 2026-07-23.** Replaces the session handoffs (`HANDOFF_house_rules_project.md`, `HANDOFF_M4.md` — deleted; recoverable from git history). Keep this document current when milestones or gates move; it is the entry point for any new session.

## Where the project is

All work is committed directly to `main` (solo repo, no branches):

| Commit | What |
|---|---|
| M1 → M3.1 (several) | Engine · sim · M2.5 ratified rules · browser prototype · playtest round 1 (declinable flips, bank-trigger `margin` scaling) |
| `efd431f` | Playtest round 1 landed |
| `cf0ee5a` | **M4**: effect framework (REVISION 2: slotless stickers, context-free effects), per-seat config, `packages/run`, browser run loop, IndexedDB persistence |
| `2bc17a8` | Anti-drift enforcement: all UI rules text engine-sourced (CLAUDE.md hard rule) + `DECK_SYSTEMS_PLAN.md` |
| `e0b8498` | **UI redesign**: mobile-first Duel Screen (844×390) + converged desktop v2, shared Card/CardTile components |

Tests at last count: 232+ green (engine · run · sim · web); `npm run typecheck` clean.

## Gates (the things blocking "next")

1. **Human full-run gate (M4 exit):** a person completes a run start-to-finish in the browser (`npm run web`) — map → duels/events/shops → boss → summary; discoveries persist. Headless equivalent is green.
2. **Re-time 2–3 duels at steady state** (current build, ante 5, smarter auto-pass ON) → sets `MAP_CONFIG.actLength` (provisional 12). The last provisional map number.
3. **Brother's content-ratification pass** — all content is data files (`packages/run/src/data/`), so vetoes are config edits. The content split conversation itself is still the project's oldest open thread.
4. **Duel-screen sign-off on device** (mobile + desktop v2), then the remaining 5 screens get the same treatment (suggested order: NodeMap or CardAnatomy-as-zoom-spec first). See `MOBILE_DESIGN_HANDOFF.md`.

## Watch items (data-flagged, no action without designer sign-off)

- **K + Ace(11) = premier removal** (R3/R6: ~5 casts/game in greedy mirrors, 88% outright kills). Ratified with eyes open; watch in human play.
- **Banker-mirror first-player flip** (66% → ~13% P1 of decided games post-M2.5) — playtest item.
- **Discovery-pool feel:** with defaults pre-discovered, packs may feel samey early (knob: `preDiscovered`). Wants a human read.
- **Duel wall-clock:** ceremony fix landed (smarter auto-pass); steady-state minutes unknown until gate 2.

## Open decisions

- **7 RULES-GAPS** (see generated `RULES-GAPS.md`): Doorstop knock-ons · Warning Shot reveal position · Leverage vs Everlasting · multi-interceptor choice · Joker-only Poly deck · boss-loss rematch · run-draw semantics.
- Strike tuning (boss = 2? close-loss softening?) — shipped simplest (3 flat), tune in playtest.
- Final title (deadline: Steam-page creation).
- Sheet mods 6 vs 8 (Wild Jokers + Recycling need engine work — M5).

## M5 scope (next milestone, not yet briefed)

Remaining catalog commons (feint, stall, undertow, short-fuse, copycat, tax, graft) + uncommons + all rares incl. **Recast** behavior · in-duel favors (ride the per-seat overlay) · Wild Jokers + Recycling sheet mods (engine work + re-sim) · ban-list UI · balance passes (sim + human). Brief is written just-in-time from real inputs — never in advance.

## Document map

| Doc | Role |
|---|---|
| `planning/PROJECT_SPEC_v6.md` | Product, architecture, run-mode design (canonical) |
| `planning/RULESET_v6.md` | Complete current duel rules (engine is authoritative for implemented behavior) |
| `planning/EFFECT_CATALOG_v2.md` | Effect content: implemented registry mirror + M5 backlog |
| `planning/DECK_SYSTEMS_PLAN.md` | Future deck systems / win conditions — decision record + phased plan |
| `planning/MOBILE_DESIGN_HANDOFF.md` | UI redesign state: canvases, floors, components, ratified interactions |
| `planning/STATUS.md` | This file |
| `RULES-GAPS.md` (root) | Generated open rules questions (`npm run gen:rules-gaps`) |
| `CLAUDE.md` (root) | Prime directive + the NEVER-hardcode-rules-in-UI hard rule |
| `mockups/uploads/CANON_FOR_DESIGN.md` | Canon for Claude Design sessions — attach to EVERY design session, no exceptions |
| `results/*/REPORT.md` | Sim experiment reports (raw JSONL regenerates from seeds) |

## Working agreements (carried from the PM handoff — do not relitigate)

- **Just-in-time briefs only** — a brief written before its inputs exist encodes guesses.
- **Acceptance check before accepting any "done"** — coding sessions declare victory optimistically.
- **Canon-in-context for every design session** — both AI tools have confabulated game content without it.
- **Sim measures, designers decide** — config changes land only after ratification.
- **One binary next action at all times** — planning is bounded; when a decision tree is resolved, the next artifact is code.
- **Prime directive:** never invent rules or content; tag `// RULES-GAP:`, conservative reading, design table decides.
