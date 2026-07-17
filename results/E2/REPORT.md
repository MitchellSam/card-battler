# Sim report — `results/E2`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| drawPerTurn2 | aggro vs aggro | 10000 | 46 | 46 | 46 | 48 | 0.00% | 49.4% | 43.6% | 0.0% |
| drawPerTurn2 | aggro vs greedy | 10000 | 40 | 38 | 43 | 47 | 0.00% | 0.2% | 50.1% | 0.0% |
| drawPerTurn2 | banker vs banker | 10000 | 46 | 46 | 46 | 48 | 0.00% | 49.5% | 65.6% | 1.4% |
| drawPerTurn2 | banker vs greedy | 10000 | 41 | 38 | 43 | 47 | 0.00% | 4.0% | 49.9% | 0.0% |
| drawPerTurn2 | greedy vs aggro | 10000 | 40 | 38 | 43 | 47 | 0.00% | 99.7% | 49.6% | 0.0% |
| drawPerTurn2 | greedy vs banker | 10000 | 41 | 38 | 43 | 46 | 0.00% | 95.9% | 49.4% | 0.0% |
| drawPerTurn2 | greedy vs greedy | 10000 | 40 | 38 | 43 | 46 | 0.00% | 50.5% | 44.9% | 0.0% |
| drawPerTurn2 | greedy vs turtle | 10000 | 41 | 38 | 43 | 47 | 0.00% | 99.4% | 49.8% | 0.6% |
| drawPerTurn2 | random vs random | 10000 | 42 | 39 | 44 | 48 | 0.00% | 47.2% | 50.7% | 7.8% |
| drawPerTurn2 | turtle vs greedy | 10000 | 41 | 38 | 43 | 47 | 0.00% | 0.0% | 50.2% | 0.7% |
| drawPerTurn2 | turtle vs turtle | 10000 | 50 | 50 | 50 | 50 | 0.00% | 0.0% | 0.0% | 100.0% |

#### Win-rate matrix — config `drawPerTurn2` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | banker | greedy | random | turtle |
|---|---|---|---|---|---|
| **aggro** | 50.0% | — | 0.3% | — | — |
| **banker** | — | 49.3% | 4.0% | — | — |
| **greedy** | 99.7% | 96.0% | 50.0% | — | 99.3% |
| **random** | — | — | — | 46.1% | — |
| **turtle** | — | — | 0.0% | — | 0.0% |

## Matchup detail

### aggro vs aggro — config `drawPerTurn2` (10000 games)

- **Turns:** median 46, p10 46, p90 46, p95 46, max 48
- **Outcomes:** aggro (seat 0) 49.4% · draws 0.0% · stalls 0.00% · first-player wins 43.6% (of decided)
- **Banks:** seat0 mean 16.0, seat1 mean 16.4; winners 30.2 vs losers 2.1
- **Attack vs defense:** 59.2 attacks/game vs 0.0 monster sets/game (face-up summons 31.1); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 41.3/game (+17.43 unusable) → bank 368201, remove 44630, decline 0
- **Jokers:** win rate by jokers cast — 0: 39.3% (89), 1: 46.9% (1324), 2+: 50.3% (18587)
- **Spells cast/game:** J-rank 5.07
- **Sac summons/game:** 1-sac 5.70, 2-sac 1.19 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** partial hand 42%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 3%, four of a kind 8%, straight flush 45%
- **Winning hands:** full house 0%, four of a kind 10%, straight flush 89%

### aggro vs greedy — config `drawPerTurn2` (10000 games)

- **Turns:** median 40, p10 38, p90 43, p95 44, max 47
- **Outcomes:** aggro (seat 0) 0.2% · draws 0.0% · stalls 0.00% · first-player wins 50.1% (of decided)
- **Banks:** seat0 mean 0.1, seat1 mean 17.5; winners 17.6 vs losers 0.1
- **Attack vs defense:** 69.5 attacks/game vs 1.8 monster sets/game (face-up summons 27.5); attacks into defense 1.6/game
- **Wall punish:** 0.79/game, 0.65 bank cards lost/game
- **Bank triggers:** 22.9/game (+44.23 unusable) → bank 206340, remove 22979, decline 0
- **Jokers:** win rate by jokers cast — 0: 36.3% (557), 1: 46.1% (4784), 2+: 51.8% (14659)
- **Poly:** 2.27/game, bust 7.6%, stand 92.4%, avg stood total 17.0
- **Spells cast/game:** J-rank 4.66, poly 2.27, revive 2.23, negate 1.42, K-rank 0.92
- **Sac summons/game:** 1-sac 6.76, 2-sac 1.85 · milled cards/game 0.04

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 8% | 10% | 8% | 7% | 1% | 2% | 2% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.1 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |

