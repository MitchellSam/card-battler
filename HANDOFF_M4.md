# Session Handoff — M4 Run Mode Layer

> Implementation handoff for the M4 milestone. (The design-partner/PM handoff is a separate artifact: `HANDOFF_house_rules_project.md`.)

---

## Goal

Implement M4 (the roguelite run-mode layer) per `M4_IMPLEMENTATION_BRIEF.md`: node map → duels/events/shops → boss → run summary, with effect stickers, per-player config (boss cheats), packs, a discovery pool, strikes, and IndexedDB persistence. Exit gate (spec §10): a full run is completable start to finish in the browser. Mid-session the design pivoted (REVISION 2), rewriting the sticker/effect model and the favor/reward economy.

## Status

**State:** In Progress — M4 fully implemented, all tests green, **awaiting the human full-run gate** (a person completing a run start-to-finish in the browser) and the brother's content-ratification pass (data-file edits only).

- 232 tests green: 167 engine · 42 run · 5 sim · 18 web.
- `npm run typecheck` clean (0 errors). `npx vite build` bundles clean.
- Browser-verified headless (Chromium) at each stage. Nothing committed yet — this session's work is the first M4 commit.

## What Was Done

Delivered in four passes (see the memory file `project_house_rules_card_battler.md` for the blow-by-blow):

**1. M4 core (Parts A/B/C of the brief)**
- **A1 — effect framework:** new `packages/engine/src/effects.ts` registry; `describeEffect` is THE anti-drift source (web tooltips render it, duplicated tables deleted from `cardFace.ts`).
- **A2 — per-player config overlay:** `RulesConfig.overrides` + `cfg()`/`cfgFor()` accessor (`packages/engine/src/config.ts`) over the 5 per-seat fields; public in `viewFor` (boss cheats are visible).
- **Part B — `packages/run`** (new pure package): event-sourced `applyRunAction`/`legalRunActions`, seeded DAG `mapgen.ts` (≥1 shop/path, no adjacent elites), data files (encounters/events/favors/packs/sheetMods/seed/config), grace-degraded pack tiers, strikes, `Storage` interface (`InMemoryStorage` + web `IdbStorage`). Headless full-run test drives REAL engine duels deterministically.
- **Part C — web run mode:** `Root.tsx` router, `RunSession` store, `RunShell` screens (SVG node map, shop, events, sticker screens via `DeckViewer`, boss reward, summary), `RunDuel` builds `GameSession` from a `DuelSpec`. `DuelScreen` extracted from the old `App` default export so it's embeddable.

**2. Feedback round 1** (Mitchell, force-win walkthrough): favor descriptions in shop; packs restock within a visit (`stockPerVisit` data field, default unlimited); pack pull = pick-1-of-3 within the rolled tier; post-duel "AFTER THE DUEL" rewards note on the map.

**3. REVISION 2** (major design pivot — see the section atop `M4_DESIGN_RECOMMENDATIONS.md`):
- **Favors are between-run progression** — unlock from account milestones (`favors.ts` data), equipped ≤2 as a pre-run loadout on the account home; shop favor shelf REMOVED.
- **Stickers are slotless** — any sticker on any non-Joker card; the sticker IS the card's effect (number→flip, face→rank spell). **Suit spells live on the Cheat Sheet** (`config.suitOverrides`, per-seat, public, asymmetric — only your casts change).
- **Effects are context-free** — one `resolveEffectCore` in the reducer + shared `packages/engine/src/params.ts` (target/fuel enumeration+validation for casts AND flips). `SpellEffectKey` ('J-rank' etc.) is gone; stack items carry `EffectId`s ('default:J', 'peek', …).
- **Base-game defaults are poolable stickers** (pre-discovered).
- **Every duel win → pick-1-of-3** drawn from ALL implemented effects, NEW-badged; picking an undiscovered one unlocks it (THE discovery channel).

**4. Bugfixes** (Mitchell): StrictMode double-mount was disposing the fresh `GameSession` (dead buttons until dev-panel restart) → added `GameSession.activate()`; suit tooltips ignored Cheat Sheet stickers → `cardTooltip` now takes `suitOverrides` (threaded through Board/Zone/DeckViewer); dispatch guard drops clicks landing while the AI holds priority.

## What Is In Progress

Nothing half-finished in code — every pass ended green. The milestone itself is "implemented, awaiting human gate." The next real work is **playtesting**, not coding.

## Key Decisions

