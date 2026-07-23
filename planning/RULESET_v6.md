# RULESET v6 — the complete current duel rules
## House Rules (working title)

**Status:** consolidated 2026-07-23. Supersedes the ruleset text in `M1_IMPLEMENTATION_BRIEF.md` and the deltas in `M2.5_IMPLEMENTATION_BRIEF.md` (both deleted; recoverable from git history) plus the playtest-ratified rules previously recorded only in the README. Sources: M1 inlined ruleset → M2.5 ratifications (July 2026 design session) → playtest rounds 1–2 ratifications → M4/REVISION 2 effect-framework rules. Config defaults below are copied from `packages/engine/src/types.ts` `DEFAULT_CONFIG` verbatim at consolidation time.

**Authority order:** for implemented behavior, the engine is the source of truth — display text from the effect registry (`packages/engine/src/effects.ts`), open questions in `RULES-GAPS.md` (generated). This document is the human-readable consolidation; if it disagrees with the engine + its tests, the engine was ratified and this doc has drifted — fix the doc.

**Prime directive unchanged:** never invent rules. Silences here are tagged `// RULES-GAP:` in code and surface in `RULES-GAPS.md` for the design table.

---

## 1. Setup

1. Each player brings their own 54-card deck (standard 52 + 2 Jokers), shuffled (seeded).
2. Draw 5 (`startingHand: 5`). One mulligan each: discard any number of cards (0–5), shuffled back into the deck (`mulliganStyle: 'shuffle'`), draw that many.
3. First player determined by RNG. **First player skips their turn-1 draw** (`firstTurnDraw: false`; the R4 experiment measured the compensation as real and roughly symmetric).
4. **Ante** (`ante`, default 0 = Constructed): after mulligans, each player moves `ante` random cards from the top of their deck directly to their PUBLIC bank. An ante'd Joker is shuffled back and a different card is ante'd (Jokers are never bankable). Run mode plays ante 5 (ratified from R1 data).

## 2. Turn structure

`Draw → Main 1 → Battle → Main 2 → End`

- **Draw:** draw `drawPerTurn` (default **2**), one card at a time. See §7 for the game-end rule.
- **Main 1 / Main 2:** normal summon/set (1 per turn total), activate spells from hand (sorcery-speed), set spells/traps face-down, manually flip own set monsters, change battle positions, cast Poly.
- **Battle:** declare attacks, max one per eligible monster. **The first player's turn 1 has no Battle Phase** (`firstTurnBattle: false`).
- **End:** discard down to the hand limit (default **6**). Turn passes.

## 3. Summoning & positions

- **Normal summon:** face-up attack OR set (face-down defense). One normal summon/set per turn.
- **Sacrifice summon:** monsters 5–7 require 1 sacrifice; 8–10 require 2. Sacrifices are your monsters, any position; sacrificing a set monster does NOT trigger its flip effect. Counts as the normal summon.
- **Special summon** (card effects only, e.g. ♥ revive): does not consume the normal summon.
- **Zone caps:** 5 monster zones, 5 spell/trap zones (`monsterZones` / `spellTrapZones`). A summon/set into a full zone is illegal.
- **No summoning sickness** — monsters may attack the turn they arrive.
- Face-up defense arises from combat (a set monster that survives being attacked becomes face-up defense) — never chosen at summon. A monster flipped face-up by the default-2 effect lands in ATTACK (ratified); Warning Shot's no-effect reveal leaves it in DEFENSE (provisional — RULES-GAPS #2).
- **Manual position change:** once per turn per monster, Main phase only, not on the turn it was summoned, and not if it attacked this turn: attack ↔ face-up defense.
- **Manually flipping a set monster face-up** (to attack) is always allowed in a Main phase and triggers its flip effect. **Ratified (playtest round 1): a manually flipped monster cannot also switch position that same turn.**

## 4. Flip effects

