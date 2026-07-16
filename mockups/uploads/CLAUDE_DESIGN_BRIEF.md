# Claude Design Brief — House Rules (working title)

How to use: paste **Section 1** as the prompt for your first session, and attach **Sections 2-6** (or this whole file) as supporting material. One screen per session; iterate until it's right before moving to the next. Output is a visual spec / component library — the shipped client will re-wire these components to a real engine, so prioritize look, layout, and interaction feel over code architecture.

---

## 1. THE PROMPT (paste this)

Design the duel screen for a digital card battler played with a standard 52-card poker deck, themed as **a kid's invented card game** — the whole UI should look like it's happening on a kid's desk: notebook paper, construction paper, tape, stickers, marker handwriting. Attached: art direction, a full inventory of what the screen must display, interaction notes, and a mock game-state JSON.

Build it as a single React component tree with the mock state hardcoded, desktop 16:9 (Steam game). Requirements:

- Two-player layout (opponent top, player bottom), each with: deck (card count prominently displayed — running out of cards ENDS the game, treat count like a health bar), hand (player's face-up and fanned, opponent's face-down with count), 5 monster zones, 5 spell/trap zones, graveyard (public, top card visible, clickable to browse), and bank (public, face-up spread — see inventory for why).
- Monster zones must clearly distinguish three states: face-up attack (upright), face-down set (card back, rotated 90°), face-up defense (face visible, rotated 90°).
- A shared **stack** area center-table: a literal pile of overlapping cards that resolves top-down, with an unmissable indicator of whose response window is open ("your move to respond / pass"). This is the hardest element — make stack order and priority readable at a glance.
- A turn/phase strip and a prompt area for forced choices (e.g., "Bank a card from hand OR remove a card from their bank").
- A **Cheat Sheet** button opening a drawer/overlay: the rules reference drawn as a kid's handwritten sheet, with applied rule-mods visibly scrawled/whiteout-corrected on it.
- Card anatomy: cards are real playing cards (rank + suit), with an optional **sticker** slapped on (slightly skewed, peel-edge) showing a modified effect name/icon, and an optional hand-drawn conversion mark for type-converted cards.
- A modal overlay for the **Polymerization blackjack mini-game**: running total, drawn cards, big HIT / STAND buttons, bust state.

Style per the attached art direction: mixed-media craft, wonky-is-correct, photocopied-paper palette. No glossy fantasy, no neon, no dark-mode gamer UI. Start with the full board in a mid-game state per the mock JSON.

---

## 2. Art direction

**Concept:** kids inventing and endlessly house-ruling their own card game. Run mode = one kid escalating their own rules; the UI is their desk/floor/notebook.

**Materials vocabulary:** crayon, colored pencil, marker (ballpoint + sharpie), construction paper, cardboard + tape, sticker sheets with peel/skew, whiteout dabs with corrections written over them, notebook paper (ruled + margin line), photocopier grain.

**Palette (approximate, tune freely):**
- Cream paper `#F5EED8` (primary surface)
- Manila `#E7D7A9` (secondary surfaces, folders/zones)
- Ballpoint blue `#2B4C9B` (handwriting, links, player accents)
- Sharpie black `#1F1D1B` (headings, card text)
- Sharpie red `#C23B2E` (warnings, opponent accents, corrections)
- Whiteout `#FBFAF4` (patches, modals)
- Pencil gray `#8B8578` (secondary text, guidelines)
- Highlighter yellow `#F4E04D` (sparingly — active/priority states)

**Typography:** a hand-printed/marker display face for headings + a clean readable body face (legibility beats theme for rules text). Card ranks/suits stay classic playing-card styling — the cards are the one "real manufactured object" in a handmade world.

**Tone rules:** wonky reads as correct, not unfinished. Slightly rotated elements, imperfect alignment, tape corners. But: information hierarchy is never sacrificed — a kid's messy desk, not an unreadable one. Desaturated warmth; nothing glossy, beveled, or dark-fantasy.

**Sound identity (for interaction-feel context):** sticker peel, marker squeak, paper riffle, whiteout dab — design hover/press states that *suggest* those physics (cards lift with a paper shadow, stickers peel at a corner on hover).

## 3. Screen inventory & session order

