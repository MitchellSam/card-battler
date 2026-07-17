# Sim report — `results/R1`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| ante5 | aggro vs aggro | 10000 | 42 | 42 | 42 | 44 | 0.00% | 50.4% | 47.2% | 0.0% |
| ante5 | banker vs banker | 10000 | 42 | 42 | 42 | 44 | 0.00% | 49.9% | 35.4% | 0.0% |
| ante5 | banker vs greedy | 10000 | 39 | 36 | 41 | 45 | 0.00% | 8.7% | 48.7% | 0.0% |
| ante5 | greedy vs banker | 10000 | 38 | 36 | 41 | 44 | 0.00% | 91.8% | 48.7% | 0.0% |
| ante5 | greedy vs greedy | 10000 | 38 | 36 | 40 | 44 | 0.00% | 50.7% | 43.3% | 0.0% |
| ante8 | aggro vs aggro | 10000 | 38 | 38 | 39 | 41 | 0.00% | 50.1% | 46.8% | 0.0% |
| ante8 | banker vs banker | 10000 | 38 | 38 | 39 | 41 | 0.00% | 50.1% | 35.6% | 0.0% |
| ante8 | banker vs greedy | 10000 | 36 | 33 | 38 | 41 | 0.00% | 13.2% | 48.5% | 0.0% |
| ante8 | greedy vs banker | 10000 | 36 | 33 | 38 | 41 | 0.00% | 87.5% | 48.1% | 0.0% |
| ante8 | greedy vs greedy | 10000 | 35 | 33 | 37 | 40 | 0.00% | 49.6% | 44.9% | 0.0% |

#### Win-rate matrix — config `ante5` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | banker | greedy |
|---|---|---|---|
| **aggro** | 50.0% | — | — |
| **banker** | — | 50.0% | 8.4% |
| **greedy** | — | 91.6% | 50.0% |

#### Win-rate matrix — config `ante8` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | banker | greedy |
|---|---|---|---|
| **aggro** | 50.0% | — | — |
| **banker** | — | 50.0% | 12.8% |
| **greedy** | — | 87.2% | 50.0% |

## Matchup detail

### aggro vs aggro — config `ante5` (10000 games)

- **Turns:** median 42, p10 42, p90 42, p95 43, max 44
- **Outcomes:** aggro (seat 0) 50.4% · draws 0.0% · stalls 0.00% · first-player wins 47.2% (of decided)
- **Banks:** seat0 mean 18.0, seat1 mean 17.8; winners 32.4 vs losers 3.4
- **Attack vs defense:** 51.9 attacks/game vs 0.0 monster sets/game (face-up summons 28.8); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 41.2/game (+10.18 unusable) → bank 435107, remove 77257, decline 0
- **Jokers:** win rate by jokers cast — 0: 41.5% (65), 1: 46.2% (679), 2+: 50.2% (19256)
- **Spells cast/game:** J-rank 4.84
- **Sac summons/game:** 1-sac 5.17, 2-sac 1.07 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** high card 36%, pair 2%, two pair 1%, three of a kind 1%, straight 0%, flush 0%, full house 3%, four of a kind 9%, straight flush 47%
- **Winning hands:** full house 0%, four of a kind 7%, straight flush 93%

### banker vs banker — config `ante5` (10000 games)