- Trigger whenever a set monster is turned face-up — manually by its owner or by being attacked — unless the revealing effect says "no flip effect" (Warning Shot, ♥ revive).
- **Flip effects are DECLINABLE (ratified, playtest round 1):** before the trigger hits the stack, the controller receives a `flipDecision` — activate or decline. Effects with no decision content (default 9/10) offer none.
- Activated flip effects go ON THE STACK and are respondable (♠ negate can answer them).
- Default flip effects (display text is the engine registry's — abbreviated here):

| Card | Default flip effect |
|---|---|
| A | Power becomes 11 until end of turn (else 1) |
| 2 | Flip any monster's battle position (a face-down flips up, triggering its flip effect; lands in attack) |
| 3 | Reveal the opponent's hand |
| 4 | Draw 1 card |
| 5 | Mill 2 from the opponent's deck |
| 6 | Return any monster to its owner's hand |
| 7 | Opponent discards 1 at random |
| 8 | Destroy every attack-position monster (both sides) |
| 9 / 10 | No effect |

- A stickered card's flip effect is the sticker's effect instead (§9).

## 5. Combat

- **Attack declaration:** a face-up attack-position monster attacks one opposing monster, or attacks directly ONLY if the opponent controls zero monsters. Max 1 attack per monster per turn. Declarations go on the stack (respondable).
- **Resolution:** compare power; bigger wins. Ties broken by suit: ♠ > ♥ > ♣ > ♦.
- **True mirror** (identical rank AND suit, possible across two decks): both monsters destroyed regardless of position, NO bank trigger, NO wall-punish (`mirrorCombat: 'mutualDestroy'`).
- **Attacking a set monster:** flip it face-up first (flip decision → effect resolves), then resolve combat against its power.
- **Attack vs attack:** loser's monster destroyed; the WINNER of the fight gets the bank trigger, regardless of who declared.
- **Attack vs defense, attacker wins:** defender's monster destroyed; NO bank trigger.
- **Attack vs defense, defender wins (wall-punish):** attacker's monster destroyed AND one card is removed from the attacker's bank (`wallPunish: true`, `wallPunishSelector: 'random'`; empty bank → no removal). Removed cards are EXILED, not graveyarded.
- **Direct attack:** no damage concept — the attacker gets the bank trigger.
- **Interception (M2.5 §8):** if a monster appears on the defender's field while a direct attack is on the stack, the attack retargets to it (face-down interceptor: flip-then-combat). Multiple appeared → DEFENDER chooses (provisional — RULES-GAPS #4).
- **Battle Replay (ratified, playtest round 2; `battleReplay: true`):** if an attack's declared TARGET leaves the field before resolution, the attacker gets a replay decision — retarget, attack directly if the board emptied, or decline. **A declined replay frees that monster to attack again this turn** (true-YGO, ratified). If the ATTACKER leaves the field, the attack is interrupted and spent (unchanged).
- **Power ≤ 0 (no debuff floor, M2.5 §6):** a monster whose effective power drops to 0 or below is destroyed immediately. Destruction by debuff is NOT combat: no bank trigger, no wall-punish.

## 6. Banking & bank triggers

- **BANK TRIGGER** = the winner chooses ONE: (a) bank card(s) from their own hand, or (b) remove that many card(s) of their choice from the opponent's public bank. Declinable (`bankTriggerDeclinable: true`).
- **Trigger size scales with the winning blow (ratified default `bankTriggerScaling: 'margin'`):** the scaling value is banded to a card count — 1–4 → 1 card, 5–7 → 2, 8+ → 3. Under `margin` the value is winner-minus-loser effective power (YGO-style); a direct hit uses the attacker's full power. Knob values: `power` (winner's own power) and `off` (flat 1). Ratified after the 120k-game R6 experiment.
- Banked cards leave the hand permanently; bank size unlimited; banks are PUBLIC.
- **Jokers cannot be banked** and have no poker value (`jokersBankable: false`).

## 7. Game end & scoring

