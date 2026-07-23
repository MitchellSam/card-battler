# CLAUDE.md — House Rules (card-battler)

Docs (all in `planning/` unless noted): `PROJECT_SPEC_v6.md` (canonical
product/architecture/run design) · `RULESET_v6.md` (complete current duel
rules; the engine is authoritative for implemented behavior) · `STATUS.md`
(state, gates, doc map — start here in a new session) · `EFFECT_CATALOG_v2.md`
(effect content: implemented + M5 backlog) · `DECK_SYSTEMS_PLAN.md` (future
deck-systems/win-condition architecture) · `MOBILE_DESIGN_HANDOFF.md` (UI
redesign) · root `RULES-GAPS.md` (generated — `npm run gen:rules-gaps`, never
hand-edit). Historical docs (spec v5, milestone briefs, sim findings, old
handoffs) were consolidated into the above on 2026-07-23 and deleted — they
live in git history.

**Prime directive:** never invent rules or content. Where the spec/briefs are
silent, tag `// RULES-GAP:`, implement the conservative reading, and leave the
decision to the design table.

## HARD RULE: NEVER hardcode rules in the UI (ratified 2026-07-20)

Every UI surface that states a rule — tooltips, hovers, buttons, confirm
popups, event-log lines, the Cheat Sheet, HUD badges — MUST render text and
values sourced from the rules engine. Stickers, per-seat config overrides, and
the planned deck systems/win conditions mean any hardcoded rules text is
already wrong in some duel (a live example: the Cheat Sheet said "draw 2" while
the boss plays a `drawPerTurn: 3` override).

- **Effect names/text:** `describeEffect(...)` over `effectiveCardEffect` /
  `effectiveFlipEffect` / `effectiveSuitEffect` (sticker- and
  Cheat-Sheet-aware, owner-aware). Never a rank/suit → text table in
  `packages/web`.
- **Config-dependent facts** (draw counts, ante, hand limit, Joker
  bankability, wall-punish mode, …): read `view.config` through `cfg`/`cfgFor`
  — per-seat overrides matter. `PlayerView.config` is PUBLIC by design (rules
  are never hidden information; boss cheats are visible).
- **Semantics the UI branches on** (e.g. "is this effect destructive?" for
  self-target warnings): add a machine-readable field to the engine's
  `EffectSpec` (pattern: `harm`) and read the registry — never an effect-id
  list in web code.
- **Derived numbers** (`monsterBasePower`, `sacrificeCost`, `effectivePower`,
  poker names via `GameResult`): always the engine's functions/results, never
  re-derived in web.
- **Allowed in web:** pure interaction copy ("Pick a target (highlighted)"),
  identity formatting (`faceLabel`), layout/styling. Litmus test: if the
  sentence would change when a rule, config knob, or sticker changes, it must
  come from the engine.
- **Every fix of this kind lands with a drift test** — see
  `packages/web/test/cardFace.test.ts` for the pattern (stickered/overridden
  card must show the engine text, must NOT show the default).

Engine-side counterpart: rules display text lives in the engine registries
(`EffectSpec.name`/`text` are THE anti-drift source), and no new
`switch (card.rank)`/`card.suit` rules logic outside `engine/src/cards.ts` and
`engine/src/effects.ts` (DECK_SYSTEMS_PLAN.md Phase 0).