- **Turns:** median 42, p10 42, p90 42, p95 43, max 44
- **Outcomes:** banker (seat 0) 49.9% · draws 0.0% · stalls 0.00% · first-player wins 35.4% (of decided)
- **Banks:** seat0 mean 5.2, seat1 mean 5.2; winners 5.7 vs losers 4.8
- **Attack vs defense:** 1.0 attacks/game vs 25.4 monster sets/game (face-up summons 1.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 1.0/game (+0.00 unusable) → bank 107446, remove 3046, decline 0
- **Jokers:** win rate by jokers cast — 0: 44.6% (65), 1: 36.1% (679), 2+: 50.5% (19256)
- **Sac summons/game:** 1-sac 9.84, 2-sac 3.45 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 97% | 91% | 88% | 82% | 99% | 99% | 98% | 100% | 100% | 100% |
| mean turns until flip | — | — | 2.0 | 4.0 | — | — | — | — | — | — |

- **Showdown hands (all):** high card 54%, pair 31%, two pair 7%, three of a kind 2%, straight 1%, flush 1%, full house 3%, four of a kind 0%, straight flush 0%
- **Winning hands:** high card 21%, pair 48%, two pair 14%, three of a kind 5%, straight 3%, flush 2%, full house 5%, four of a kind 1%, straight flush 0%

### banker vs greedy — config `ante5` (10000 games)

- **Turns:** median 39, p10 36, p90 41, p95 41, max 45
- **Outcomes:** banker (seat 0) 8.7% · draws 0.0% · stalls 0.00% · first-player wins 48.7% (of decided)
- **Banks:** seat0 mean 1.3, seat1 mean 14.9; winners 15.0 vs losers 1.1
- **Attack vs defense:** 39.8 attacks/game vs 14.9 monster sets/game (face-up summons 15.9); attacks into defense 7.2/game
- **Wall punish:** 1.32/game, 1.32 bank cards lost/game
- **Bank triggers:** 16.8/game (+14.13 unusable) → bank 221067, remove 46521, decline 0
- **Jokers:** win rate by jokers cast — 0: 19.3% (161), 1: 30.4% (2068), 2+: 52.6% (17771)
- **Poly:** 1.85/game, bust 9.9%, stand 90.1%, avg stood total 16.4
- **Spells cast/game:** J-rank 2.26, revive 1.88, poly 1.85, K-rank 1.68, negate 0.99
- **K spells (R3):** 1.68/game, Ace-as-11 fuel 34.3% of casts, outright debuff kills 94.8% of casts (avg power destroyed 4.8)
- **Sac summons/game:** 1-sac 9.54, 2-sac 2.49 · milled cards/game 0.54

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 78% | 61% | 58% | 56% | 29% | 29% | 32% | 12% | 7% | 9% |
| mean turns until flip | 1.1 | 1.2 | 1.3 | 1.5 | 2.4 | 3.6 | 4.4 | 3.0 | 2.4 | 2.5 |

- **Showdown hands (all):** high card 48%, pair 3%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 22%, four of a kind 16%, straight flush 4%
- **Winning hands:** high card 2%, pair 4%, two pair 4%, three of a kind 1%, straight 2%, flush 4%, full house 43%, four of a kind 31%, straight flush 8%

### greedy vs banker — config `ante5` (10000 games)

- **Turns:** median 38, p10 36, p90 41, p95 41, max 44
- **Outcomes:** greedy (seat 0) 91.8% · draws 0.0% · stalls 0.00% · first-player wins 48.7% (of decided)
- **Banks:** seat0 mean 15.0, seat1 mean 1.2; winners 15.1 vs losers 1.1
- **Attack vs defense:** 40.1 attacks/game vs 14.8 monster sets/game (face-up summons 16.0); attacks into defense 7.2/game
- **Wall punish:** 1.31/game, 1.31 bank cards lost/game
- **Bank triggers:** 16.9/game (+14.33 unusable) → bank 221969, remove 46691, decline 0
- **Jokers:** win rate by jokers cast — 0: 18.0% (167), 1: 31.1% (2104), 2+: 52.5% (17729)
- **Poly:** 1.83/game, bust 9.9%, stand 90.1%, avg stood total 16.4
- **Spells cast/game:** J-rank 2.27, revive 1.87, poly 1.83, K-rank 1.71, negate 0.98
- **K spells (R3):** 1.71/game, Ace-as-11 fuel 33.8% of casts, outright debuff kills 94.1% of casts (avg power destroyed 4.8)
- **Sac summons/game:** 1-sac 9.51, 2-sac 2.50 · milled cards/game 0.54

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 78% | 61% | 57% | 56% | 29% | 29% | 32% | 11% | 6% | 8% |
| mean turns until flip | 1.1 | 1.2 | 1.3 | 1.5 | 2.4 | 3.6 | 4.4 | 3.6 | 2.6 | 2.4 |

- **Showdown hands (all):** high card 48%, pair 3%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 22%, four of a kind 16%, straight flush 4%
- **Winning hands:** high card 2%, pair 4%, two pair 4%, three of a kind 1%, straight 2%, flush 4%, full house 43%, four of a kind 32%, straight flush 7%

### greedy vs greedy — config `ante5` (10000 games)

- **Turns:** median 38, p10 36, p90 40, p95 41, max 44
- **Outcomes:** greedy (seat 0) 50.7% · draws 0.0% · stalls 0.00% · first-player wins 43.3% (of decided)
- **Banks:** seat0 mean 8.4, seat1 mean 8.5; winners 12.8 vs losers 4.1
- **Attack vs defense:** 26.7 attacks/game vs 15.6 monster sets/game (face-up summons 16.9); attacks into defense 6.9/game
- **Wall punish:** 0.80/game, 0.80 bank cards lost/game
- **Bank triggers:** 15.4/game (+3.20 unusable) → bank 215809, remove 38368, decline 0
- **Jokers:** win rate by jokers cast — 0: 43.8% (160), 1: 42.6% (1954), 2+: 50.9% (17886)
- **Poly:** 2.14/game, bust 10.4%, stand 89.6%, avg stood total 16.6
- **Spells cast/game:** K-rank 4.68, J-rank 4.16, revive 3.95, poly 2.30, negate 1.97, snipe 1.42
- **K spells (R3):** 4.68/game, Ace-as-11 fuel 31.9% of casts, outright debuff kills 88.3% of casts (avg power destroyed 6.7)
- **Sac summons/game:** 1-sac 10.74, 2-sac 1.65 · milled cards/game 0.86

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 70% | 60% | 56% | 55% | 36% | 38% | 32% | 18% | 1% | 1% |
| mean turns until flip | 1.2 | 1.3 | 1.4 | 1.5 | 1.7 | 1.7 | 1.6 | 1.6 | 2.5 | 2.3 |

- **Showdown hands (all):** high card 29%, pair 8%, two pair 6%, three of a kind 3%, straight 3%, flush 4%, full house 27%, four of a kind 18%, straight flush 2%
- **Winning hands:** high card 1%, pair 1%, two pair 4%, three of a kind 1%, straight 3%, flush 5%, full house 45%, four of a kind 34%, straight flush 5%

### aggro vs aggro — config `ante8` (10000 games)

- **Turns:** median 38, p10 38, p90 39, p95 39, max 41
- **Outcomes:** aggro (seat 0) 50.1% · draws 0.0% · stalls 0.00% · first-player wins 46.8% (of decided)
- **Banks:** seat0 mean 18.9, seat1 mean 18.8; winners 33.1 vs losers 4.6
- **Attack vs defense:** 46.0 attacks/game vs 0.0 monster sets/game (face-up summons 26.4); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 39.3/game (+6.22 unusable) → bank 465311, remove 88186, decline 0
- **Jokers:** win rate by jokers cast — 0: 47.0% (115), 1: 48.6% (1482), 2+: 50.1% (18403)
- **Spells cast/game:** J-rank 4.43
- **Sac summons/game:** 1-sac 4.72, 2-sac 0.95 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** high card 32%, pair 3%, two pair 1%, three of a kind 1%, straight 0%, flush 1%, full house 5%, four of a kind 9%, straight flush 48%
- **Winning hands:** full house 0%, four of a kind 6%, straight flush 94%

### banker vs banker — config `ante8` (10000 games)

- **Turns:** median 38, p10 38, p90 39, p95 39, max 41
- **Outcomes:** banker (seat 0) 50.1% · draws 0.0% · stalls 0.00% · first-player wins 35.6% (of decided)
- **Banks:** seat0 mean 7.9, seat1 mean 8.0; winners 8.4 vs losers 7.5
- **Attack vs defense:** 1.1 attacks/game vs 24.7 monster sets/game (face-up summons 1.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 1.1/game (+0.00 unusable) → bank 164860, remove 5865, decline 0
- **Jokers:** win rate by jokers cast — 0: 42.6% (115), 1: 43.3% (1482), 2+: 50.6% (18403)
- **Sac summons/game:** 1-sac 9.23, 2-sac 3.43 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 97% | 91% | 88% | 82% | 99% | 99% | 98% | 100% | 100% | 100% |
| mean turns until flip | — | 2.0 | 2.0 | 3.0 | — | 6.0 | — | — | — | — |

- **Showdown hands (all):** high card 21%, pair 28%, two pair 26%, three of a kind 3%, straight 7%, flush 7%, full house 7%, four of a kind 1%, straight flush 0%
- **Winning hands:** high card 2%, pair 19%, two pair 32%, three of a kind 6%, straight 12%, flush 13%, full house 15%, four of a kind 2%, straight flush 1%

### banker vs greedy — config `ante8` (10000 games)

- **Turns:** median 36, p10 33, p90 38, p95 38, max 41
- **Outcomes:** banker (seat 0) 13.2% · draws 0.0% · stalls 0.00% · first-player wins 48.5% (of decided)
- **Banks:** seat0 mean 2.7, seat1 mean 16.9; winners 16.9 vs losers 2.6
- **Attack vs defense:** 34.4 attacks/game vs 14.0 monster sets/game (face-up summons 14.8); attacks into defense 6.4/game
- **Wall punish:** 1.17/game, 1.17 bank cards lost/game
- **Bank triggers:** 17.1/game (+9.35 unusable) → bank 269217, remove 61715, decline 0
- **Jokers:** win rate by jokers cast — 0: 25.4% (181), 1: 31.1% (2132), 2+: 52.5% (17687)
- **Poly:** 1.70/game, bust 10.3%, stand 89.7%, avg stood total 16.4
- **Spells cast/game:** J-rank 2.11, revive 1.77, poly 1.70, K-rank 1.60, negate 0.93
- **K spells (R3):** 1.60/game, Ace-as-11 fuel 34.2% of casts, outright debuff kills 94.3% of casts (avg power destroyed 5.0)
- **Sac summons/game:** 1-sac 8.87, 2-sac 2.34 · milled cards/game 0.50

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 78% | 60% | 57% | 55% | 31% | 31% | 34% | 12% | 8% | 10% |
| mean turns until flip | 1.2 | 1.2 | 1.3 | 1.6 | 2.5 | 3.5 | 4.3 | 3.3 | 2.4 | 2.4 |

- **Showdown hands (all):** high card 40%, pair 4%, two pair 5%, three of a kind 1%, straight 2%, flush 4%, full house 20%, four of a kind 17%, straight flush 7%
- **Winning hands:** high card 0%, pair 2%, two pair 3%, three of a kind 1%, straight 3%, flush 5%, full house 38%, four of a kind 35%, straight flush 14%

### greedy vs banker — config `ante8` (10000 games)

- **Turns:** median 36, p10 33, p90 38, p95 38, max 41
- **Outcomes:** greedy (seat 0) 87.5% · draws 0.0% · stalls 0.00% · first-player wins 48.1% (of decided)
- **Banks:** seat0 mean 16.9, seat1 mean 2.6; winners 17.0 vs losers 2.6
- **Attack vs defense:** 34.6 attacks/game vs 14.0 monster sets/game (face-up summons 14.9); attacks into defense 6.4/game
- **Wall punish:** 1.15/game, 1.15 bank cards lost/game
- **Bank triggers:** 17.2/game (+9.49 unusable) → bank 269513, remove 62202, decline 0
- **Jokers:** win rate by jokers cast — 0: 21.3% (174), 1: 33.3% (2208), 2+: 52.4% (17618)
- **Poly:** 1.69/game, bust 10.1%, stand 89.9%, avg stood total 16.4
- **Spells cast/game:** J-rank 2.12, revive 1.76, poly 1.69, K-rank 1.60, negate 0.92
- **K spells (R3):** 1.60/game, Ace-as-11 fuel 34.1% of casts, outright debuff kills 94.2% of casts (avg power destroyed 4.9)
- **Sac summons/game:** 1-sac 8.90, 2-sac 2.34 · milled cards/game 0.53

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 78% | 60% | 57% | 55% | 31% | 31% | 33% | 10% | 8% | 10% |
| mean turns until flip | 1.1 | 1.2 | 1.3 | 1.6 | 2.4 | 3.5 | 4.3 | 2.9 | 2.6 | 2.3 |

- **Showdown hands (all):** high card 40%, pair 4%, two pair 5%, three of a kind 1%, straight 2%, flush 4%, full house 20%, four of a kind 17%, straight flush 7%
- **Winning hands:** high card 0%, pair 1%, two pair 4%, three of a kind 1%, straight 3%, flush 5%, full house 37%, four of a kind 34%, straight flush 14%

### greedy vs greedy — config `ante8` (10000 games)

- **Turns:** median 35, p10 33, p90 37, p95 38, max 40
- **Outcomes:** greedy (seat 0) 49.6% · draws 0.0% · stalls 0.00% · first-player wins 44.9% (of decided)
- **Banks:** seat0 mean 11.3, seat1 mean 11.4; winners 15.7 vs losers 7.0
- **Attack vs defense:** 24.2 attacks/game vs 14.4 monster sets/game (face-up summons 15.8); attacks into defense 6.2/game
- **Wall punish:** 0.69/game, 0.69 bank cards lost/game
- **Bank triggers:** 15.2/game (+1.75 unusable) → bank 273216, remove 38570, decline 0
- **Jokers:** win rate by jokers cast — 0: 34.5% (171), 1: 45.2% (2118), 2+: 50.7% (17711)
- **Poly:** 2.00/game, bust 10.4%, stand 89.6%, avg stood total 16.6
- **Spells cast/game:** K-rank 4.35, J-rank 3.89, revive 3.67, poly 2.16, negate 1.85, snipe 1.34
- **K spells (R3):** 4.35/game, Ace-as-11 fuel 32.3% of casts, outright debuff kills 87.8% of casts (avg power destroyed 6.7)
- **Sac summons/game:** 1-sac 9.90, 2-sac 1.50 · milled cards/game 0.79

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 69% | 59% | 55% | 54% | 36% | 38% | 32% | 15% | 1% | 1% |
| mean turns until flip | 1.2 | 1.3 | 1.4 | 1.5 | 1.7 | 1.7 | 1.6 | 1.5 | 2.7 | 2.0 |

- **Showdown hands (all):** high card 20%, pair 4%, two pair 4%, three of a kind 1%, straight 4%, flush 7%, full house 30%, four of a kind 23%, straight flush 7%
- **Winning hands:** pair 0%, two pair 0%, three of a kind 0%, straight 1%, flush 4%, full house 39%, four of a kind 42%, straight flush 14%
