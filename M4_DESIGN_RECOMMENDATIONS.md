# M4 Design Recommendations — Run Layer Content & Structure

---

## ⚡ REVISION 2 (2026-07-19, Mitchell, post-first-walkthrough) — SUPERSEDES §2 (favors), §5's slot model, and the duel-reward economy below

Ratified this session (implementation follows this section where it conflicts with the original text; brother vetoes line-items here):

1. **Favors are BETWEEN-RUN progression, not in-run purchases.** They unlock from account milestones (runs completed / runs won / discoveries — thresholds in `packages/run/src/data/favors.ts`, provisional) and are equipped as a ≤2-slot loadout when a run starts. The in-run shop favor shelf is REMOVED. The shop sells packs + Trim only.

2. **Stickers are SLOTLESS — a kid sticks them wherever.** The sticker is an *effect*; where it lands decides when it fires:
   - on a **number card** (incl. A and 10 — the old §4.2 exclusion is repealed) → it is the card's flip effect;
   - on a **face card** → it replaces the card's RANK spell (the suit spell is not on the card — see next);
   - on a **Recast face-card-monster** (M5) → it is the flip effect;
   - on the **Cheat Sheet's suit entries** → it replaces that suit's spell for YOUR casts only (ratified: asymmetric — the sheet sticker is *your* house rule; the AI keeps defaults). One sticker per suit slot, run-long.
   - Jokers cannot be stickered (M4; revisit with Recast).

3. **Effects are CONTEXT-FREE.** Every effect (catalog stickers AND the base-game defaults) has one definition that resolves in any context; the trigger (flip vs cast) only decides *when*. Effects with a "this monster" subject use the flipped monster when triggered by a flip, or a chosen target when cast as a spell. Full readings table in the M4 brief addendum / `packages/engine/src/effects.ts` (THE source). Notables: Q/K/Leverage as flip effects prompt for their discard fuel at activation; ♦ Poly as a flip effect blackjacks a chosen friendly monster (the flipped one is a legal choice); default 9/10 remain effect-less and are not in any pool.

4. **Default effects join the sticker pool.** "Draw 1", "Polymerization", etc. are stickers too (always available — the base game is pre-discovered), so players rearrange/duplicate defaults to taste. Provisional tiers: number flips = common, J/Q/K + suit spells = uncommon.

5. **Every duel win offers a pick-1-of-3 sticker choice** (tier-weighted per encounter, richer for elites/boss), drawn from ALL implemented effects — already-discovered ones included (you may want another copy), undiscovered ones flagged NEW. **Picking an undiscovered sticker is what unlocks it** (discovery merges into the reward pick; the old separate "1 undiscovered effect per win" channel is removed). Packs still pull from the *unlocked* pool.

---

**Status (updated 2026-07-19):** RATIFIED as the working content set (Mitchell) — brother's ratification pass runs in parallel; everything ships as data so later vetoes/edits are cheap config changes. Decisions locked: **per-player config overlay IS in M4** (boss cheats + future in-duel favors) · **run failure = 3 strikes, flat** (boss-costs-2 and close-loss softening stay playtest tunables) · content lists below are the v1 working set. The M4 implementation brief (`M4_IMPLEMENTATION_BRIEF.md`) is written from this document.