- **The game ends ONLY at a draw phase** (M2.5 §2): when the turn player must draw and the deck is empty. Draw-phase draws happen one at a time; if the deck empties mid-draw, keep what was drawn and end there. Mill, Poly, and effect draws NEVER end the game mid-turn (an effect draw from an empty deck draws nothing; partial where possible). A player with an empty deck plays on until their next draw phase.
- **Scoring:** each player's best 5-card poker hand from their entire bank, standard rankings. **Partial banks (<5) score REAL poker categories** (pair, two pair, trips, quads; straights/flushes/full houses need 5) — a 2-card KK pair beats a 4-card ace-high (M2.5 §10).
- **Tie-break:** category → standard kickers → extended kickers (an extra card beats no card) → suit order ♠>♥>♣>♦ on the highest differing card → 6th/7th/… bank card (`tieBreak: 'extendedKickers'`) → true DRAW.
- Draws are accepted in Constructed; in Run mode a draw is neither a win (no rewards) nor a loss (no strike — provisional, RULES-GAPS #7).
- `maxTurns: 300` is a sim-only stall guard (`GameResult.stalled`), never reached in real play.

## 8. Spells & the stack

- **Face cards (J/Q/K) are spells.** At cast time the caster chooses the RANK effect or the SUIT effect — never both.

| Card | Default rank effect | Default suit effect (any face of that suit) |
|---|---|---|
| J | Destroy any one monster | — |
| Q | Discard a number card → your monster +its value until end of turn (`queenBuffDuration: 'endOfTurn'`) | — |
| K | Discard a number card → enemy monster −its value, permanently | — |
| ♠ | — | NEGATE: counter any card/effect on the stack |
| ♥ | — | Revive: special summon a monster from EITHER graveyard, face-up, caster's choice of position, no flip effect |
| ♣ | — | Destroy one face-down SET card in a spell/trap zone (revealed, to graveyard). Cannot target the stack |
| ♦ | — | Polymerization (§10) |

- **Ace as spell fuel (M2.5 §4):** when an Ace is discarded for Q/K, the CASTER chooses 1 or 11 at cast time. Watch item (ratified with eyes open): K + Ace(11) destroys any monster in the game.
- **Sorcery speed:** casting from hand only on your own turn, Main phase, via the stack.
- **Set cards:** to act on the opponent's turn, a face card must have been SET face-down on a previous turn (a card set this turn can't activate until the opponent's next turn at the earliest). Setting spells/traps is a free action (5-zone cap only). Traps set face-down sideways.
- **Stack & priority (MTG-style, full):** casting/activating puts the card on the stack; the caster retains priority; then priority alternates. When BOTH players pass consecutively, the top resolves, then the active player gets priority again. Attack declarations and flip effects use the same stack. (The UI's smarter auto-pass is presentation only — the rules are full priority.)
- **Jokers:** Pot of Greed — draw 2. Sorcery-speed only, cannot be set, cannot be banked, cannot be stickered.

## 9. Effects framework (stickers — ratified REVISION 2, 2026-07-19)

- **Every card resolves its effect through `effectiveCardEffect(card)` = top of `stickerStack` ?? `default:<rank>`.** The base game's defaults are themselves poolable, pre-discovered stickers (15 poolable: A–8 flips + J/Q/K + 4 suits; default 9/10 are effect-less and pool-excluded; Joker is special-cased and unstickered).
- **Stickers are SLOTLESS** — any sticker on any non-Joker card. Placement decides the trigger:
  - on a **number card** (A and 10 included — the old exclusion is repealed) → it is the card's flip effect;
  - on a **face card** → it replaces the card's RANK spell;
  - on a **Cheat Sheet suit slot** → it replaces that suit's spell **for YOUR casts only** (`config.suitOverrides`, per-seat, PUBLIC, ratified asymmetric — your sheet is your house rule; the opponent keeps defaults). One sticker per suit slot, run-long.
- **Effects are CONTEXT-FREE:** one definition per effect, resolvable from any trigger; the trigger only decides *when*. Effects with a "this monster" subject use the flipped monster when flip-triggered, or a chosen target when cast. Effects with discard fuel (Q/K/Leverage) prompt for the fuel at activation, paid at pick time — including as flip effects.
- Display names/text live in the engine registry (`EffectSpec.name`/`text`) — THE anti-drift source. The UI never keeps its own rank/suit → text tables (see CLAUDE.md hard rule).

## 10. Polymerization (♦ suit effect)

- Target: ONE face-up monster you control.
- **The blackjack total STARTS at the target's card value** (M2.5 §5): number = face value; face card (Recast only) = 10; Ace target → caster picks 1 or 11 as Poly begins. The target's card is not drawn or milled — it contributes value and remains the monster being fused.
- Then HIT (draw 1 from your own deck) or STAND, repeatedly. Card values: number = face value; J/Q/K = 10; a drawn Ace → caster picks 1 or 11 at that moment, irrevocably.
- **A drawn Joker is shuffled back and the hit redrawn** (M2.5 §7). Edge (provisional — RULES-GAPS #5): no non-Joker cards left → the hit fails, forced STAND.
- **BUST** (total > 21): the target monster is destroyed; effect fails.
- **STAND:** the target's power becomes ⌈total ÷ 2⌉, permanently (exact 21 → 11).
- All drawn cards go to the caster's graveyard regardless of outcome (Poly self-mills — it feeds the deck-out clock). Mid-Poly deck-out: forced STAND; the game ends at the next failed draw phase, not mid-turn.

## 11. RulesConfig (defaults verbatim from the engine)

```ts
DEFAULT_CONFIG: RulesConfig = {
  handLimit: 6,
  startingHand: 5,
  monsterZones: 5,
  spellTrapZones: 5,
  wallPunish: true,
  wallPunishSelector: 'random',
  jokersBankable: false,
  bankTriggerDeclinable: true,
  bankTriggerScaling: 'margin',
  tieBreak: 'extendedKickers',
  queenBuffDuration: 'endOfTurn',
  mirrorCombat: 'mutualDestroy',
  mulliganStyle: 'shuffle',
  removalFloor: 40,          // Run mode only
  drawPerTurn: 2,
  firstTurnBattle: false,
  firstTurnDraw: false,
  ante: 0,                   // Run mode plays 5
  battleReplay: true,
  maxTurns: 300,             // sim stall guard
}
```

- **Per-seat overrides (M4 A2):** `RulesConfig.overrides` carries per-player deltas over `drawPerTurn` / `ante` / `handLimit` / `startingHand` / `monsterZones`, read exclusively through `cfg()`/`cfgFor()`. **PUBLIC in `viewFor` by design** — rules are never hidden information; boss cheats are visible (Cheat Sheet scrawl).
- **Per-seat suit overrides:** `config.suitOverrides` (sheet stickers, §9), also public.
- Constructed = `DEFAULT_CONFIG`, always. Run mode = `RUN_CONFIG` (ante 5) + sheet-mod patches + per-node overrides, all data.

## 12. Open rules questions

Live list: `RULES-GAPS.md` (generated from `// RULES-GAP:` tags — 7 at consolidation time: Doorstop knock-ons, Warning Shot reveal position, Leverage vs Everlasting, multi-interceptor choice, Joker-only Poly deck, boss-loss rematch, run-draw semantics). Decide with the designers, then delete the tag and regenerate.
