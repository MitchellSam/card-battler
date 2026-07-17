# M2 FINDINGS — Simulation Results & Designer Decisions Required

**Generated:** 2026-07-16 · **Data:** 520k games (52 matchup×config runs × 10k games).
Full numbers in `results/E*/REPORT.md`; every outlier game reproducible from
`results/*/replays/` (action log + seed). Regenerate everything with
`./scripts/m2-experiments.sh` then `npm run sim -- report results/<dir>`.
**Method:** five heuristic agents (random / aggro / turtle / banker / greedy) over the
M1 engine. Agents see only `PlayerView`; games are fully deterministic from their seed.

**Scope of validity (spec §9):** these sims validate *pacing* and expose *degeneracy*.
They cannot validate fun. greedy is a measuring instrument, not a skilled player —
read absolute win rates between different agents as bounds, not balance.

---

## Verdict summary

| Question | Verdict |
|---|---|
| Pacing vs band (median 30-70, p95 < 150, stall < 1%, greedy×greedy) | **Baseline misses the band high**: median 78 (p95 84, max 90 — tight). `drawPerTurn: 2` lands mid-band: median 40. Stall rate 0% everywhere. |
| Engine crashes | **Zero** across 520k+ games. Zero deadlocks, zero `maxTurns` stalls. Exit criterion met. |
| Double-turtle stall (oldest open question) | **No stall is possible** — the draw-per-turn clock deck-outs both players at a hard ceiling (turn 98 baseline, exact). But turtle×turtle is **100.0% draws** with both banks at 0.0 cards: passive play *starves*, and mutual passivity is a guaranteed draw. |
| Poker layer engagement | **Under-engaged at baseline**: 67% of greedy×greedy showdown hands are partial (<5 cards); winners average 5.7 banked cards. `drawPerTurn: 2` fixes this too (partial only 9% of winning hands; full house 45%). |
| First-player advantage | Skip-first-draw is calibrated for neutral play (random mirror 49.4% ✓) but **not strategy-stable**: greedy mirror 46.1%, aggro mirror 44.7% (second-player edge), banker mirror **66.0% first-player**. |
| Wall-punish selector | Outcome-neutral for fixed-policy agents; it's a feel decision. |
| Deck-out trigger | `failedDraw` adds ~1-2 turns, shifts win rates ≤1 pt. Keep `zeroCards`. |
| Joker Poly value | Nearly inert either way (greedy bust 7.6% → 7.0%). Settle RULES-GAPS #2 on taste; recommend keeping 0. |

---

## E0 — Baseline, all 25 ordered pairings × 10k

Win-rate matrix (row vs column, both seats pooled; draws count against both):

| | aggro | banker | greedy | random | turtle |
|---|---|---|---|---|---|
| **aggro** | 50.0% | 4.4% | 0.2% | 62.6% | 17.4% |
| **banker** | 95.6% | 49.5% | 8.5% | 99.4% | 51.2% |
| **greedy** | 99.8% | 91.3% | 49.8% | 99.8% | 99.6% |
| **random** | 37.2% | 0.3% | 0.1% | 43.0% | 2.0% |
| **turtle** | 0.0% | 0.0% | 0.0% | 10.6% | 0.0% |

Reading it as design signal (not balance):

- **The bank-trigger economy punishes mindless aggression hard.** aggro (attack
  whenever legal) loses ~100% to greedy and 96% to banker — every suicide attack
  hands the opponent a bank-or-remove trigger. The core loop works as intended.
