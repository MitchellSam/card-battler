# M1 IMPLEMENTATION BRIEF — Headless Rules Engine
## House Rules (working title) — hand this file + UNIFIED_SPEC_v5.md to Claude Code

**Prime directive: never invent rules.** Every rule you need is in this document. If a situation arises that this document does not cover, do NOT guess — surface it as a question in code comments tagged `// RULES-GAP:` and implement the most conservative interpretation behind a RulesConfig flag. Where this document is silent on a convention-level detail, Yu-Gi-Oh conventions are the canonical fallback (this game deliberately follows YGO structure).

---

## M1 SCOPE

Build a pure TypeScript rules engine for the two-player base game (Constructed rules). No UI, no AI, no Run-mode meta (no stickers/packs/economy — but the data model must support per-card effect overrides, see Data Model). Exit criterion: **a complete scripted game plays start-to-finish via unit tests alone**, exercising every subsystem below.

Out of scope for M1: rendering, networking, SQLite, AI opponents, Run mode, Electron.

## ENGINE CONTRACT (non-negotiable)

```ts
applyAction(state: GameState, action: Action, rng: SeededRNG) => { state: GameState; events: GameEvent[] }  // pure, no mutation
legalActions(state: GameState, player: PlayerId) => Action[]
viewFor(state: GameState, player: PlayerId) => PlayerView   // redacts: opponent hand, both deck orders, face-down cards' identities
serialize(state) => string / deserialize(string) => GameState
```

- Zero UI coupling. Zero unseeded randomness — all shuffles/randomness through the injected SeededRNG.
- **Actions** are coarse player intents (the replay input). **Events** are fine-grained outputs (`AttackDeclared`, `PriorityPassed`, `CombatResolved`, `MonsterDestroyed`, `FlipTriggered`, `CardBanked`, `BankCardRemoved`, `TurnEnded`, ...) for UI animation and replay rendering. The action log + seed reproduces any game exactly.
- All rules that vary live in a `RulesConfig` object with the defaults below. The engine reads config, never hardcodes.
- Illegal actions passed to applyAction must throw (or return a typed error) — legality is enforced by the engine, never assumed from the caller.

## DATA MODEL (from UNIFIED_SPEC_v5, simplified to M1 needs)

```ts
Card    { id: CardId, rank: 'A'|'2'..'10'|'J'|'Q'|'K'|'JOKER', suit: '♠'|'♥'|'♣'|'♦'|null }  // JOKER has null suit; 54 per player
RunCard { cardId, stickerStack: EffectId[], typeOverride?: 'monster'|'spell' }  // M1: stacks empty, no overrides — but resolve every effect through effectiveEffect(card) = top(stickerStack) ?? defaultEffect(rank), so M4 slots in without refactor
Zones per player: deck (ordered, hidden), hand (hidden from opponent), monsterZone[5], spellTrapZone[5], graveyard (public, ordered), bank (public)
Monster on field: { card, position: 'attack'|'set'|'defense', power: number, tempBuffs: [...] }
```

---

## COMPLETE RULESET

### Setup
1. Each player: own 54-card deck (standard 52 + 2 Jokers), shuffled (seeded).
2. Draw 5. One mulligan each: discard any number of cards (0-5) to the bottom of the deck (order by RNG), draw that many. [PROVISIONAL: discarded-to-bottom vs shuffled-back — implement as `mulliganStyle: 'shuffle'` default, cards shuffled back before redraw]
3. First player determined by RNG. **First player skips their first draw step.**

### Turn structure  [YGO convention; PROVISIONAL formalization — never explicitly defined in design docs]
`Draw → Main 1 → Battle → Main 2 → End`
- **Draw:** draw 1 (skipped for first player, turn 1).
- **Main 1 / Main 2:** may normal summon/set (1 per turn total), activate spells from hand (sorcery-speed), set spells/traps face-down, manually flip own set monsters face-up to attack (triggers flip effect; does not consume the normal summon), cast Poly, change a monster's battle position (see below).
- **Battle:** declare attacks, one per eligible monster.
- **End:** discard down to hand limit 6. Turn passes.

