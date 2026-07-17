# Sim report — `results/R4`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| firstTurnDraw | aggro vs aggro | 10000 | 45 | 45 | 46 | 47 | 0.00% | 49.8% | 54.0% | 0.0% |
| firstTurnDraw | banker vs banker | 10000 | 45 | 45 | 46 | 47 | 0.00% | 20.3% | 15.8% | 59.9% |
| firstTurnDraw | banker vs greedy | 10000 | 42 | 39 | 44 | 47 | 0.00% | 2.5% | 50.4% | 0.0% |
| firstTurnDraw | greedy vs banker | 10000 | 42 | 39 | 44 | 48 | 0.00% | 97.1% | 49.8% | 0.0% |
| firstTurnDraw | greedy vs greedy | 10000 | 41 | 39 | 43 | 47 | 0.00% | 49.5% | 54.0% | 0.0% |
| firstTurnDraw | random vs random | 10000 | 43 | 41 | 45 | 48 | 0.00% | 45.9% | 49.8% | 7.0% |

#### Win-rate matrix — config `firstTurnDraw` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | banker | greedy | random |
|---|---|---|---|---|
| **aggro** | 50.0% | — | — | — |
| **banker** | — | 20.1% | 2.7% | — |
| **greedy** | — | 97.3% | 50.0% | — |
| **random** | — | — | — | 46.5% |

## Matchup detail

### aggro vs aggro — config `firstTurnDraw` (10000 games)

- **Turns:** median 45, p10 45, p90 46, p95 46, max 47
- **Outcomes:** aggro (seat 0) 49.8% · draws 0.0% · stalls 0.00% · first-player wins 54.0% (of decided)
- **Banks:** seat0 mean 16.0, seat1 mean 16.2; winners 30.0 vs losers 2.2
- **Attack vs defense:** 57.3 attacks/game vs 0.0 monster sets/game (face-up summons 31.0); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 40.1/game (+16.72 unusable) → bank 361293, remove 39479, decline 0
- **Jokers:** win rate by jokers cast — 0: 50.5% (95), 1: 46.4% (1288), 2+: 50.2% (18617)
- **Spells cast/game:** J-rank 5.22
- **Sac summons/game:** 1-sac 5.64, 2-sac 1.15 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** high card 40%, pair 2%, two pair 1%, three of a kind 1%, straight 0%, flush 0%, full house 3%, four of a kind 9%, straight flush 44%
- **Winning hands:** full house 0%, four of a kind 11%, straight flush 89%

### banker vs banker — config `firstTurnDraw` (10000 games)

- **Turns:** median 45, p10 45, p90 46, p95 46, max 47
- **Outcomes:** banker (seat 0) 20.3% · draws 59.9% · stalls 0.00% · first-player wins 15.8% (of decided)
- **Banks:** seat0 mean 0.4, seat1 mean 0.4; winners 1.7 vs losers 0.0
- **Attack vs defense:** 0.7 attacks/game vs 26.0 monster sets/game (face-up summons 1.5); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 0.7/game (+0.01 unusable) → bank 7301, remove 11, decline 0
- **Jokers:** win rate by jokers cast — 0: 30.5% (95), 1: 28.0% (1288), 2+: 19.5% (18617)
- **Sac summons/game:** 1-sac 10.18, 2-sac 3.50 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 98% | 92% | 89% | 82% | 100% | 99% | 99% | 100% | 100% | 100% |
| mean turns until flip | 2.0 | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** high card 97%, pair 2%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%, straight flush 0%
- **Winning hands:** high card 85%, pair 10%, two pair 2%, three of a kind 1%, straight 1%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%

### banker vs greedy — config `firstTurnDraw` (10000 games)

- **Turns:** median 42, p10 39, p90 44, p95 45, max 47
- **Outcomes:** banker (seat 0) 2.5% · draws 0.0% · stalls 0.00% · first-player wins 50.4% (of decided)
- **Banks:** seat0 mean 0.1, seat1 mean 13.1; winners 13.2 vs losers 0.1
- **Attack vs defense:** 51.1 attacks/game vs 15.5 monster sets/game (face-up summons 17.2); attacks into defense 8.6/game
- **Wall punish:** 1.70/game, 1.60 bank cards lost/game
- **Bank triggers:** 16.2/game (+24.30 unusable) → bank 155184, remove 6493, decline 0
- **Jokers:** win rate by jokers cast — 0: 12.8% (149), 1: 27.3% (1900), 2+: 52.7% (17951)
- **Poly:** 2.11/game, bust 9.9%, stand 90.1%, avg stood total 16.4
- **Spells cast/game:** J-rank 2.45, poly 2.11, revive 2.04, K-rank 1.79, negate 1.10
- **K spells (R3):** 1.79/game, Ace-as-11 fuel 31.4% of casts, outright debuff kills 94.4% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 10.01, 2-sac 2.45 · milled cards/game 0.52

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 81% | 61% | 58% | 57% | 23% | 25% | 27% | 8% | 3% | 5% |
| mean turns until flip | 1.1 | 1.2 | 1.2 | 1.4 | 2.2 | 2.8 | 3.2 | 3.9 | 2.1 | 2.3 |

- **Showdown hands (all):** high card 51%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 24%, four of a kind 14%, straight flush 2%
- **Winning hands:** high card 3%, pair 4%, two pair 6%, three of a kind 2%, straight 2%, flush 4%, full house 48%, four of a kind 29%, straight flush 3%

