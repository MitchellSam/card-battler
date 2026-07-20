# Effect Catalog — First Pass (Run Mode)

Every card starts with its **default** effect (as defined in the base ruleset). Everything below is an **alternate** effect that can be discovered via packs and slotted in to cover a card's default. Organized by tier, matching the existing cost/power curve logic already used for defaults.

Naming is placeholder — flag any you want renamed or cut.

---

## COMMON — Number Card Flip Effect Alternates

*Slot target: any number card's flip-effect slot (2-9). Same design principle as the defaults: cheap tempo/info tools. Roughly 2-3 alternates per default slot so packs have real variety to pull from.*

| Name | Effect | Notes |
|---|---|---|
| **Peek** | Look at the top 3 cards of your deck, rearrange them in any order. | Info + light deck manipulation, cheap slot. |
| **Scavenge** | Return 1 random card from your graveyard to your hand. | Alt to draw-style effects; graveyard becomes a resource. |
| **Feint** | This monster may switch position (attack ↔ defense) once, immediately, without ending your turn. | Tempo trick, synergizes with bluffing. |
| **Needle** | Opponent reveals their hand to you, then you choose 1 card — they discard it. | Stronger info + light disruption; pairs well as an upgrade path from "Reveal hand." |
| **Graft** | Banked cards you own count as +1 rank for this game's poker-hand scoring only when compared for ties. | Small, situational scoring nudge — low power by design, avoids messing with real hand strength. |
| **Skim** | Mill 1 card from your own deck, then draw 1 card. | Self-mill/filter effect — thins deck toward deck-out while smoothing draws. |
| **Warning Shot** | Deal no combat effect, but force 1 opposing face-down monster to reveal itself (flip face-up) without triggering its flip effect. | Direct counter to bluff-heavy opponents; explicitly effect-less flip is a notable exception worth flagging as a rules edge case. |
| **Stall** | Opponent's next normal summon this turn is skipped (does not carry over). | Tempo denial, single-turn only. |
| **Rally** | All your other face-up attack monsters gain +1 power until end of turn. | Small go-wide payoff; only matters if the board has multiple attackers, so it rewards a specific playstyle. |
| **Undertow** | Destroy this monster; special summon a monster from your graveyard in its place, face-down. | Trades your monster for a graveyard pick — interesting risk if the replacement is worse. |
| **Short Fuse** | Mill 3 cards from opponent's deck, but this monster is destroyed immediately after. | High mill value, self-destruct cost — strong late-game deck-out tool. |
| **Copycat** | Copy the flip effect of any one monster currently in either graveyard; resolve it now. | Build-around payoff if graveyards are stacked with strong flip monsters. |
| **Doorstop** | This monster cannot be destroyed by combat this turn (survives regardless of power comparison). | Defensive tool, especially strong on a face-down defender facing a guessed attack. |
| **Tax** | Opponent must discard a card from hand or skip their next spell/trap activation this turn. | Disruption, punishes hand-heavy boards. |

---

## UNCOMMON — Face Card Rank/Suit Effect Alternates

*Slot target: J/Q/K rank slots, or ♠/♥/♣/♦ suit slots. Same power band as existing defaults — real removal, real disruption, real card advantage, just different shapes.*