1. **Duel board** (this brief) — hardest layout, do first.
2. **Card anatomy states** — one card in every state: face-up/face-down/defense, stickered, sleeved (post-v1, sketch only), type-converted, banked, on-stack, in-graveyard.
3. **Node map** (run overview) — Slay-the-Spire-style branching path drawn as a kid's treasure map in crayon: duel / elite / shop / event / rest / boss nodes.
4. **Shop + pack opening** — Corner Store & Trade Binder packs; sticker-sheet reveal moment (the "pack rip" is the dopamine beat — peel, don't explode).
5. **Cheat Sheet full view** — the handwritten rules sheet as an object; mods scrawled on; whiteout deletions visible.
6. **Run summary / game end** — best-5 poker hand reveal side by side, bank comparison, run stats.

## 4. Duel board — information inventory (what MUST be visible)

Per player:
- **Deck**: face-down pile + numeric count, high visual prominence (deck-out = game end; count is effectively the game clock).
- **Hand**: player's face-up fanned (max 6, limit indicator when over at end of turn); opponent's face-down + count.
- **Monster zones ×5**: states = empty / face-up attack (upright) / face-down set (back, rotated) / face-up defense (face, rotated). Power number prominent on face-up monsters; temporary buffs/debuffs shown as marker annotations (+3 scribbled on).
- **Spell/trap zones ×5**: empty or set face-down.
- **Graveyard**: public to both players (card effects target either graveyard). Top card visible; expandable browse.
- **Bank**: public, face-up spread. Rationale: the bank-removal trigger lets the winner choose a specific card from the opponent's bank, which requires visibility. Show a live "current best 5-card poker hand" readout per bank (this is the win condition — always ambient).

Shared / center:
- **The stack**: overlapping card pile, top = next to resolve; each entry labeled with owner + chosen mode (e.g., "K♠ — rank: debuff" vs "K♠ — suit: negate"). Priority indicator: whose response window is open, with explicit RESPOND / PASS affordances.
- **Turn & phase strip**: whose turn, current phase, normal-summon-used indicator.
- **Prompt area**: forced binary choices surface here (bank-or-remove; blackjack hit/stand routes to its modal; discard-to-6 at end of turn).

Overlays:
- **Polymerization blackjack modal**: target monster shown, drawn cards accumulating, running total, Ace 1/11 choice at draw time, HIT / STAND, bust state (monster torn up), stand result (fused monster = ceil(total/2)).
- **Cheat Sheet drawer**: rules reference; in Run mode, applied sheet mods visibly written/whiteouted on it.

## 5. Interaction notes

- **Priority is the UX crux.** Every stack addition opens a response window for both players. The "it's your window" state must be unmissable (highlighter accent), and PASS must be one low-friction click — full MTG priority dies in UI if passing is tedious. Include an "auto-pass when I have no possible responses" toggle in the design.
- Drag-to-play from hand; legal drop zones highlight on drag start (illegal zones stay inert, don't shake/scold).
- Setting vs. summoning a monster = drag then choose orientation, or drag with modifier — propose a mechanic, optimize for one-handed mouse play.
- Attack declaration: drag attacker onto target (or onto opponent's portrait/desk area for direct attacks).
- Hover any card anywhere = large readable preview with full effect text (cards have no printed rules text; the preview carries all of it).
- Opponent actions animate deliberately with paper-physics (card slides in, sticker peels) — the player must be able to follow what happened without reading a log; include a small scrollable notebook-margin log anyway.

## 6. Mock game state (design against this)

```json
{
  "turn": 7,
  "phase": "main",
  "activePlayer": "you",
  "priorityWindow": { "open": true, "holder": "opponent" },
  "stack": [
    { "owner": "you", "card": "K♠", "mode": "suit:negate", "targets": ["stack:0"] },
    { "owner": "opponent", "card": "J♥", "mode": "rank:destroy", "targets": ["you:monster:2"] }
  ],
  "you": {
    "deckCount": 21,
    "hand": ["9♣", "4♦", "Q♥", "2♠", "A♦"],
    "monsters": [
      null,
      { "card": "7♥", "state": "attack", "power": 7, "stickers": ["Rally"] },
      { "card": "10♠", "state": "attack", "power": 10, "buff": 0 },
      { "card": "?", "state": "set" },
      null
    ],
    "spellTraps": [ { "state": "set" }, null, null, null, null ],
    "graveyardTop": "8♦", "graveyardCount": 9,
    "bank": ["A♠", "K♦", "9♥", "9♠", "3♣", "6♦"],
    "bankBestHand": "Pair of 9s",
    "normalSummonUsed": true
  },
  "opponent": {
    "deckCount": 14,
    "handCount": 4,
    "monsters": [
      null, null,
      { "card": "?", "state": "set" },
      { "card": "6♣", "state": "defense", "power": 6 },
      null
    ],
    "spellTraps": [ null, { "state": "set" }, { "state": "set" }, null, null ],
    "graveyardTop": "J♦", "graveyardCount": 12,
    "bank": ["Q♠", "Q♦", "7♣", "2♥"],
    "bankBestHand": "Pair of Queens"
  },
  "sheetMods": [
    { "name": "No Take-Backs", "type": "whiteout", "note": "wall-punish rule deleted" }
  ]
}
```

## 7. What NOT to give Claude Design

Trim the unified spec before attaching — omit: engineering architecture (§6), AI (§5), economy numbers (§4.4, §11), milestones (§10). It only needs: theme, vocabulary, and this brief. Extra material dilutes prompt attention on the visual problem.