### greedy vs banker — config `firstTurnDraw` (10000 games)

- **Turns:** median 42, p10 39, p90 44, p95 45, max 48
- **Outcomes:** greedy (seat 0) 97.1% · draws 0.0% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 13.2, seat1 mean 0.2; winners 13.2 vs losers 0.1
- **Attack vs defense:** 51.3 attacks/game vs 15.5 monster sets/game (face-up summons 17.1); attacks into defense 8.6/game
- **Wall punish:** 1.71/game, 1.61 bank cards lost/game
- **Bank triggers:** 16.2/game (+24.39 unusable) → bank 155872, remove 6434, decline 0
- **Jokers:** win rate by jokers cast — 0: 14.1% (149), 1: 27.3% (1982), 2+: 52.8% (17869)
- **Poly:** 2.11/game, bust 10.1%, stand 89.9%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.46, poly 2.11, revive 2.05, K-rank 1.80, negate 1.09
- **K spells (R3):** 1.80/game, Ace-as-11 fuel 31.2% of casts, outright debuff kills 94.4% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 9.96, 2-sac 2.44 · milled cards/game 0.51

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 81% | 61% | 58% | 57% | 23% | 25% | 27% | 8% | 3% | 5% |
| mean turns until flip | 1.1 | 1.2 | 1.2 | 1.4 | 2.2 | 2.8 | 3.3 | 3.7 | 2.4 | 2.5 |

- **Showdown hands (all):** high card 51%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 24%, four of a kind 14%, straight flush 2%
- **Winning hands:** high card 3%, pair 4%, two pair 6%, three of a kind 1%, straight 2%, flush 3%, full house 49%, four of a kind 29%, straight flush 3%

### greedy vs greedy — config `firstTurnDraw` (10000 games)

- **Turns:** median 41, p10 39, p90 43, p95 44, max 47
- **Outcomes:** greedy (seat 0) 49.5% · draws 0.0% · stalls 0.00% · first-player wins 54.0% (of decided)
- **Banks:** seat0 mean 5.4, seat1 mean 5.5; winners 9.4 vs losers 1.5
- **Attack vs defense:** 32.1 attacks/game vs 16.9 monster sets/game (face-up summons 18.6); attacks into defense 8.3/game
- **Wall punish:** 1.05/game, 1.00 bank cards lost/game
- **Bank triggers:** 15.3/game (+6.93 unusable) → bank 136332, remove 17161, decline 0
- **Jokers:** win rate by jokers cast — 0: 38.4% (151), 1: 46.3% (1900), 2+: 50.5% (17949)
- **Poly:** 2.45/game, bust 10.9%, stand 89.1%, avg stood total 16.7
- **Spells cast/game:** K-rank 5.04, J-rank 4.59, revive 4.40, poly 2.61, negate 2.19, snipe 1.60
- **K spells (R3):** 5.04/game, Ace-as-11 fuel 30.7% of casts, outright debuff kills 87.3% of casts (avg power destroyed 6.8)
- **Sac summons/game:** 1-sac 11.61, 2-sac 1.76 · milled cards/game 0.90

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 72% | 59% | 55% | 54% | 34% | 36% | 31% | 17% | 1% | 2% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.4 | 1.7 | 1.6 | 1.6 | 1.5 | 2.6 | 2.2 |

- **Showdown hands (all):** high card 44%, pair 8%, two pair 7%, three of a kind 3%, straight 1%, flush 1%, full house 23%, four of a kind 11%, straight flush 1%
- **Winning hands:** high card 5%, pair 7%, two pair 11%, three of a kind 4%, straight 3%, flush 3%, full house 44%, four of a kind 23%, straight flush 1%

### random vs random — config `firstTurnDraw` (10000 games)

- **Turns:** median 43, p10 41, p90 45, p95 45, max 48
- **Outcomes:** random (seat 0) 45.9% · draws 7.0% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 1.6, seat1 mean 1.6; winners 2.8 vs losers 0.5
- **Attack vs defense:** 13.6 attacks/game vs 20.1 monster sets/game (face-up summons 20.0); attacks into defense 5.5/game
- **Wall punish:** 3.10/game, 1.37 bank cards lost/game
- **Bank triggers:** 6.9/game (+0.06 unusable) → bank 51212, remove 5920, decline 12023
- **Jokers:** win rate by jokers cast — 0: 42.7% (241), 1: 43.3% (2989), 2+: 47.1% (16770)
- **Poly:** 1.12/game, bust 14.9%, stand 85.1%, avg stood total 8.7
- **Spells cast/game:** J-rank 4.92, revive 4.85, Q-rank 4.25, K-rank 4.14, snipe 1.21, poly 1.20, negate 0.93
- **K spells (R3):** 4.14/game, Ace-as-11 fuel 4.6% of casts, outright debuff kills 72.7% of casts (avg power destroyed 4.2)
- **Sac summons/game:** 1-sac 13.85, 2-sac 4.64 · milled cards/game 2.15

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% |
| mean turns until flip | 1.6 | 1.6 | 1.6 | 1.6 | 1.7 | 1.6 | 1.6 | 1.7 | 1.7 | 1.7 |

- **Showdown hands (all):** high card 87%, pair 10%, two pair 1%, three of a kind 1%, straight 0%, flush 0%, full house 0%, four of a kind 0%, straight flush 0%
- **Winning hands:** high card 73%, pair 21%, two pair 3%, three of a kind 1%, straight 1%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%