- **Pure passivity is weak** (turtle loses everything it doesn't draw) **but produces
  draw fests against non-finishers**: aggro-vs-turtle is **83% draws** (aggro bleeds
  12.9 wall punishes/game into turtle's walls and gets its small bank stripped),
  random-vs-turtle 88% draws. Only agents that can *finish* (greedy: J-kills + selective
  attacks) convert turtle games.
- **greedy vs banker (91%)**: combat pressure beats pure poker optimization — bank
  quality doesn't matter if your board dies and triggers stream to the opponent.
- Median game length across matchups: 78-98 turns; every game ends by deck-out; the
  turn-98 ceiling (54-card decks, draw 1, skip first draw) is the de-facto game clock.

## E1 — Turtle stall verdict (E0 + E2 data)

The question "do double-turtle games stall forever?" is **settled: no.** The draw
clock guarantees termination (turtle×turtle: every game ends at exactly turn 98;
0 stalls in 20k games across configs; `maxTurns: 300` never fired for any matchup).

The real degeneracy is different: **mutual passivity is a guaranteed 0-0 draw**
(banks stay literally empty — no attacks ⇒ no triggers ⇒ nothing banked; showdown
compares two empty banks). Under `drawPerTurn: 2` it's the same picture at turn 50.
Whether a mutual-refusal draw is acceptable is a design call (decision #2); candidate
pressure valves if not: a passive trigger source, or a showdown tiebreak that
punishes the emptier bank / more cards remaining.

## E2 — Pacing lever (`drawPerTurn` ∈ {1, 2})

**Band: median 30-70 total turns, p95 < 150, stall < 1% (greedy×greedy).**

| metric (greedy×greedy) | baseline (draw 1) | drawPerTurn 2 |
|---|---|---|
| median / p10 / p90 / max turns | 78 / 72 / 83 / 90 | **40** / 38 / 43 / 46 |
| stall rate | 0% | 0% |
| mean bank size (winners / losers) | 5.7 / 0.6 | 9.3 / 1.6 |
| showdown hands that are partial | 67% | 51% (winners: only 9%) |
| winning hand mode | partial 34%, full house 22% | **full house 45%, four of a kind 16%** |

- Baseline sits just above the band; the brief's deck-math prediction was accurate.
- `drawPerTurn: 2` lands mid-band for every matchup (aggro mirror 46, banker mirror 46,
  random mirror 42, turtle mirror 50) **and engages the poker win condition** — bigger
  hands, bigger banks, real best-5 categories deciding games. It's the strongest
  single lever M2 tested and improves two verdicts at once.
- **Watch-out:** game length becomes clock-dominated and low-variance (p10-p90 spread
  ≈ 5 turns). If strategic deck-depletion (racing when ahead) is supposed to matter,
  draw-2 halves the room for it. Alternatives if that's a concern: keep draw-1 and
  shrink starting decks (Run mode already owns deck-size as a mechanic), or draw-2
  only under some condition. Both are new experiments, one config each.

## E3 — Wall-punish severity (`wallPunishSelector`)

greedy/aggro pairings × {random, defender, attacker}, 10k each:

- **Win rates, game length, and behavior metrics are statistically indistinguishable
  across all three selectors** (e.g. greedy mirror p0 win 50.1-50.2% in all three).
  Caveat: fixed-policy agents can't *react* to severity — humans will.
- The decision the flag governs is live at sane rates: greedy attacks into defense
  2.0/game eating ~1.0 wall punish (~0.9 bank cards); attacking walls is a
  cost-benefit choice, not never/always. (aggro's 12.9 punishes/game vs turtle shows
  the ceiling.)
- **Recommendation:** since outcomes don't move, choose on feel. `random` (current
  default) reads as a gamble and matches the theme; `defender` is maximally brutal
  (defender strips the attacker's best-5 card — data confirms it removes the
  highest-value card virtually every time).

## E4 — First-player advantage (from E0)

First-player win rate among decided games:

| matchup | 1st-player win | in 48-52% band? |
|---|---|---|
| random mirror | 49.4% | ✓ |
| greedy mirror | 46.1% | ✗ (second-player edge) |
| aggro mirror | 44.7% | ✗ (second-player edge) |
| banker mirror | **66.0%** | ✗✗ |

**Verdict: the skip-first-draw compensation is calibrated for policy-neutral play but
is not strategy-stable.** Combat-forward mirrors favor the *second* player (going
first means committing a monster into the opponent's fresh, larger hand); the
trigger-scarce banker mirror strongly favors the *first* player (first safe attack
window arrives first, and with only 2.7 triggers/game each one is decisive).
Options: accept (heuristic artifact — real players mix strategies), or test stronger
compensation (second player +1 starting card) as a one-config experiment. Flag for
playtest attention rather than immediate change.

## E5 — Deck-out trigger (`deckOutTrigger` ∈ {zeroCards, failedDraw})

- `failedDraw` grants ~1-2 extra turns (greedy mirror median 78 → 79, aggro mirror
  90 → 92) and moves win rates ≤1 pt (greedy-vs-banker 91.1% → 91.8%).
- No degeneracy either way. **Recommendation: keep `zeroCards`** — simpler to teach
  ("deck hits zero, game ends"), and the margin it affects is negligible.

## E6 — Joker Poly value (`polyJoker` ∈ {zero, wildTo21})

- greedy mirror: Poly casts unchanged (2.54/game), bust rate 7.6% → 7.0%, average
  stood total 17.2 → 17.4. random mirror: bust 31.3% → 33.3% (a wild-inflated total
  makes a random subsequent HIT more likely to bust).
- **Verdict: nearly inert** — jokers just aren't drawn during Poly often enough
  (~2/54 per draw, ~3 draws per Poly). RULES-GAPS #2 can be settled on taste;
  recommend the conservative **0** already implemented. (Note this experiment is
  about Poly *draws*; whether jokers are *bankable* is decision #7 and untested.)

## Performance & engineering notes

- **Bench: ~900 random-agent games/sec** single thread (target ≥100; 527/s even while
  6 sim jobs share the machine). Two optimizations were required to get there:
  `structuredClone` per action → hand-written cloner sharing immutable `GameCard`
  refs (~10x), and `showdown()` no longer evaluates each bank twice.
- Degenerate farm matchups (banker farming aggro) grow 20+-card banks; best-5
  enumeration is C(n,5), so those runs do ~25 games/sec. Fine at M2 scale; if M5
  needs fast big-bank sims, the poker evaluator wants an O(n) best-hand path.
- New `RulesConfig` knobs this milestone: `drawPerTurn` (1), `maxTurns` (300, emits
  `GameStalled` + `result.stalled`), `polyJoker` ('zero'); `deckOutTrigger:
  'failedDraw'` is now actually implemented (M1 declared it but never read it).
- Blowout artifact worth knowing: a farming winner earns 35+ triggers/game of which
  ~90 are *unusable* (`BankTriggerSkipped`: hand empty / opponent bank empty).

---

# Designer Decisions Required

The agenda for the design session. ☐ = undecided. Items 1-6 have data above;
7-11 are cheap follow-up experiments if wanted; 12-14 are new questions M2 raised.

## A. From experiment data

1. ☐ **Pacing + poker engagement:** adopt `drawPerTurn: 2` (median 40, real poker
   hands decide games), keep draw-1 (~78-turn games, 67% partial hands), or pursue a
   third lever (smaller starting decks). §E2 — this is the headline decision.
2. ☐ **Mutual-passivity draws:** turtle×turtle = 100% draws, aggro/random-vs-turtle
   80-88% draws. Acceptable, or add an anti-draw valve (passive trigger source /
   bank-size tiebreak at showdown)? §E1
3. ☐ **Wall-punish selector:** random / defender / attacker — outcome-neutral for
   fixed policies; pure feel. §E3
4. ☐ **Deck-out trigger:** recommend `zeroCards`; confirm. §E5
5. ☐ **Joker in Poly:** recommend 0 (wild is nearly inert); settles RULES-GAPS #2's
   Poly half. §E6
6. ☐ **First-player compensation:** skip-first-draw isn't strategy-stable (46% combat
   mirrors, 66% banker mirror). Accept as heuristic artifact or experiment with
   second-player +1 card. §E4

## B. RulesConfig flags awaiting a default decision (untested, one config each to test)

7. ☐ `jokersBankable` (false now; pairs with RULES-GAPS #2's banking half).
8. ☐ `bankTriggerDeclinable` (true now; note: no agent ever declined in 520k games —
   a forced bank-or-remove would simplify rules text at zero observed cost).
9. ☐ `queenBuffDuration` ('endOfTurn' now; 'permanent' untested).
10. ☐ `mulliganStyle` ('shuffle' now; 'bottom' untested).
11. ☐ `polyInitialDeal` (2 now, per mockup assumption — RULES-GAPS spec question #3).

## C. The 12 RULES-GAPS entries

See [RULES-GAPS.md](RULES-GAPS.md) — all still open, each implemented conservatively
and tagged in code. Now with data: **#2** (Joker Poly value → §E6, recommend 0);
**#3/#4** (partial-bank & extended-kicker comparison — exercised millions of times,
including the all-partial turtle showdowns, without incident; the "extra card beats
no card" reading produces the 0-0 draws in §E1, so it interacts with decision 2).

## D. New questions M2 raised

12. ☐ **Bank sizes vs the poker fantasy:** at baseline the best-5 win condition is
    mostly decided by partial hands. If draw-1 is kept for other reasons, the bank
    economy needs another source of cards (see 1).
13. ☐ **Trigger scarcity in careful play:** banker mirror = 2.7 triggers/game total.
    Two cautious players barely interact with the bank. Is that intended tension
    (first trigger is huge) or starvation?
14. ☐ **Unusable triggers in blowouts** (~90/game skipped when farming): harmless in
    PvP-representative play, but Run-mode boss blowouts may want a third trigger
    option (e.g., draw a card) so the reward stream stays live.

---
---

# M2.5 ADDENDUM — Re-simulation under the ratified rules (July 2026)

**Everything above this line is M2 data under the PRE-ratification rules — kept as
historical record.** The design session ratified the M2.5 changes
(`M2.5_IMPLEMENTATION_BRIEF.md`); all eleven sections are implemented and tested
(112 engine + 4 harness tests). New baseline = **draw-2 + no first-turn Battle Phase + game end only at
a draw phase**, plus: Ace as 1/11 spell fuel, Poly starts at the target's card value
with Joker reshuffle, no debuff floor, direct-attack interception, generalized
mirror destruction, real poker categories for partial banks, and the Run-mode
`ante` knob. Data: 350k games (R0: 25 pairings, R1: ante sweep), 10k each, in
`results/R0` and `results/R1`. **Zero crashes, zero stalls, zero deadlocks.**
`RULES-GAPS.md` is down to the two provisional edges named in the brief.

## R0 — New-baseline verdicts

- **Pacing: IN BAND.** greedy×greedy median **42** turns (p10 40, p90 45, max 48);
  every matchup sits at 42-50. The turtle-mirror hard ceiling is exactly turn 50.
- **Poker layer: engaged.** greedy-mirror winners bank 9.3 cards; winning hands are
  full house 44% + four of a kind 22%; high-card wins are 4%. (M2 baseline for
  comparison: 34% of wins were partial hands.) §10 partial scoring removed the
  partial-hand bucket entirely.
- **Win matrix ordering unchanged** (greedy > banker > aggro > random > turtle);
  the trigger economy still executes mindless aggression (aggro 0.3% vs greedy).
- **Draws concentrated exactly where banks stay empty:** turtle rows unchanged
  (69-92% draws vs non-finishers), and — new — **banker×banker is now 49% draws**
  (games shortened 90→46 turns; cautious play only earns ~1.0 trigger/game; mean
  final bank 0.5 cards). Mutual passivity remains the design's draw engine (see
  decision 2 — and note R1 shows ante eliminates it).

## R1 — Ante sweep (the Run-mode pacing knob): ante ∈ {0=R0, 5, 8}

| metric (greedy mirror) | ante 0 | ante 5 | ante 8 |
|---|---|---|---|
| median turns | 42 | 38 | 35 |
| winner / loser bank size | 9.3 / 1.6 | 12.8 / 4.1 | 15.7 / 7.0 |
| winning hands: FH / quads / SF | 44% / 22% / 1% | 45% / 34% / 5% | 39% / 42% / 14% |
| high-card share of all showdown hands | 44% | 29% | 20% |
| banker-mirror draw rate | 49.1% | 0.0% | 0.0% |
| bank-vs-remove choice ratio | 88 : 12 | 85 : 15 | 88 : 12 |

- Ante does exactly what it was designed to do: shorter duels, a live poker layer
  from turn 1, and it **eliminates the empty-bank draw class outright** (banker
  mirror 49% → 0%).
- At ante 8 the pre-seeded randomness starts to dominate outcomes (winning hands are
  56% quads-or-better; greedy's edge over banker softens 97% → 87.5%) — the duel
  starts feeling pre-dealt.
- **Recommendation: ante 5 for Run mode.** Full draw-kill and category engagement
  with less pre-deal dominance; ante 0 stays Constructed-canonical. (Final call =
  designers; both configs are one flag away.)

## R2 — First-player advantage under the new baseline (from R0)

| mirror | M2 (old rules) | R0 (new rules) | verdict |
|---|---|---|---|
| random | 49.4% | 49.8% | ✓ in band |
| greedy | 46.1% | 46.2% | unchanged; above the ≤43% flag line — no flag |
| aggro | 44.7% | 46.0% | slightly improved |
| banker | 66.0% | **12.8%** (of the 51% decided) | **flag for designer review** |

No-battle-T1 did not push combat mirrors below the brief's ≤43% review threshold.
But the banker mirror **overshot**: from strong first-player (66%) to strong
second-player (12.8% of decided) — going first now means exposing an attacker into
a fresh 7-card hand, and in trigger-scarce play that first exposure decides the
game. With ante 5 it moderates to 35.4% (all games decided). Not a rules bug — a
strategy-dependent asymmetry the skip-first-draw can't fully flatten; park it for
human playtests (heuristic banker is an extreme caricature of caution).

## R4 — firstTurnDraw experiment (follow-up to R2)

New knob `firstTurnDraw` (default false = canonical skip): turn 1 keeps no Battle
Phase but begins with a normal draw phase. 6 matchups × 10k in `results/R4`:

| mirror (1st-player win of decided) | R0 (skip draw) | R4 (full draw) |
|---|---|---|
| greedy | 46.2% | **54.0%** |
| aggro | 46.0% | **54.0%** |
| random | 49.8% | 49.8% |
| banker | 12.8% | 15.8% (draws 49% → 60%) |

**Verdict: the skip-draw compensation is real and roughly symmetric** — removing it
flips combat mirrors from −4 pts to +4 pts around fair. Neither setting touches the
banker-mirror anomaly (that asymmetry is structural to hyper-cautious play, not the
draw). Keep the canonical skip; if playtests want finer centering, the natural
middle under draw-2 is a **half draw** (first player draws 1 on turn 1) — would need
`firstTurnDraw` to become a count.

## R3 — K+Ace(11) meta check (data only, per brief — no balance action)

Instrumented across all R0 matchups: greedy mirror casts K **5.1×/game**; **29% of
casts burn an Ace as 11**; **88% of casts kill the target outright** via the §6
no-floor rule (avg power destroyed 6.7 — up to and including 10s). Range across
matchups: kills are 63-99% of K casts; Ace-as-11 usage 3-38%. K has effectively
become the game's premier removal spell — J destroys any one monster for one card,
while K+big-fuel does the same for two cards *or* kills mid-size monsters with
small fuel. The designers ratified this "with eyes open"; the data says the eyes
should stay open: if playtests show 10s never feel safe, the lever is the Ace
(fuel value 1 only) rather than the floor.

## Updated designer-decision status

- Decisions **1 (pacing), 4 (deck-out), 5 (Joker/Poly)** from the M2 list: **ratified
  and landed** (draw-2; draw-phase-only ending; Joker reshuffle).
- Decision **2 (mutual-passivity draws)**: unresolved in Constructed (banker mirror
  49% draws is the new face of it) — but **ante solves it for Run mode**, which is
  v1's only mode. Recommend: accept for Constructed-fast-follow review.
- Decision **3 (wall-punish selector)**: ratified `random`.
- Decision **6 (first-player)**: reopened by R2 — banker-style caution now favors
  the second player. Playtest item.
- New: **ante value for Run mode** (recommend 5) and the two provisional edges in
  `RULES-GAPS.md` (Joker-only-deck forced stand; multi-interceptor defender-chooses).
