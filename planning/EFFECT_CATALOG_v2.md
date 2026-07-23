# Effect Catalog v2 — sticker effects (slotless model)
## House Rules (working title)

**Status:** regenerated 2026-07-23 from `EFFECT_CATALOG_v1.md` (deleted; recoverable from git history) under the ratified REVISION 2 effect model. **Effect texts are carried verbatim** — for the 9 implemented effects the engine registry text (`packages/engine/src/effects.ts`) is shown and authoritative; for unimplemented effects the v1 text stands as the design source and M5 must implement it verbatim or raise a `// RULES-GAP:`.

**The slotless model (ratified 2026-07-19 — replaces v1's "slot target" framing):**
- Effects are **context-free**: one definition resolves in any trigger context. Where a sticker lands decides *when* it fires — on a **number card** it is the flip effect; on a **face card** it replaces the RANK spell; on a **Cheat Sheet suit slot** it replaces that suit's spell for YOUR casts only. "This monster" subjects use the flipped monster when flip-triggered, a chosen target when cast; discard-fuel effects prompt for fuel at activation.
- v1's A/10 exclusion is **repealed** — any sticker fits any non-Joker card. Jokers cannot be stickered (revisit with Recast).
- The **base-game defaults are themselves poolable, pre-discovered stickers** (15 poolable: the A–8 flips, J/Q/K rank spells, 4 suit spells; default 9/10 are effect-less and pool-excluded). Registry names: "`<key>` (default)" — no invented names.
- The tier groupings below keep v1's *design lineage* (what each effect was originally shaped to replace) purely as organization — it is not a placement restriction.

Naming remains placeholder — flag any for rename or cut.

---

## COMMON (designed as number-card flip alternates)

| Name | Effect | Status |
|---|---|---|
| **Peek** | Look at the top 3 cards of your deck, rearrange them in any order. | ✅ implemented |
| **Skim** | Mill 1 card from your own deck, then draw 1 card. | ✅ implemented |
| **Rally** | All your other face-up attack monsters gain +1 power until end of turn. | ✅ implemented |
| **Doorstop** | This monster cannot be destroyed by combat this turn (survives regardless of power comparison). | ✅ implemented (knock-on reading = RULES-GAPS #1) |
| **Needle** | Opponent reveals their hand to you, then you choose 1 card — they discard it. | ✅ implemented |
| **Scavenge** | Return 1 random card from your graveyard to your hand. | ✅ implemented |
| **Warning Shot** | Deal no combat effect, but force 1 opposing face-down monster to reveal itself (flip face-up) without triggering its flip effect. | ✅ implemented (reveal position = RULES-GAPS #2) |
| **Feint** | This monster may switch position (attack ↔ defense) once, immediately, without ending your turn. | M5 |
| **Stall** | Opponent's next normal summon this turn is skipped (does not carry over). | M5 |
| **Undertow** | Destroy this monster; special summon a monster from your graveyard in its place, face-down. | M5 |
| **Short Fuse** | Mill 3 cards from opponent's deck, but this monster is destroyed immediately after. | M5 |
| **Copycat** | Copy the flip effect of any one monster currently in either graveyard; resolve it now. | M5 (tricky: dynamic reference — resolve through the copied card's effective effect at resolution time) |
| **Tax** | Opponent must discard a card from hand or skip their next spell/trap activation this turn. | M5 |
| **Graft** | Banked cards you own count as +1 rank for this game's poker-hand scoring only when compared for ties. | M5 (tricky: touches the extended-kickers tie-break path — needs a dedicated test) |

## UNCOMMON (designed as face-card rank / suit alternates)

| Name | Lineage | Effect | Status |
|---|---|---|---|
| **Leverage** | Q | Discard a face card to give your monster +3 power until end of turn. | ✅ implemented (duration vs Everlasting = RULES-GAPS #3) |
| **Executioner's Toll** | J | Destroy a monster with power 5 or lower. | ✅ implemented (excludes face-down targets — info-leak guard, tagged) |
| **Overwhelm** | J | This turn only, your attacking monsters that lose combat still destroy the defender (mutual destruction instead of losing outright). | M5 |
| **Siege Engine** | K | Debuff an opposing monster by 3, permanently, regardless of what's discarded (no discard cost). | M5 |
| **Turncoat** | K | Take control of an opposing monster with power 3 or lower until end of turn; return it after. | M5 |
| **Riposte** | ♠ | Instead of negating, redirect the targeted spell/trap to hit its owner instead (if it has a valid alternate target). | M5 |
| **Vigil** | ♠ | Negate one attack declaration entirely (monster stays untapped, no combat occurs). | M5 |
| **Second Wind** | ♥ | Return a monster from your own graveyard to your hand instead of special summoning it. | M5 (name collides with the Second Wind favor — rename one) |
| **Grave Robber** | ♥ | Special summon a monster from opponent's graveyard only (can't target your own); it enters with -2 power. | M5 |
| **Sunder** | ♣ | Destroy any spell/trap on the field, including ones already on the stack (unlike the default Club). | M5 (power-review flag: undercuts Club's core restriction) |
| **Landslide** | ♦ | Special summon a monster directly from your hand, face-down, no cost. | M5 |

## RARE (rule-bending, build-defining — all M5)

| Name | Effect | Notes |
|---|---|---|
| **Recast** | Converts this card's type (monster ↔ spell). Number cards become sorcery-speed spells; face cards become 10-power monsters (flat 10 power / 2-sac cost per the conversion rule). The effect is purely the conversion — the card's sticker stays independent (`typeOverride` field, not a sticker). | Schema landed in M1; behavior M5. Power-review flag. |
| **Loaded Deck** | While this monster is face-down (set), it counts as a 10 for combat purposes only (real value is used for everything else — bank scoring, sacrifice cost, etc). | Bluff engine; countered by reveal effects. |
| **Second Chance** | The first time this card would be destroyed each game, it isn't. | Power-review flag: can trivialize a single big combat. |
| **Wildcard Bank** | While banked, this card may count as any suit (not rank) for the purposes of scoring flush-type hands only. | Deliberately narrow — the precedent that full wilds were never intended. |
| **Echo** | Whenever this card's flip effect resolves, it triggers a second time immediately after. | Universal amplifier / combo piece. |

---

## Design notes (carried forward where still true)

- **Coverage:** 14 commons / 11 uncommons / 5 rares. Uncommon lineage coverage is uneven (♣ and K have 2 each, others 1) — worth a balancing pass before the tier is called complete. Rares stay intentionally sparse.
- **Power-review flags:** Sunder, Recast, Second Chance — each undercuts an existing rule constraint rather than adding an option alongside it; extra playtest attention.
- **Provisional tiers for defaults:** number flips = common, J/Q/K + suit spells = uncommon (set in the engine registry).
- The v1 note recommending A/10 stay out of the pool is superseded by the slotless repeal; if playtesting shows A/10 stickering deletes their identity (Ace's 1/11 duality, 10's raw statline), reopen at the design table rather than reinstating a slot rule silently.
