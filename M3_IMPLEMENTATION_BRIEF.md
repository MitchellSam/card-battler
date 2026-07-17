# M3 IMPLEMENTATION BRIEF — Browser Prototype (playable vs heuristic AI)
## House Rules (working title) — hand this file + UNIFIED_SPEC_v5.md to Claude Code

**Purpose of M3:** a human can play a full duel against the greedy agent in a browser. Ugly is fine; *wrong* is not. M3's second job is measurement: this is where wall-clock duel length (the open watch item) gets measured for real. Exit gate: **the brother completes a full duel in-browser.**

**Prime directive unchanged:** never invent rules. The engine is the rules. The UI contains ZERO rules logic — every affordance is derived by filtering `legalActions()`, every prompt comes from `state.pending`/`state.pendingWindow`, every display from `PlayerView` + the event stream. If the UI ever "knows" whether something is legal without asking the engine, that is a bug even when it happens to be right.

**Config:** `DEFAULT_CONFIG` as-is (the R0 baseline: drawPerTurn 2, firstTurnBattle false, firstTurnDraw false, ante 0, wallPunishSelector random). No config UI beyond the dev panel.

---

## RULES FACTS FOR UI TEXT (canon-in-context — the mockups/CANON predate M2.5)

The mockups and `CANON_FOR_DESIGN.md` are the **visual** spec (palette, fonts, layout, tone) but contain stale rules text. Where they conflict with the engine, the engine wins. Known corrections:

- Draw is **2 per turn** (canon says 1). First player **skips the turn-1 draw** and turn 1 has **no Battle Phase**.
- The phase strip in `DuelScreen.dc.html` shows `Draw › Standby › Main › Battle › Main 2 › End` — the engine's `Phase` is `main1 | battle | main2 | end` (plus `mulligan`/`gameOver`). Render the engine's phases; the turn-start draw is a moment (the `CardsDrawn`/`TurnStarted` events), not a phase. Do not invent a Standby.
- Game ends **only at a failed draw phase** — running out mid-turn does not end anything.
- Partial banks score **real poker categories** (a 2-card KK is a pair and beats 4-card ace-high).
- Poly's blackjack total **starts at the target monster's card value**; drawn Jokers reshuffle; an Ace drawn (or discarded as Q/K fuel) is a 1-or-11 choice at that moment.
- Jokers are never bankable. Wall-punish removal is random. Bank-trigger removal and wall-punish cards go to `removed` (exile), not graveyard.

The full Cheat Sheet content is NOT an M3 deliverable — the modal ships with a visibly-placeholder page ("real Cheat Sheet TBD") plus the corrections above as a short list. CANON's own update pass is a separate design-session task.

## PREREQUISITE: browser-safe sim exports (small, do first)

`@house-rules/sim`'s root index pulls `node:fs` (run.ts, report.ts) and will break a Vite build. Add a subpath export — do not restructure:

- `packages/sim/package.json`: `"exports": { ".": "./src/index.ts", "./browser": "./src/browser.ts" }`
- `packages/sim/src/browser.ts`: re-export `Agent` (agent.ts), the agents barrel (agents/index.ts), and `actorFor` + `agentSeed` (runner.ts — already node-free). One test that imports it and runs a `greedyAgent.choose()`.
- The web package imports ONLY `@house-rules/sim/browser` and `@house-rules/engine`. Engine stays dependency-free.

## PACKAGE: `packages/web` (Vite + React + TS, workspace member)

Deps: react, react-dom, vite, @vitejs/plugin-react, vitest. **No Motion yet** — the spec's React+Motion stack stands, but M3 animation is CSS transitions only; Motion enters with the polish milestone so M3 stays a wiring exercise. Root script: `"web": "npm run dev -w @house-rules/web"`.

### Session store (the core — build and test this headless, before any component)

A plain TS class/module (no React dependency; React subscribes to it):

```ts
GameSession {
  // owns: full GameState, engine RNG, agent + agent RNG (agentSeed), action log, event log, timestamps
  state: GameState            // private in spirit: components never read it (see redaction rule)
  humanView(): PlayerView     // viewFor(state, HUMAN); AI gets viewFor(state, AI) — never GameState
  legal(): Action[]           // legalActions(state, HUMAN)
  dispatch(action: Action)    // applyAction → append events → then runAI()
  runAI()                     // while actorFor(state) === AI && !state.result: agent.choose(aiView, aiLegal, agentRng) → applyAction; paced by a dev-panel delay (default ~400ms) so events read as beats
  exportReplay(): string      // { engineSeed, agentSeed, config, actionLog } as JSON
}
```

- `actorFor` (from sim) is the single source of "whose decision point is this" — pendings, priority, response windows, mulligan. Do not re-derive it.
- Human = player 0, AI = player 1, greedy. Seed from the dev panel or `Date.now()`; always displayed.
- **Auto-pass:** when the human's only legal action is `pass`, dispatch it automatically after a brief visible pulse on the priority marker. Response windows must still be *perceptible* (the pulse), just not a click tax. Make auto-pass a dev-panel toggle — it is a pacing lever the wall-clock numbers depend on, and playtests may want it off.
- **Undo: none.** Hidden information makes undo a peek engine; the replay export is the debugging tool.

### Redaction discipline

Components render exclusively from `humanView()` + the event log. The one sanctioned exception is a dev-panel "reveal all" toggle (debugging), which must be visually loud (e.g. red border) and live in dev-panel code only. The AI reads its own PlayerView — same honesty contract as M2.