| Name | Slot type | Effect |
|---|---|---|
| **Executioner's Toll** | Rank alt (J) | Destroy a monster with power 5 or lower — cheaper condition than universal instant-kill, but restricted by power. |
| **Overwhelm** | Rank alt (J) | This turn only, your attacking monsters that lose combat still destroy the defender (mutual destruction instead of losing outright). |
| **Leverage** | Rank alt (Q) | Discard a face card to give your monster +3 power until end of turn (flat, no number-matching needed). |
| **Siege Engine** | Rank alt (K) | Debuff an opposing monster by 3, permanently, regardless of what's discarded (no discard cost). |
| **Turncoat** | Rank alt (K) | Take control of an opposing monster with power 3 or lower until end of turn; return it after. | 
| **Riposte** | Suit alt (♠) | Instead of negating, redirect the targeted spell/trap to hit its owner instead (if it has a valid alternate target). | Higher skill ceiling than a flat negate, situational. |
| **Vigil** | Suit alt (♠) | Negate one attack declaration entirely (monster stays untapped, no combat occurs). | Narrower than universal negate — combat-only counter. |
| **Second Wind** | Suit alt (♥) | Return a monster from your own graveyard to your hand instead of special summoning it. | Softer, cheaper alt to reborn — card advantage without a board commitment. |
| **Grave Robber** | Suit alt (♥) | Special summon a monster from opponent's graveyard only (can't target your own); it enters with -2 power. | Stealing specifically, at a stat cost — flavor-distinct from the default's "either graveyard, full stats." |
| **Sunder** | Suit alt (♣) | Destroy any spell/trap on the field, including ones already on the stack (unlike the default Club). | Direct upgrade path on Club's core restriction — meaningfully stronger, should be rarer within the uncommon pool. |
| **Landslide** | Suit alt (♦) | Special summon a monster directly from your hand, face-down, no cost. | Alt special-summon that doesn't touch Polymerization's blackjack mini-game — good for players who want Diamond's summon utility without the bust risk. |

---

## RARE — Type-Conversion & Rule-Bending Effects

*Slot target: any card. Low frequency, high impact, meant to be genuinely build-defining — an Inscryption-style "this run just changed" moment.*

| Name | Effect |
|---|---|
| **Recast** | Converts this card's type (monster ↔ spell). Number cards become sorcery-speed spells (see type-conversion rule); face cards become 10-power monsters (per existing rule). This effect itself does nothing else — it's purely the conversion, freeing up the card's other slot for a second cover. |
| **Loaded Deck** | While this monster is face-down (set), it counts as a 10 for combat purposes only (real value is used for everything else — bank scoring, sacrifice cost, etc). | Turns any cheap monster into a legitimate defensive wall bluff — high risk if discovered by Club/Warning Shot-style reveal effects. |
| **Second Chance** | The first time this card would be destroyed each game, it isn't. | Extremely strong on an expensive sac-summoned monster; rare specifically because it can trivialize a single big combat. |
| **Wildcard Bank** | While banked, this card may count as any suit (not rank) for the purposes of scoring flush-type hands only. | Direct, careful buff to the poker-hand win condition — deliberately narrow (suit only, flush-relevant only) to avoid breaking hand-strength math the way a full "wild" would. |
| **Echo** | Whenever this card's flip effect resolves, it triggers a second time immediately after. | Universal amplifier — power level depends entirely on what it's paired with, which is exactly the kind of combo piece the rare tier should contain. |

---

## Design notes / open flags

- **Common count**: 13 listed here as a starting spread across the 8 flip-effect slots (2-9) — likely needs 1-2 more passes once you see which slots feel thin in actual pack odds testing.
- **Uncommon count**: 11 across 7 face-card slots (J/Q/K rank + 4 suits) — roughly even coverage, Club (♣) and King (K) currently have 2 alternates each, others have 1; worth balancing to at least 2 each before this is considered a complete uncommon tier.
- **Rare count**: 5, intentionally sparse. This tier is the one most likely to need iteration once you see what commons/uncommons look like in practice, since rares should feel meaningfully stronger than uncommons, not just "uncommon effects but bigger numbers."
- **Sunder** (uncommon) and **Recast**/**Second Chance** (rare) are the three effects most likely to need power-level review — each one directly undercuts an existing rule constraint (Club's stack restriction, sac-summon cost investment) rather than just adding a new option alongside it. Worth flagging for extra playtest attention specifically.
- No effects here touch Ace's flip slot or 10's flip slot — Ace already has a defined identity (1/11 duality) that a cover would likely just delete rather than enhance, and 10 was deliberately "no effect" so its payoff stays the raw stat line. Recommend leaving both out of the common pool entirely unless playtesting specifically calls for exceptions.
