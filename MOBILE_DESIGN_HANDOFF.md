# Session Handoff

> Fill out this template at the end of a session so the next session can resume without re-deriving context.

---

## Goal

Rework the "Kid's Card Duel" UI suite (6 screens, desk-paper aesthetic) around one layout system that works on a **landscape phone** and on **desktop**. Mobile-first: the Duel Screen was redesigned for a 19.5:9 landscape phone (user chose landscape over portrait reflow), then the desktop Duel Screen was **converged onto the same zoning grammar** (hero corners left, asymmetric board center, timeline band, detail/actions right) rather than maintaining two layouts.

## Status

**State:** In Progress

- **Duel Screen (mobile)** — `DuelScreen-Mobile.dc.html`: revision 2 built (real 844×390 canvas, all review fixes). Pending: interaction corrections below + small punch list.
- **Duel Screen (desktop v2)** — `DuelScreen-v2.dc.html`: built on the mobile zoning grammar with desktop affordances (persistent log, wide detail rail, Poly modal). Pending: zoom/selection interaction corrections below. The old `DuelScreen.dc.html` layout is **deprecated** but the file is preserved untouched.
- **Other 5 screens** — not started on the new system.

## What Was Done

- **Grounded the redesign in an external reference.** Read and distilled the GDKeys article "The Card Games UI Design of Fairtravel Battle" (https://gdkeys.com/the-card-games-ui-design-of-fairtravel-battle/) into 9 principles (see the blueprint's rules key).
- **Blueprint** — `DuelScreen-Mobile-Blueprint.dc.html` (v2): annotated wireframe/spec. Now records the **844×390 canvas** and the **size floors** (below).
- **Mobile build, revision 2** — `DuelScreen-Mobile.dc.html`:
  - **Re-authored at 844×390** (real 19.5:9 phone logical px; 1 design px = 1 physical px; desktop preview scales UP). The original 1560×720 canvas rendered at ~0.54× on-device and misled all sizing.
  - Layout: left rail hero corners (Riley top / You bigger below: avatar, deck-as-HP, tappable graveyard, tappable public bank as text chips) · center board (Riley hand → Riley field 40% → timeline band → your field 60% → your hand) · right rail (menu/cheat, selected-card detail panel, context actions, END TURN in thumb zone). Monster and spell/trap on separate rows for both players.
  - **Selection ring**: hand-drawn red scribble ring on the currently selected card (one at a time), plus panel population.
  - **Escalated live stack**: while the stack is non-empty the current-phase segment enlarges — readable stack cards with resolution-order badges (1, 2), an arrow, and a plain-language priority pill ("⚡ Riley can respond… or pass", 15px). Prev-phase history thumbnails are glance-only; the LOG button is the interactive path to history (opens the text-log drawer).
  - **Long-press zoom** (wired): pointerdown ≥350ms on any card → full-screen card overlay with name/type/effect; dismisses on release; pointerleave cancels.
  - **Deck stat deduped** to two encodings (count overlay + HP bar; caption dropped).
- **Desktop v2 build** — `DuelScreen-v2.dc.html` (new file; 1600×900 canvas):
  - Same zoning grammar and same mock game state as mobile. Extra width spent on desktop advantages: **persistent ACTION LOG panel** in the left rail (drawer removed; the timeline's stack-of-cards anchor stays as the visual "actions land here" target), **336px always-readable detail rail**, larger tiles (84px vs mobile 44–48px).
  - **Poly blackjack modal ported** from the old desktop file (HIT/STAND, Ace 1-or-11 pause, bust logic) and hooked to the POLY context action.
  - Top nav links restored (incl. a link to the mobile screen).
- **Shared components** (representation-based, NOT platform forks):
  - `Card.dc.html` — gained a **`scale` prop**; all internal font sizes/offsets computed in renderVals. Every call site passes it.
  - `CardTile.dc.html` — NEW: the condensed board tile. Props: rank/suit, `category` (monster `#d68b73` / spell `#8fa9c9` / **trap `#b79ccb`** / neutral), face-down, `pos` label, power `badge`, `mark`, `selected` (scribble ring). Used by both duel screens.

## Key Decisions

| Decision | Why |
|---|---|
| Landscape orientation, not portrait | User's call — rotating the phone is the expected convention for phone card games. |
| Keep the desk-paper fantasy aesthetic | GDKeys: UI *is* game design; only spatial layout changes. |
| **Canvas = 844×390, 1 design px = 1 physical px** | The old 1560×720 canvas hid a 0.54× on-device shrink; every size decision was dishonest. Preview now scales up instead. |
| **Size floors** (true physical px, inherited by screens 2–6) | Tappable ≥ 44×44 effective (incl. exposed area of fanned/overlapped cards); body/effect text ≥ 12px; secondary labels ≥ 10px; priority indicator ≥ 15px. Resolve tightness by cutting/condensing, never by going under. |
| **Desktop converges on the mobile zoning grammar** (`DuelScreen-v2`) | One layout system to maintain; the mobile constraints produced the better information hierarchy. Desktop spends its extra space on a persistent log, a wider detail rail, and bigger tiles — not on a letterboxed phone canvas. Old `DuelScreen.dc.html` kept as an artifact, layout deprecated. |
| **Components split by representation, not platform** | Full face (`Card` + scale prop), condensed tile (`CardTile`), zoom overlay — same three representations on both form factors; platform forks would drift. |
| Tight hero corners in the left rail | GDKeys core rule — deck/graveyard/bank/avatar in one cluster per player. |
| Board cards → condensed square tiles; full faces only in hand | All 3 benchmark games reduce on-board cards; biggest space win. |
| 60/40 asymmetric split (your field bigger) | MTG Arena's perspective trick; solves two-field legibility. |
| Left = past, right = future reading flow | Decks/graveyard left, board center, End Turn + actions right (= right-thumb zone in landscape). |
| Monster and spell/trap on SEPARATE rows for BOTH players | User explicitly rejected combining rows. |
| Selected-card detail lives in the right rail | User request — not a floating overlay. |
| Timeline band doubles as the live stack; **stack escalates while non-empty** | History and stack share one persistent band (no 4th zone), but a live stack is the whole game state — it enlarges with resolution order + priority unmissable, then collapses back to timeline duty. |
| **Priority in plain language** | "Riley holds priority" is canonical rules (MTG-style full-priority stack — spec + engine `state.priority`) but insider jargon; render as "Riley can respond… or pass". Value from engine state, phrasing is interaction copy. |
| Timeline phase-coded; prev + current phase only; overlap = age | User spec. Prev-phase thumbnails are glance-only; LOG is the interactive path to history. |
| LOG = stack-of-cards anchor | Mobile: opens text-log drawer. Desktop: log is a persistent left-rail panel; anchor stays as the visual target actions land in. |
| Opponent field always visible | User decision. |
| Trap gets its own tile hue (`#b79ccb`, from badge purple `#7a4f9e`) | Category legibility at tile size. Face-down/SET tiles stay neutral — set-card type is hidden information by rule; the hue applies once revealed. |
| Deck stat = two encodings max | Own principle 7 (cut duplicate info): count overlay + HP bar; caption dropped. |
| **Zoom: mobile = long-press · desktop = hotkey ONLY (ratified 2026-07-23)** | The 500ms hover-dwell full-screen takeover on desktop was unpleasant in testing. Desktop zoom is Z-held only (hover-dwell timer and `hoverZoomMs` prop to be removed). Mobile long-press unchanged. |
| **Selection = click-to-pin toggle; NO hover preview (ratified 2026-07-23)** | Both screens: click/tap a card pins it to the detail panel; clicking the pinned card again or any empty area unpins (panel shows a neutral placeholder). Hover must not change the detail panel (desktop hover tracking may remain solely to target the Z-zoom). |

## Blockers / Open Questions

- **Interaction corrections not yet implemented** (ratified above, assigned to Claude Design): desktop hotkey-only zoom; click-to-pin/unpin selection model with empty-panel state on both screens; removal of hover-driven preview.
- **`CardTile` has no `scale` prop** — internals are fixed px (18px rank glyph). Risk: "10♠" overflows the ~29px inner face on mobile 44px tiles; glyphs proportionally undersized on desktop 84px tiles. Needs the same scale treatment as `Card`.
- **Trap hue is implemented but never demonstrated** — no revealed trap in the mock state (the T6 log says Riley flipped 4♣, but the board doesn't show it).
- One floor violation on mobile: "BATTLE PHASE · STACK" label is 9px (floor is 10px).
- **Remaining 5 screens**: not started. NodeMap/CheatSheet ≈ free reflows; CardAnatomy should become the zoom-overlay spec; Shop/RunSummary need hero-corner condensing.

## Next Steps

1. Implement the ratified interaction corrections (hotkey-only desktop zoom; click-to-pin/unpin; no hover preview) on both duel screens.
2. Add `scale` to `CardTile` + update call sites; fix the 9px label; demo the trap hue (revealed 4♣ on Riley's field).
3. User does the hands-on phone/desktop check → sign-off on both duel screens.
4. Rework the next screen on the system (NodeMap or CardAnatomy-as-zoom-spec — ask the user which).
5. Apply hero-corner / tile / past-future zoning to Shop and RunSummary.

## Relevant Context

**Files:**

- `DuelScreen-Mobile.dc.html` — mobile duel screen (844×390), primary mobile deliverable.
- `DuelScreen-v2.dc.html` — desktop duel screen (1600×900) on the converged system, primary desktop deliverable.
- `DuelScreen-Mobile-Blueprint.dc.html` — the spec (v2: canvas + floors).
- `Card.dc.html` — full card face. Props: `rank`, `suit`, `face-down`, `sticker`, `sticker-color`, `conversion`, **`scale`**.
- `CardTile.dc.html` — condensed board tile. Props: `rank`, `suit`, `category` (monster/spell/trap/neutral), `face-down`, `pos`, `badge`, `badge-color`, `mark`, `selected`. (Needs `scale` — see Blockers.)
- `DuelScreen.dc.html` — old desktop version; layout deprecated, file preserved (aesthetic/reference artifact).
- Not yet reworked: `CardAnatomy.dc.html`, `NodeMap.dc.html`, `Shop.dc.html`, `CheatSheet.dc.html`, `RunSummary.dc.html`.
- `mockups-old/` — user's backup of the pre-revision mockups folder. `mockups/support.js` + `mockups/uploads/` were restored from it after a sync dropped them — **never delete these; every DC loads `./support.js`.**

**How things work (Design Component project, not a normal web app):**

```
# Each *.dc.html is a Design Component: template + a `class Component extends DCLogic` logic block.
# Author/edit with the dc_* tools (dc_write / dc_html_str_replace / dc_js_str_replace / dc_set_props),
#   NOT write_file (write_file is only for non-DC files like this .md).
# Styling is INLINE only (no stylesheets/classes). Fonts + @keyframes go in <helmet>.
# Repetition uses <sc-for>; conditionals use <sc-if>; children mount via <dc-import name="Card" ...>.
# Preview scales the fixed canvas (mobile 844×390 · desktop 1600×900) to the window via
#   transform:scale (componentDidMount + resize).
# To review: ready_for_verification({path}).
```

**Assumptions / constraints discovered:**

- **Canvas honesty:** mobile canvas is 844×390 = real 19.5:9 phone logical px; the desktop browser preview scales UP. Never size against a shrunken preview again — the floors in Key Decisions are physical px.
- The project's `support.js` is an **older DC runtime** than the documented spec; intentionally left in place. It DOES support functional `setState(fn)` (verified: `__setLogicState` handles function updaters).
- **Engine-source mapping for the eventual `packages/web` port** (hard rule: no hardcoded rules text in real UI — mockups may hardcode, the port must not):
  - detail/zoom `effect` text → `describeEffect(...)` over `effectiveCardEffect`/`effectiveFlipEffect`/`effectiveSuitEffect`
  - Cheat Sheet text → engine registries (`EffectSpec.name`/`text`)
  - config facts ("Normal Summon: USED", draw counts, hand limit …) → `view.config` via `cfg`/`cfgFor` (per-seat overrides)
  - poker hand names ("Pair of Queens") → engine `GameResult`; derived numbers (power, defense) → engine functions
  - priority holder → `view.priority` (engine state); only the plain-language phrasing is web-owned interaction copy
- Game canon (from the spec/Cheat Sheet): 52 cards + 2 jokers; number cards = monsters (power = rank); J/Q/K play for rank OR suit; Aces = 1 or 11; any card bankable (public, best 5-card poker hand wins); MTG-style full-priority stack resolves top-down; POLY = pick a monster + blackjack (STAND = ⌈total÷2⌉, BUST = torn up); traps set face-down sideways; "No Take-Backs" rule-mod this run. Mock state = turn 7, Battle Phase, Riley holds priority, your K♠ NEGATE above Riley's J♥ DESTROY.