## UI SURFACE (component boundaries mirror the mockups so the M6 art pass swaps skins, not structure)

Reference `mockups/DuelScreen.dc.html` + `Card.dc.html` for layout and the CANON palette/fonts (cream/manila/ballpoint/sharpie; Permanent Marker / Patrick Hand / Gochi Hand — cheap to apply, do it). 1600×900 scale-to-fit per the mockup. Extract:

- **Card** — props mirror the mockup's dc-import: `rank, suit, faceDown, rotated` (+ size). Used everywhere: hand, zones, banks, graveyard, stack, Poly.
- **Zone** — one monster or spell/trap slot: empty / face-up / set (monsters rotated 90°, set spells not — canon rule 4), power badge, highlight states (selectable / selected / legal target).
- **Board scaffold** — opponent mirror-image of player: hand strip (face-down count for opponent), 5+5 zones, bank spread (public, with live best-hand label via the engine's `bestHand` — import it, never reimplement), deck pile with count + depletion bar, graveyard (top card, tap to browse), `removed` pile (it's public state — small, but it must exist).
- **PhaseStrip** — turn number, whose turn, engine phases only, normal-summon-used marker, Cheat Sheet button.
- **StackEntry / StackPanel** — the center column: stack items top-down (top resolves first — say so on screen), controller color-coded, targets named. Visible whenever the stack is non-empty.
- **PromptNote** — one at a time, sticky-note style per the mockup. This is the workhorse; see inventory below.
- **EventLog** — the notebook-margin log: human-readable line per GameEvent (a `describeEvent(event): string` module; ~40 event types, most one-liners).
- **EndScreen** — winner, both `HandResult`s with the five cards shown, turns, **wall-clock minutes**, seed, "export replay" (downloads `exportReplay()` JSON), rematch (new seed) / replay-same-seed buttons.
- **DevPanel** — seed input + restart, AI delay, auto-pass toggle, reveal-all toggle.

### Decision-point inventory (every one must be operable — this list is the acceptance checklist)

Actions, driven by filtering `legal()`:
1. **Mulligan** — multi-select hand cards, confirm (or keep all).
2. **Summon** — hand card → mode (attack/set) → zone; sacrifice selection when the filtered actions demand `sacrificeZoneIndices` (1 for 5-7, 2 for 8-10).
3. **setSpell** — hand card → zone.
4. **flipMonster / changePosition** — click own monster, pick from its legal verbs.
5. **castSpell** — the multi-step one: source (hand or set zone) → mode (rank/suit) → target(s) (`targetMonsterUid` / `targetStackItemId` / `targetSTZone` / `graveTarget` + `summonPosition` for ♥ revive) → Q/K `discardHandIndex` → `aceValue` 1|11 iff the discard is an Ace. Implement as a selection cascade that at each step offers only values present in the filtered legal-action list — the engine remains the sole authority on combos.
6. **castJoker** — hand Joker, click to cast (draw 2).
7. **declareAttack** — own monster → legal target or direct.
8. **nextPhase / pass** — one button, labeled by context ("to Battle", "pass priority", ...).

Pendings (`state.pending`, each a PromptNote): `discard` (end-phase, one at a time) · `bankTrigger` (`bankChoice`: bank a hand card / remove from opponent bank / decline — show both banks) · `flipTarget` (2/6 flip) · `wallPunishPick` · `polyAce` (1 or 11) · `polyHitStand` (show `PolyState` total + drawn cards; HIT/STAND) · `interceptor` (defender picks among multiple).
Plus `pendingWindow` response windows and stack priority (the pass/auto-pass flow above).

## INSTRUMENTATION (the actual M3 deliverable to the design chat)

EndScreen reports and `exportReplay()` embeds: wall-clock duration, total turns, human decision count, mean human seconds-per-decision (clock only while `actorFor` = human — AI delay must not pollute the number). This is the input to the "40-turn duels × 8-12 duels vs 45-60-min run target" question. No further analytics.

## EXIT CRITERIA (all must hold)

1. `npm run web` serves the duel; a new game vs greedy starts from a shown seed.
2. Every action type and every pending type in the inventory above is reachable and operable in-browser (manual checklist, checked into the PR/commit message).
3. Headless store test in `packages/web`: a GameSession driven by two agents (greedy-vs-greedy, human seat scripted through `dispatch`) runs to `gameOver` — proves the wiring without a browser. A finished session's `exportReplay()` re-run through the engine reproduces the same `GameResult` (determinism survives the UI layer).
4. Zero rules logic in web: no legality computation, no poker scoring, no power math — engine imports only. (Review criterion, not a test.)
5. Components render from `humanView()` only; full-state access is confined to GameSession internals + the loud reveal-all dev toggle.
6. Engine and sim untouched except the `/browser` subpath + its test; all workspace tests green (115 engine + 4 sim + new web tests).
7. **The brother completes a full duel in-browser** and the wall-clock number is reported to the design chat. (The milestone gate — human, not CI.)

## OUT OF SCOPE FOR M3

Run mode anything (node map, shop, stickers, packs, SQLite, ante>0). Motion/animation polish, sound, real art beyond palette+fonts. Full Cheat Sheet content (placeholder + corrections list only). Electron/Steamworks. Save/resume, PvP, networking, mobile layout. Difficulty settings or any agent beyond greedy (dev panel MAY offer random for smoke-testing — free via the agents barrel). Balance changes of any kind — if play reveals a rules bug or gap, file it as `// RULES-GAP:` / a bug, never patch it in the UI.