**Ratified this session:** **Run-mode `ante = 5`** (from R1 data — kills the empty-bank draw class, keeps the poker layer live from turn 1, avoids ante-8's pre-dealt feel). Reversible: one `RulesConfig` field, Constructed stays `ante: 0`. Encoded in M4's Run config layer, not in Constructed `DEFAULT_CONFIG`.

**Prime directive still binds:** every effect/mod below becomes engine or run-layer code eventually. Where a recommendation needs the engine to do something it can't yet, it's tagged **⚙ NEW ENGINE WORK** — those tags collectively scope M4's engine budget and must be read before the brief is sized.

> ### ⛔ TOP RISK — the timed duel came back at ~50 minutes for ONE duel
> The first human-timed browser duel (replay `54634500`) clocked **50.4 min wall-clock, ~49 min of it human think-time** (245 decisions, ~12s each). Spec §1's target is **45–60 min for a whole run** (multiple duels). At this rate a run is *one* duel — the 5–7-duels-per-act model in §6 is dead until duel time drops 3–4×.
>
> **But turn count was 42 — dead-center in the sim band. The game isn't structurally long; the *interaction* is.** Of the human's 273 actions, **180 (66%) were `pass`/`nextPhase` ceremony**, only 93 were real decisions. Auto-handling those alone drops think-time from ~49 min toward ~19. Caveats: this replay is the **M3 build at ante 0, pre-bank-scaling** (not current, not ante 5), and 12s/decision is a **first-ever game** (rules-learning tax that won't recur). So the true steady-state number is unknown and almost certainly much lower.
>
> **This is now a pre-M4 UI problem, not an M4 content problem.** Cut the ceremony and re-measure before the run layer gets built — see §6.
>
> **Playtest 2 (replay `85790903`, current build, ante 5):** 39.6 min / 34 turns / 9.8s per decision — the learning tax is dropping (12s → 9.8s), but ceremony held at **62% of human actions even with auto-pass ON**. That confirms the fix isn't "auto-pass when pass is the *only* legal action" (it rarely is — you usually *could* activate a set card); it's **auto-pass unless you actually hold a set trap / castable response**. Until that lands, duels stay ~40 min.

---

## 0. The one structural gap nothing has decided yet: run-failure & run-health

Every other structure question depends on this. The duel win condition (best poker hand at deck-out) is binary per duel — there is no HP bar bleeding across fights the way Slay the Spire has. So the run needs its own failure resource. Recommendation:

- **Lives ("Strikes"): start with 3.** Losing a duel costs one strike; 0 strikes = run ends. Rationale: poker variance + deck-out means even correct play sometimes loses — single-life (Spire-ascension-style) punishes variance, not misplay. A small pool tolerates variance while keeping stakes real. Boss/elite losses could cost 2 (tunable).
- **Currency + deck + stickers are the *graduated* resource** that events nibble at (since there's no HP to chip). This is why risk-event downsides below are currency/sticker/deck-quality, not "lose health."
- Alternative considered and not recommended: per-duel *wager* (bet currency/progress). More design surface, muddier stakes readout, worse fit for a demo. Lives is the readable choice.

Open for you: strike count (3?), whether boss losses cost extra, whether a "close loss" (lost the poker showdown by one category) is softened to no strike. **Recommend shipping the simplest version (3 strikes, flat) and tuning in playtest.**

---

## 1. Sheet mods (target 6–8; each = exactly one RulesConfig field)

Rarest tier, global rule change scrawled on the Cheat Sheet, applies to the **whole duel (both players)** — so the design sweet spot is a symmetric change *your build exploits better than the greedy AI does*. Whiteout mods = a rule flag turned **off**.

| # | Sheet mod (placeholder name) | RulesConfig change | Build it rewards | Status |
|---|---|---|---|---|
| 1 | **No Take-Backs** (whiteout) | `wallPunish: false` | Aggression — attack into walls with no bank penalty | ✅ field exists |
| 2 | **Everlasting** | `queenBuffDuration: 'permanent'` | Queen/number-discard buff builds — temp pumps become permanent | ✅ field exists |
| 3 | **Big Hand** | `handLimit: 8` | Combo/hold builds — less end-of-turn discard pressure | ✅ field exists |
| 4 | **Fast Rules** | `drawPerTurn: 3` | Deck-out/tempo — accelerates the clock symmetrically | ✅ field exists |
| 5 | **High Stakes** | `ante: 8` | Poker-focused — more public cards to build hands from turn 1 | ✅ field exists |
| 6 | **Sudden Death** | `bankTriggerScaling: 'power'` | Big-monster builds — winner's raw power banks more cards | ✅ field exists |
| 7 | **Wild Jokers** | `jokersBankable: true` | Flush/straight builds — jokers become bankable wilds | ⚙ **NEW ENGINE WORK** (see below) |
| 8 | **Recycling** (whiteout-ish) | `removedDestination: 'graveyard'` | Graveyard builds (♥ revive, Scavenge, Undertow) — exiled cards return to grave | ⚙ **NEW ENGINE WORK** (new field) |

Recommend shipping **6** for v1 (1–6, all zero-engine-cost) and treating 7–8 as stretch that unlock the two most interesting archetypes (flush build, graveyard build). If the brother wants a downside/"cursed" mod for flavor, **Defender's Revenge** (`wallPunishSelector: 'defender'` — AI picks which of your bank cards a wall-punish yanks) is the natural one, field already exists.

**⚙ Engine flags this section raises:**
- **Wild Jokers** — `jokersBankable` currently permits the bank *action*, but the poker evaluator must actually score a banked Joker as a wild (flush-relevant only, per the catalog's Wildcard-Bank precedent, to avoid dwarfing every rare). Verify current scoring; likely real work.
- **Recycling** — needs a new `removedDestination: 'exile' | 'graveyard'` field routing bank-removed + wall-punished cards.

---

## 2. Favors (target 10–12; "always in stock," 2 equipped slots)

Persistent, run-long passive perks — build-*shaping*, not build-*defining* (that's sheet mods). To keep M4 scope sane, I've biased favors toward the **run/economy layer** (currency, packs, starting loadout, mulligan) which needs no duel-engine change, and isolated the few that touch in-duel rules — those all require **per-player** config, flagged together at the bottom.

**Economy / meta (no engine change):**
1. **Pack Rat** — packs cost ~15% less.
2. **Lucky Coin** — +currency each shop visit (small, steady).
3. **Sharpie Stash** — start the run with one extra random common sticker.
4. **Trade Binder Regular** — Trade Binder packs roll one extra rare-eligible slot.
5. **Do-Over** — one extra mulligan redraw per duel (mulligan is pre-duel setup, cheap to gate).
6. **Ban Runner** — +1 ban-list slot.
7. **Second Wind (favor)** — once per run, a duel loss costs no strike. (Pure run-state, no engine change.)

**Loadout / start-of-duel (light engine touch — asymmetric ante/hand, see flag):**
8. **Teacher's Pet** — start each duel with 6 cards in hand instead of 5. ⚙ per-player `startingHand`.
9. **Piggy Bank** — you ante 6, opponent antes 5 (asymmetric public-bank head start). ⚙ per-player `ante`.

**In-duel (need per-player config — the "you cheat, mildly" favors):**
10. **Study Hall** — you always see the top card of your own deck. ⚙ view-layer only, no rules change — cheapest of this group.
11. **Quick Study** — the first flip effect you trigger each duel resolves twice (Echo-lite). ⚙ per-player flip doubling.
12. **Thick Skin** — wall-punish removes one fewer of your bank cards (floor 0). ⚙ per-player wall-punish count.

Recommend the **7 economy/loadout favors (1–9 minus the two heaviest) as v1**, holding 10–12 until the per-player config work (below) is in — several of these overlap with what boss-cheats need anyway, so build it once.

---

## 3. The engine architecture decision that favors + bosses both force: per-player config

Favors 8–12 and the boss "visible cheating" the spec licenses (§5) both require **asymmetric rules — one player under different parameters than the other.** Today `RulesConfig` is global. M4 must decide:

- **Recommended:** a thin `PlayerConfig` overlay (per-seat deltas: `anteBonus`, `handBonus`, `extraMonsterZone`, `wallPunishReduction`, `firstFlipDoubles`, …) layered over the shared `RulesConfig`. Keeps Constructed (symmetric) untouched, isolates the asymmetry surface, and one build serves both favors and bosses.
- This is the single biggest engine item M4 introduces. Flagging it now so the brief budgets it rather than discovering it mid-milestone. If the brother wants to *cut* asymmetry from v1, favors collapse to economy-only (1–7) and act-1 boss difficulty comes from starting loadout only (boss opens with pre-slotted stickers / a fatter ante via a symmetric-but-seeded setup) — a legitimate scope-saver worth an explicit yes/no.

---

## 4. Events (target 15–20 ?-nodes; resource / power / risk)

Not engine rules — Run-layer node scripts that mutate run state (currency, deck, stickers, strikes). Craft-theme flavor names are placeholders. Each is a 2–3-choice card.

**Resource (low/no risk — the reliable-gain nodes):**
1. **Lemonade Stand** — take a small pile of currency.
2. **Found a Pack** — a free Corner Store pack, opened now.
3. **Allowance Day** — currency scaled to how deep you are in the run.
4. **Yard Sale** — pay a little; pick 1 of 3 shown stickers.
5. **Trade Up** — give up a common you own → random uncommon.

**Power (build-strengthening, usually a cost):**
6. **Swap Meet** — freely move one sticker from one card to another (re-slot).
7. **Double Down** — apply a second copy of a common you own onto another card.
8. **Sharpen Up** — upgrade one common to its uncommon "upgrade path" (Reveal→Needle, etc.).
9. **Trim a Card** — remove 1 card from your deck (the approved utility, as a free event here).
10. **Cool Kid's Deck** — gain a **rare** sticker, but it lands on a *random* card of your deck (power at the cost of placement control).

**Risk (genuine downside — currency/sticker/deck, never HP):**
11. **The Dare** — coin flip: win a rare sticker / lose a chunk of currency.
12. **The Bully** — pay a toll (currency or a sticker) to pass, or take an elite duel with a handicap for a big reward.
13. **Mystery Box** — unlabeled: a strong sticker, *or* a one-duel curse (temporary duel debuff).
14. **Sugar Rush** — your next duel only: draw 3/turn but hand limit 4 (temporary double-edged sheet-mod).
15. **Borrow a Card** — a strong temporary card added for one duel, then removed (deck never grows permanently — protects the 54-card poker floor).
16. **Overtrim** — remove 2 cards at once (deck-out builds) — but it can drop you toward the 40 floor and thin your poker odds.

**Recovery / narrative (2, to round the pool):**
17. **Recess** — recover one lost strike (the "rest node" analog).
18. **Rival Riley** — optional named elite: guaranteed rare + currency, tougher AI.

Spread: 5 resource / 5 power / 6 risk / 2 recovery = 18. Recommend shipping **~12 for the demo act** (subset that teaches each category) and growing the pool in M5.

---

## 5. Starter seed set (the 8–10 effects new saves begin with)

Seeds the discovery pool so early runs are quasi-deterministic and *teach* — so: mostly commons spanning different axes, a couple clean uncommons, **zero rares** (rares are the "this run changed" moment; they shouldn't be available turn 1). Avoid the rules-edge commons (Copycat, Undertow, Short Fuse's self-destruct) in the seed — keep first contact clean.

**Recommended seed (9):**
- Commons (7): **Peek** (deck manip), **Skim** (mill/deck-out), **Rally** (go-wide), **Doorstop** (defense), **Needle** (disruption/info), **Scavenge** (graveyard), **Warning Shot** (anti-bluff).
- Uncommons (2): **Leverage** (flat +3 buff — easiest to read), **Executioner's Toll** (conditional removal).

Each teaches a distinct axis (tempo, clock, board, wall, disruption, recursion, information) so the player meets the design's breadth before variance ramps.

---

## 6. Node map & act structure

Your instinct — procedurally generated, nodes drawn from a weighted pool, a boss capping each act, one act for the demo — is the right genre-standard model (Slay the Spire). Recommended specifics:

**Topology:** a **branching DAG**, StS-style — ~6 columns between start and boss, 2–4 nodes wide, player picks a path along edges and *cannot* visit everything. This creates route-planning and replay variance that a linear-with-choices layout doesn't. Procedural generation with constraints: guarantee ≥1 Shop before the boss, no two Elites adjacent, every path length equal, boss is a single terminal node all paths converge on.

**Node pool & weights (per non-boss column):**
| Node | Rough weight | Reward |
|---|---|---|
| Duel (standard) | ~45% | currency + discovery-pool growth |
| Event (?) | ~25% | varies (§4) |
| Shop | ~12% | spend currency (packs + singles shelf) |
| Elite Duel | ~10% | guaranteed rare discovery + currency |
| Treasure | ~8% | a free sticker pick |

**Act length — GATED ON FIXING DUEL TIME FIRST (see Top Risk).** The timed duel is now in and it broke the earlier estimate: **~50 min for one duel**, vs my prior ~8–12 min guess. Node count = *duel wall-clock × duels-per-act ≤ 45–60 min run target*, so until duel time comes down there is no honest act length to set. The sequence:

1. **Cut the ceremony (pre-M4, UI-only).** 66% of human actions were `pass`/`nextPhase`. Turn **auto-pass on by default** (it exists as a dev toggle), and auto-advance `nextPhase` when the player has no legal instant-speed response in the upcoming window. Target: only prompt for priority when the player actually holds a set trap / castable response. This alone should roughly halve think-time on the existing data.
2. **Re-measure on the *current* build at ante 5** (this replay was the M3 build, ante 0, pre-bank-scaling). Get **2–3 duels from the same player**, not one — the first is a rules-learning outlier; steady-state is the number that sets the map.
3. **Then compute act length.** Rough projection *if* fixes land duels at ~12–18 min steady-state: 45–60 min run ≈ **3–4 duels for the demo act**, ~7–10 total nodes. If duels stubbornly stay ~20–25 min even after the UI cut, the demo act is ~2–3 duels **and spec §1's 45–60-min run target itself needs revisiting** (it's provisional).
4. **Last-resort lever, NOT recommended yet, designer call only:** if auto-pass can't get ceremony low enough, the structural root is the full MTG-style priority stack (the base ruleset deliberately chose full priority). Simplifying to single-response windows would cut ceremony hard but is a base-rules change with large blast radius — exhaust the UI fixes first.

**Encounter ladder (difficulty via config, not smarter AI — per spec §5):** every node runs the **greedy** agent. Difficulty scales by **asymmetric config**, not intelligence:
- Standard duels: greedy on the shared Run baseline (ante 5, etc.).
- Elites: greedy + a mild seat bonus (e.g. +1 ante or a pre-slotted sticker).
- **Act-1 boss — "The Grown-Up"** (placeholder): the visible-cheat the theme licenses — e.g. opens at ante 8 to your 5, or draws 3/turn, or fields a 6th monster zone. Pick **one** legible cheat for the demo so the boss *reads* as bending the rules on the Cheat Sheet. ⚙ This needs the per-player config from §3 — same system as asymmetric favors.

**Rewards ladder:** duel win → currency + pool growth; elite → guaranteed rare; **boss → a build-defining reward: pick-1-of-3 including at least one sheet mod**, plus currency, plus (demo) the run's completion carrying discoveries into the full game per spec §8.

---

## 7. Summary of what this commits the M4 engine to

Read this before sizing the brief — it's the delta beyond "wire up a node map + SQLite/IndexedDB":
1. **Per-player config overlay** (§3) — enables asymmetric favors and boss cheats. Biggest item. *Cuttable* (favors → economy-only, boss → loadout-only) if you want a leaner v1.
2. **`removedDestination` field** (Recycling sheet mod, §1).
3. **Wild-Joker poker scoring** (Wild Jokers sheet mod, §1) — verify/extend the evaluator.
4. **Engine-owned effect text, tooltips read the EFFECTIVE effect** (drift fix). Today the UI hover text (`packages/web/src/ui/cardFace.ts`) duplicates base-rule effect strings keyed off a card's raw rank/suit — fine now, but the moment a sticker covers a card's effect, the tooltip will show the wrong (default) text. The catalog's effect data must carry a human-readable descriptor consumed by BOTH the reducer's behaviour and the UI, and the tooltip must render `effectiveEffect(card)` (post-sticker), not the raw card. This is the concrete form of the long-standing "UI drifts from the rules engine" risk, now with a Run-mode trigger. Do it when stickers land.
5. Everything else (node map, procedural gen, events, favors 1–7, shop, discovery pool, strikes, persistence) is **new Run-layer code around an unchanged duel engine** — no base-rules risk.

---

## Open decisions for the brother (the ratification checklist)

1. **Run-failure model** (§0): 3 strikes, flat? boss = 2? close-loss softening?
2. **Asymmetry in/out for v1** (§3): build per-player config, or cut to economy-favors + loadout-bosses?
3. **Sheet mods:** ship 6 (zero-engine) or 8 (adds the two archetype-openers)?
4. **Favor slots** confirmed at 2; which 7 (or more) of the 12 ship for the demo?
5. **Events:** which ~12 of the 18 for the demo act?
6. **Starter seed:** the 9 as listed, or adjust?
7. **Map numbers:** the timed duel is in (~50 min) and says the problem is interaction ceremony, not turn count (§6, Top Risk). **Binary next action: turn auto-pass on by default + auto-advance dead phases (UI-only, pre-M4), then re-time 2–3 duels on the current build at ante 5.** Act length can't be set until that number lands; this is now the gate, ahead of any run-layer code.