| Decision | Why |
|---|---|
| Slotless stickers + context-free effects (REVISION 2) | Mitchell's intent: "a kid sticks a sticker wherever." Needed one effect definition resolvable in any trigger context, not slot-typed effects. |
| Cheat-sheet suit stickers are asymmetric (only your casts) | Ratified via AskUserQuestion — it's a power-up you scrawl on your own sheet, not a shared rule change. |
| Favors = milestone unlocks, not in-run purchases | Ratified — favors are the persistent roguelite meta-progression; buying them mid-run conflated two systems. |
| Every-win pick-1-of-3 replaces the silent per-win discovery | Wins felt unrewarded (coin ticked silently) AND the discovery channel was a no-op with only 9 effects all seed-discovered. Unlock-on-pick fixes both. |
| Base-game defaults are poolable/pre-discovered stickers | Lets players rearrange the base game; also makes packs useful from run 1 (they pull the unlocked pool). Knob: `preDiscovered` per spec. |
| Committed to `main` (no feature branch) | Every prior milestone (M1–M3, playtest-1) is a direct commit to `main`; solo hobby repo, no PR workflow. Followed the established convention on explicit request. |

## Blockers / Open Questions

- **Act length still provisional (12 nodes incl. boss)** — gated on re-timed duels (spec §6 Top Risk: the interaction-ceremony problem). No code depends on the number beyond `MAP_CONFIG.actLength`.
- **Discovery-pool feel** — with defaults pre-discovered, packs may feel samey early; catalog stickers gate purely behind win-picks now. Knob is `preDiscovered`. Wants a human read.
- **Brother's content ratification** hasn't happened — all content is data files so his vetoes are config edits.
- **7 RULES-GAPS** remain (see `RULES-GAPS.md`) — conservative readings implemented, all tagged; decide with designers.
- **CheatSheet modal** only renders scrawl lines; if the AI ever gets its own sheet stickers (M5 in-duel favors), a two-column sheet view is wanted.

## Next Steps

1. **Human plays a full run in the browser** (`npm run web`) — the M4 exit gate. Watch for: does the run complete map→boss→summary; do stickers/sheet-stickers read right; is the win-pick loop satisfying.
2. Re-time 2–3 duels on the current build to set `MAP_CONFIG.actLength` (the last provisional map number).
3. Brother's content ratification pass (edit data files in `packages/run/src/data/`).
4. M5 targets (out of scope for M4): remaining catalog commons/uncommons + all rares (incl. Recast/type-conversion — the only sanctioned "sticker crosses card types" mechanic), in-duel favors (ride the A2 overlay), Wild-Jokers + Recycling sheet mods (need engine work), ban-list UI, balance passes.

## Relevant Context

**Files touched (this session):**

- Engine (new): `effects.ts`, `config.ts`, `params.ts`; tests `stickers.test.ts`, `overrides.test.ts`. Modified: `types.ts`, `reducer.ts`, `legal.ts`, `view.ts`, `setup.ts`, `cards.ts`, `index.ts`, `playout.test.ts`, `flips.test.ts`, `fullgame.test.ts`.
- Run (new package): `packages/run/` — `types.ts`, `reducer.ts`, `mapgen.ts`, `storage.ts`, `index.ts`, `data/*`, `test/*`.
- Sim: `agents/greedy.ts`, `agents/common.ts`, `stats.ts` (adapted to `EffectId`s).
- Web (new): `Root.tsx`, `run/` (RunSession, RunShell, NodeMap, DeckViewer, idbStorage), tests `cardFace.test.ts`, `runSession.test.ts`. Modified: `App.tsx` (DuelScreen extraction), `main.tsx`, Board/Zone/CheatSheet/StackPanel/DevPanel, `session/GameSession.ts` (activate), `ui/cardFace.ts`, `interact/summary.ts`, `session/describeEvent.ts`.
- Docs: `README.md`, `M4_DESIGN_RECOMMENDATIONS.md` (REVISION 2 section), `RULES-GAPS.md` (regenerated).
- Also committing prior uncommitted playtest-1 work (battle-replay, smarter auto-pass) that was already in the tree.

**Commands to know:**

```bash
npm test             # engine + run + sim + web suites (Vitest) — 232 tests
npm run typecheck    # tsc --noEmit, all workspaces
npm run web          # Vite dev server — the run-mode app (Root)
npm run gen:rules-gaps   # regenerate RULES-GAPS.md from // RULES-GAP: tags
npm run bench        # random-agent games/sec floor
```

**Assumptions / constraints discovered:**

- React StrictMode (dev) double-mounts effects; any store owned via `useEffect(() => () => store.dispose())` needs an `activate()` partner in the effect setup, or it's dead on first mount.
- The engine already exposes `config.overrides`/`config.suitOverrides` publicly on `viewFor` — the UI must read them (don't recompute effect text from raw rank/suit; that's the drift class that bit twice).
- Duels stay OUTSIDE the run reducer: `startDuel` yields a `DuelSpec`; the shell plays it and feeds back `duelOutcome`. Whole runs replay deterministically from `runSeed` + action log + duel outcomes.
- Prime directive: never invent rules/content; tag gaps `// RULES-GAP:`; all content ships as data files so the brother's edits are config, not code.