- **Showdown hands (all):** partial hand 50%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 19%, four of a kind 24%, straight flush 6%
- **Winning hands:** pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 1%, full house 39%, four of a kind 49%, straight flush 11%

### banker vs banker — config `drawPerTurn2` (10000 games)

- **Turns:** median 46, p10 46, p90 46, p95 46, max 48
- **Outcomes:** banker (seat 0) 49.5% · draws 1.4% · stalls 0.00% · first-player wins 65.6% (of decided)
- **Banks:** seat0 mean 1.0, seat1 mean 1.0; winners 1.6 vs losers 0.4
- **Attack vs defense:** 2.0 attacks/game vs 25.8 monster sets/game (face-up summons 1.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 2.0/game (+0.01 unusable) → bank 20224, remove 46, decline 0
- **Jokers:** win rate by jokers cast — 0: 62.2% (90), 1: 56.8% (1324), 2+: 48.7% (18586)
- **Sac summons/game:** 1-sac 10.43, 2-sac 3.38 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 96% | 91% | 88% | 82% | 99% | 98% | 98% | 100% | 100% | 100% |
| mean turns until flip | 2.0 | 2.0 | 2.0 | 3.0 | 6.0 | — | — | — | — | — |

- **Showdown hands (all):** partial hand 97%, high card 0%, pair 1%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%, straight flush 0%
- **Winning hands:** partial hand 94%, high card 0%, pair 1%, two pair 2%, three of a kind 0%, straight 1%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%

### banker vs greedy — config `drawPerTurn2` (10000 games)

- **Turns:** median 41, p10 38, p90 43, p95 44, max 47
- **Outcomes:** banker (seat 0) 4.0% · draws 0.0% · stalls 0.00% · first-player wins 49.9% (of decided)
- **Banks:** seat0 mean 0.3, seat1 mean 12.7; winners 12.7 vs losers 0.2
- **Attack vs defense:** 49.1 attacks/game vs 15.6 monster sets/game (face-up summons 16.3); attacks into defense 9.5/game
- **Wall punish:** 1.68/game, 1.61 bank cards lost/game
- **Bank triggers:** 16.5/game (+21.85 unusable) → bank 155416, remove 10042, decline 0
- **Jokers:** win rate by jokers cast — 0: 46.3% (423), 1: 51.5% (4169), 2+: 49.7% (15408)
- **Poly:** 1.98/game, bust 7.5%, stand 92.5%, avg stood total 17.1
- **Spells cast/game:** J-rank 2.36, revive 1.99, poly 1.98, negate 1.36, K-rank 1.33
- **Sac summons/game:** 1-sac 9.88, 2-sac 2.39 · milled cards/game 0.64

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 80% | 63% | 60% | 58% | 26% | 29% | 30% | 7% | 5% | 9% |
| mean turns until flip | 1.1 | 1.2 | 1.2 | 1.4 | 2.1 | 2.8 | 3.0 | 3.1 | 2.2 | 2.5 |

- **Showdown hands (all):** partial hand 52%, high card 0%, pair 1%, two pair 4%, three of a kind 1%, straight 1%, flush 2%, full house 25%, four of a kind 12%, straight flush 1%
- **Winning hands:** partial hand 5%, high card 0%, pair 2%, two pair 7%, three of a kind 1%, straight 2%, flush 4%, full house 51%, four of a kind 24%, straight flush 3%

### greedy vs aggro — config `drawPerTurn2` (10000 games)

- **Turns:** median 40, p10 38, p90 43, p95 44, max 47
- **Outcomes:** greedy (seat 0) 99.7% · draws 0.0% · stalls 0.00% · first-player wins 49.6% (of decided)
- **Banks:** seat0 mean 17.5, seat1 mean 0.1; winners 17.6 vs losers 0.1
- **Attack vs defense:** 69.7 attacks/game vs 1.8 monster sets/game (face-up summons 27.6); attacks into defense 1.6/game
- **Wall punish:** 0.78/game, 0.64 bank cards lost/game
- **Bank triggers:** 22.9/game (+44.52 unusable) → bank 206023, remove 22795, decline 0
- **Jokers:** win rate by jokers cast — 0: 36.0% (522), 1: 46.1% (4846), 2+: 51.8% (14632)
- **Poly:** 2.29/game, bust 7.6%, stand 92.4%, avg stood total 17.0
- **Spells cast/game:** J-rank 4.65, poly 2.29, revive 2.24, negate 1.45, K-rank 0.90
- **Sac summons/game:** 1-sac 6.74, 2-sac 1.86 · milled cards/game 0.03

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 8% | 10% | 8% | 6% | 1% | 2% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.1 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | 1.0 | — |

- **Showdown hands (all):** partial hand 50%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 20%, four of a kind 24%, straight flush 6%
- **Winning hands:** two pair 0%, three of a kind 0%, straight 0%, flush 1%, full house 39%, four of a kind 48%, straight flush 12%

### greedy vs banker — config `drawPerTurn2` (10000 games)

- **Turns:** median 41, p10 38, p90 43, p95 44, max 46
- **Outcomes:** greedy (seat 0) 95.9% · draws 0.0% · stalls 0.00% · first-player wins 49.4% (of decided)
- **Banks:** seat0 mean 12.7, seat1 mean 0.3; winners 12.8 vs losers 0.2
- **Attack vs defense:** 49.2 attacks/game vs 15.6 monster sets/game (face-up summons 16.2); attacks into defense 9.4/game
- **Wall punish:** 1.67/game, 1.60 bank cards lost/game
- **Bank triggers:** 16.6/game (+21.87 unusable) → bank 155592, remove 9969, decline 0
- **Jokers:** win rate by jokers cast — 0: 46.7% (435), 1: 52.3% (4288), 2+: 49.5% (15277)
- **Poly:** 1.98/game, bust 7.4%, stand 92.6%, avg stood total 17.1
- **Spells cast/game:** J-rank 2.39, revive 1.99, poly 1.98, negate 1.36, K-rank 1.31
- **Sac summons/game:** 1-sac 9.90, 2-sac 2.38 · milled cards/game 0.64

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 80% | 63% | 60% | 58% | 26% | 28% | 31% | 8% | 5% | 9% |
| mean turns until flip | 1.1 | 1.2 | 1.2 | 1.4 | 2.0 | 2.6 | 3.0 | 3.0 | 2.8 | 2.6 |

- **Showdown hands (all):** partial hand 52%, high card 0%, pair 1%, two pair 4%, three of a kind 1%, straight 1%, flush 2%, full house 24%, four of a kind 13%, straight flush 1%
- **Winning hands:** partial hand 5%, high card 0%, pair 2%, two pair 8%, three of a kind 1%, straight 2%, flush 4%, full house 48%, four of a kind 26%, straight flush 3%

### greedy vs greedy — config `drawPerTurn2` (10000 games)

- **Turns:** median 40, p10 38, p90 43, p95 43, max 46
- **Outcomes:** greedy (seat 0) 50.5% · draws 0.0% · stalls 0.00% · first-player wins 44.9% (of decided)
- **Banks:** seat0 mean 5.5, seat1 mean 5.4; winners 9.3 vs losers 1.6
- **Attack vs defense:** 35.4 attacks/game vs 18.5 monster sets/game (face-up summons 16.8); attacks into defense 10.7/game
- **Wall punish:** 1.47/game, 1.45 bank cards lost/game
- **Bank triggers:** 15.3/game (+7.88 unusable) → bank 138122, remove 14968, decline 0
- **Jokers:** win rate by jokers cast — 0: 48.8% (453), 1: 49.3% (4216), 2+: 50.2% (15331)
- **Poly:** 2.37/game, bust 7.7%, stand 92.3%, avg stood total 17.2
- **Spells cast/game:** revive 4.81, J-rank 4.58, K-rank 3.85, poly 2.51, negate 2.30, snipe 1.52
- **Sac summons/game:** 1-sac 11.72, 2-sac 2.27 · milled cards/game 1.15

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 66% | 62% | 60% | 37% | 39% | 37% | 23% | 2% | 2% |
| mean turns until flip | 1.2 | 1.2 | 1.3 | 1.4 | 1.6 | 1.6 | 1.5 | 1.5 | 2.5 | 2.6 |

- **Showdown hands (all):** partial hand 51%, high card 0%, pair 3%, two pair 9%, three of a kind 2%, straight 1%, flush 2%, full house 23%, four of a kind 8%, straight flush 0%
- **Winning hands:** partial hand 9%, high card 1%, pair 4%, two pair 15%, three of a kind 4%, straight 3%, flush 4%, full house 45%, four of a kind 16%, straight flush 1%

### greedy vs turtle — config `drawPerTurn2` (10000 games)

- **Turns:** median 41, p10 38, p90 43, p95 44, max 47
- **Outcomes:** greedy (seat 0) 99.4% · draws 0.6% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 12.8, seat1 mean 0.0; winners 12.9 vs losers 0.0
- **Attack vs defense:** 50.1 attacks/game vs 15.3 monster sets/game (face-up summons 16.3); attacks into defense 10.9/game
- **Wall punish:** 1.87/game, 1.59 bank cards lost/game
- **Bank triggers:** 14.4/game (+23.31 unusable) → bank 143614, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 2.0% (10203), 1: 99.3% (2224), 2+: 99.4% (7573)
- **Poly:** 2.16/game, bust 7.4%, stand 92.5%, avg stood total 17.0
- **Spells cast/game:** J-rank 2.36, poly 2.16, revive 1.94, snipe 1.86, negate 1.41, K-rank 0.32
- **Sac summons/game:** 1-sac 9.38, 2-sac 2.43 · milled cards/game 0.34

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 65% | 61% | 59% | 15% | 19% | 28% | 1% | 2% | 17% |
| mean turns until flip | 1.4 | 1.7 | 1.9 | 2.1 | 2.5 | 3.3 | 3.7 | 1.8 | 4.3 | 4.0 |

- **Showdown hands (all):** partial hand 52%, high card 0%, pair 1%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 24%, four of a kind 15%, straight flush 2%
- **Winning hands:** partial hand 4%, high card 0%, pair 2%, two pair 7%, three of a kind 1%, straight 2%, flush 3%, full house 48%, four of a kind 29%, straight flush 3%

### random vs random — config `drawPerTurn2` (10000 games)

- **Turns:** median 42, p10 39, p90 44, p95 45, max 48
- **Outcomes:** random (seat 0) 47.2% · draws 7.8% · stalls 0.00% · first-player wins 50.7% (of decided)
- **Banks:** seat0 mean 1.6, seat1 mean 1.5; winners 2.9 vs losers 0.5
- **Attack vs defense:** 14.5 attacks/game vs 19.5 monster sets/game (face-up summons 19.4); attacks into defense 5.9/game
- **Wall punish:** 3.37/game, 1.54 bank cards lost/game
- **Bank triggers:** 7.4/game (+0.11 unusable) → bank 53714, remove 6612, decline 13897
- **Jokers:** win rate by jokers cast — 0: 41.9% (492), 1: 45.1% (4515), 2+: 46.6% (14993)
- **Poly:** 1.17/game, bust 30.5%, stand 69.5%, avg stood total 14.1
- **Spells cast/game:** J-rank 4.73, revive 4.61, Q-rank 4.05, K-rank 3.97, poly 1.22, snipe 1.09, negate 0.84
- **Sac summons/game:** 1-sac 13.51, 2-sac 5.02 · milled cards/game 2.26

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 51% |
| mean turns until flip | 1.6 | 1.6 | 1.6 | 1.6 | 1.6 | 1.6 | 1.6 | 1.7 | 1.6 | 1.7 |

- **Showdown hands (all):** partial hand 92%, high card 2%, pair 3%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%, straight flush 0%
- **Winning hands:** partial hand 83%, high card 4%, pair 7%, two pair 3%, three of a kind 1%, straight 0%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%

### turtle vs greedy — config `drawPerTurn2` (10000 games)

- **Turns:** median 41, p10 38, p90 43, p95 44, max 47
- **Outcomes:** turtle (seat 0) 0.0% · draws 0.7% · stalls 0.00% · first-player wins 50.2% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 12.9; winners 13.0 vs losers 0.0
- **Attack vs defense:** 50.6 attacks/game vs 15.2 monster sets/game (face-up summons 16.3); attacks into defense 10.9/game
- **Wall punish:** 1.87/game, 1.58 bank cards lost/game
- **Bank triggers:** 14.4/game (+23.71 unusable) → bank 144497, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 2.0% (10205), 1: 99.3% (2185), 2+: 99.3% (7610)
- **Poly:** 2.17/game, bust 7.6%, stand 92.4%, avg stood total 17.1
- **Spells cast/game:** J-rank 2.35, poly 2.17, revive 1.95, snipe 1.87, negate 1.41, K-rank 0.31
- **Sac summons/game:** 1-sac 9.27, 2-sac 2.43 · milled cards/game 0.33

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 65% | 61% | 59% | 15% | 19% | 28% | 1% | 2% | 17% |
| mean turns until flip | 1.4 | 1.7 | 1.9 | 2.1 | 2.6 | 3.2 | 3.7 | 1.4 | 4.6 | 4.1 |

- **Showdown hands (all):** partial hand 53%, high card 0%, pair 1%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 24%, four of a kind 15%, straight flush 2%
- **Winning hands:** partial hand 4%, high card 0%, pair 2%, two pair 6%, three of a kind 1%, straight 1%, flush 3%, full house 49%, four of a kind 29%, straight flush 3%

### turtle vs turtle — config `drawPerTurn2` (10000 games)

- **Turns:** median 50, p10 50, p90 50, p95 50, max 50
- **Outcomes:** turtle (seat 0) 0.0% · draws 100.0% · stalls 0.00% · first-player wins 0.0% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 0.0; winners NaN vs losers 0.0
- **Attack vs defense:** 0.0 attacks/game vs 26.9 monster sets/game (face-up summons 0.0); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 0.0/game (+0.00 unusable) → bank 0, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (20000), 1: 0.0% (0), 2+: 0.0% (0)
- **Sac summons/game:** 1-sac 12.14, 2-sac 2.39 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** partial hand 100%