### Summoning & positions
- Normal summon: face-up attack OR set (face-down defense). Uses the turn's 1 normal summon.
- Sacrifice summon: monsters 5-7 require 1 sacrifice; 8-10 require 2. Sacrifices are monsters you control, any position; sacrificing a set monster does NOT trigger its flip effect [YGO convention]. Counts as the normal summon.
- Ace summons as power 1 (see Ace flip effect). 
- Face-up defense arises only from combat (a set monster that survives being attacked becomes face-up defense) — never chosen at summon.
- Manual position change: [PROVISIONAL, YGO convention] once per turn per monster, in Main phase, not on the turn it was summoned, and not if it attacked this turn: attack ↔ face-up defense. Flipping a SET monster face-up→attack is always allowed (that's the flip action) and triggers its flip effect.
- No summoning sickness: monsters may attack the turn they are summoned [YGO convention].
- Special summon: only via card effects (Heart, Poly). Does not consume the normal summon.
- Zone caps: 5 monsters, 5 spell/traps. A summon/set requiring a full zone is illegal.

### Flip effects
Trigger whenever a set monster is turned face-up, whether flipped manually by its owner or flipped by being attacked. Flip effects go ON THE STACK and are respondable [PROVISIONAL — required so Spade's universal negate can answer them]. Exception: a monster revealed by an effect that says "no flip effect" (Warning Shot-style, Heart revival) does not trigger.

Number-card flip effects:
| Card | Flip effect |
|---|---|
| A | Power becomes 11 until end of the turn it was flipped, then reverts to 1 |
| 2 | Flip the battle position of any one monster on field (either player's); face-down→face-up triggers that monster's flip effect |
| 3 | Reveal opponent's hand (information only) |
| 4 | Draw 1 card |
| 5 | Mill 2 cards from opponent's deck (top → their graveyard) |
| 6 | Return any monster on field to its owner's hand |
| 7 | Opponent discards 1 random card from hand (seeded RNG) |
| 8 | Destroy all monsters in attack position, both sides |
| 9 | No effect |
| 10 | No effect |

### Combat
- Attack declaration: a face-up attack-position monster attacks one opposing monster, or attacks directly ONLY if opponent controls zero monsters. Each monster: max 1 attack per turn. Attack declarations go on the stack (respondable — enables attack-negation effects) [PROVISIONAL].
- Resolution: compare power. Bigger wins. Ties broken by suit: ♠ > ♥ > ♣ > ♦. (Two identical cards from opposing decks — e.g. 7♥ vs 7♥ — is a true tie: [PROVISIONAL] both monsters are destroyed, no bank trigger; behind `mirrorCombat: 'mutualDestroy'`.)
- Attacking a set monster: flip it face-up first (flip effect triggers and resolves), then resolve combat against its power.
- **Attack vs attack, attacker wins:** defender's monster destroyed → attacker gets the BANK TRIGGER.
- **Attack vs attack, attacker loses:** attacker's monster destroyed → defender gets the BANK TRIGGER (they won an attacker-vs-attacker fight). [Careful: v2 says "loser's monster destroyed; triggers the bank-or-remove choice" for attack-vs-attack — the winner of the fight gets the choice regardless of who declared.]
- **Attack vs defense (set or face-up), attacker wins:** defender's monster destroyed. NO bank trigger.
- **Attack vs defense, defender wins (wall-punish):** attacker's monster destroyed AND one card is removed from the attacker's bank. Selection: [PROVISIONAL] `wallPunishSelector: 'random'` (options: 'random' | 'defender' | 'attacker'). If attacker's bank is empty, no removal occurs.
- **Direct attack (opponent has no monsters):** no damage concept — the attacker simply gets the BANK TRIGGER.
- A set monster that survives being attacked becomes face-up defense.

### Banking (the win condition)
- BANK TRIGGER = winner chooses ONE: (a) bank any 1 card from their own hand (Jokers excluded — see below), or (b) remove any 1 card of their choice from the opponent's bank (banks are public). May decline both [PROVISIONAL: `bankTriggerDeclinable: true`].
- Banked cards leave hand permanently; hand refills only via draws/effects.
- Bank size: unlimited.
- **Jokers cannot be banked and have no poker value.** [PROVISIONAL: `jokersBankable: false` — a banked wild card would break hand scoring; Wildcard Bank's deliberate narrowness implies wilds were never intended.]

### Game end & scoring
- The game ends the moment either deck reaches 0 cards (by draw OR mill) [PROVISIONAL: `deckOutTrigger: 'zeroCards'`; alternative 'failedDraw']. Finish resolving the current stack/combat fully, then score. Reaching 0 is NOT a loss — it's the game clock.
- Scoring: each player's best 5-card poker hand from their entire bank (standard poker rankings; banks smaller than 5 form the best partial hand, which loses to any true 5-card hand [PROVISIONAL: partial hands rank below all complete hands, compared by high-card among themselves]).
- Tie-break between equal-ranked hands: standard poker kickers first; then suit order (♠>♥>♣>♦) comparing the highest differing card; if the two best-5 hands are LITERALLY identical (possible — two decks), compare 6th-best bank card, then 7th, etc. [PROVISIONAL: `tieBreak: 'extendedKickers'`]; if still identical, the game is a DRAW.

### Spells & the stack
- Face cards (J/Q/K) are spells. At cast time the caster chooses RANK effect or SUIT effect — never both. (J/Q/K rank effects; the card's suit determines which suit effect it can choose instead.)

| Card | Rank effect | Suit effect |
|---|---|---|
| J | Destroy any one monster on field | (J's suit effect per its suit below) |
| Q | Discard a number card from hand: your target monster gets +that value [PROVISIONAL: until end of turn — v1 docs say Q buff, duration unstated; K says "permanently", Q does not, so Q = temporary behind `queenBuffDuration: 'endOfTurn'`] | (per suit) |
| K | Discard a number card from hand: opponent's target monster gets −that value permanently | (per suit) |
| ♠ any face | — | NEGATE: counter any card/effect currently on the stack |
| ♥ any face | — | Special summon any monster from EITHER graveyard, face-up, position of caster's choice, no flip effect |
| ♣ any face | — | Destroy one face-down SET card in a spell/trap zone (revealed, to graveyard). Cannot target cards on the stack |
| ♦ any face | — | Cast Polymerization (below) |

- Sorcery-speed: casting from hand happens only on your own turn, Main phase, via the stack.
- To act on the opponent's turn, a face card must have been SET face-down in your spell/trap zone on a previous turn. A card set this turn cannot be activated until the opponent's next turn at the earliest.
- Setting a spell/trap is a free action (no per-turn limit beyond the 5-zone cap) [PROVISIONAL — never limited in docs].
- **Stack & priority (MTG-style, full):** casting/activating puts the card on the stack. The caster retains priority (may respond to their own card); then priority alternates. When BOTH players pass consecutively, the top of the stack resolves, then active player gets priority again. Attack declarations and flip effects use the same stack.
- Jokers: Pot of Greed — draw 2. Sorcery-speed only, cannot be set.

### Polymerization (♦ suit effect)
- Target: ONE monster you control, face-up [PROVISIONAL: face-up only — targeting your own set monster never addressed; conservative reading].
- Blackjack vs your own deck: auto-deal 2 cards from top of deck [PROVISIONAL: `polyInitialDeal: 2` — matches blackjack theme; docs silent], then HIT (draw 1) or STAND repeatedly.
- Card values: number = face value; J/Q/K = 10; Ace = caster chooses 1 or 11 at the moment it is drawn (irrevocable).
- BUST (total > 21): target monster destroyed, effect fails.
- STAND: target monster's power becomes ceil(total / 2), permanently. (Exact 21 → 11.)
- All drawn cards go to the caster's graveyard regardless of outcome. Note: Poly self-mills — it interacts with the deck-out clock.

---

## RULESCONFIG DEFAULTS (every PROVISIONAL above, plus)
```ts
{ handLimit: 6, startingHand: 5, monsterZones: 5, spellTrapZones: 5,
  wallPunish: true, wallPunishSelector: 'random',
  jokersBankable: false, bankTriggerDeclinable: true,
  deckOutTrigger: 'zeroCards', tieBreak: 'extendedKickers',
  polyInitialDeal: 2, queenBuffDuration: 'endOfTurn',
  mirrorCombat: 'mutualDestroy', mulliganStyle: 'shuffle',
  removalFloor: 40 /* unused in M1, Run mode only */ }
```

## BUILD ORDER WITHIN M1
1. Types + zone model + serialization round-trip tests.
2. Turn skeleton (phases, draw, hand limit) + legalActions for summons/sets.
3. Combat without effects (positions, wall-punish, bank triggers, banking).
4. Stack + priority + face-card spells (Spade/Heart/Club, J/Q/K rank effects).
5. Flip effects (all 10) + interactions (2 chaining into another flip, 8 board wipe).
6. Polymerization mini-game as a sub-state-machine inside the stack.
7. Game end + poker hand evaluator + tie-breaks (property-test the evaluator against a reference implementation).
8. Full scripted game test: two seeded players, ~20 scripted turns exercising every subsystem, asserting the final showdown result.

## CONVENTIONS
Single repo; `packages/engine` as a workspace package (npm workspaces; no monorepo tooling). TypeScript strict. Vitest. No dependencies in the engine package except dev/test tooling — the engine is dependency-free by policy. Every `// RULES-GAP:` comment must also be listed in a generated `RULES-GAPS.md` at the repo root so the designers see them.
