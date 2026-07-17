# Sim report — `results/E0`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| baseline | aggro vs aggro | 10000 | 90 | 90 | 90 | 94 | 0.00% | 50.2% | 44.7% | 0.0% |
| baseline | aggro vs banker | 10000 | 90 | 86 | 90 | 94 | 0.00% | 4.4% | 50.3% | 0.0% |
| baseline | aggro vs greedy | 10000 | 79 | 74 | 84 | 92 | 0.00% | 0.2% | 50.3% | 0.0% |
| baseline | aggro vs random | 10000 | 83 | 78 | 88 | 94 | 0.00% | 62.4% | 49.0% | 0.3% |
| baseline | aggro vs turtle | 10000 | 87 | 83 | 91 | 96 | 0.00% | 17.0% | 50.6% | 83.0% |
| baseline | banker vs aggro | 10000 | 90 | 86 | 90 | 94 | 0.00% | 95.7% | 49.5% | 0.0% |
| baseline | banker vs banker | 10000 | 90 | 90 | 90 | 94 | 0.00% | 49.6% | 66.0% | 0.9% |
| baseline | banker vs greedy | 10000 | 79 | 74 | 84 | 91 | 0.00% | 8.3% | 48.8% | 0.1% |
| baseline | banker vs random | 10000 | 84 | 78 | 88 | 94 | 0.00% | 99.5% | 49.8% | 0.3% |
| baseline | banker vs turtle | 10000 | 91 | 90 | 91 | 97 | 0.00% | 51.0% | 85.2% | 49.0% |
| baseline | greedy vs aggro | 10000 | 79 | 74 | 84 | 91 | 0.00% | 99.9% | 49.7% | 0.0% |
| baseline | greedy vs banker | 10000 | 79 | 73 | 84 | 90 | 0.00% | 91.1% | 48.5% | 0.1% |
| baseline | greedy vs greedy | 10000 | 78 | 72 | 83 | 90 | 0.00% | 50.3% | 46.1% | 0.4% |
| baseline | greedy vs random | 10000 | 78 | 73 | 84 | 91 | 0.00% | 99.8% | 49.7% | 0.1% |
| baseline | greedy vs turtle | 10000 | 79 | 73 | 84 | 94 | 0.00% | 99.6% | 49.7% | 0.4% |
| baseline | random vs aggro | 10000 | 83 | 78 | 88 | 94 | 0.00% | 37.0% | 49.5% | 0.2% |
| baseline | random vs banker | 10000 | 84 | 78 | 88 | 94 | 0.00% | 0.3% | 50.1% | 0.5% |
| baseline | random vs greedy | 10000 | 78 | 73 | 84 | 90 | 0.00% | 0.1% | 50.2% | 0.1% |
| baseline | random vs random | 10000 | 79 | 73 | 85 | 94 | 0.00% | 42.8% | 49.4% | 14.1% |
| baseline | random vs turtle | 10000 | 83 | 76 | 89 | 98 | 0.00% | 1.9% | 50.4% | 87.6% |
| baseline | turtle vs aggro | 10000 | 87 | 83 | 91 | 96 | 0.00% | 0.0% | 51.3% | 82.1% |
| baseline | turtle vs banker | 10000 | 91 | 90 | 91 | 97 | 0.00% | 0.0% | 85.5% | 48.6% |
| baseline | turtle vs greedy | 10000 | 79 | 73 | 84 | 91 | 0.00% | 0.0% | 50.2% | 0.4% |
| baseline | turtle vs random | 10000 | 83 | 76 | 90 | 96 | 0.00% | 10.7% | 46.4% | 87.2% |
| baseline | turtle vs turtle | 10000 | 98 | 98 | 98 | 98 | 0.00% | 0.0% | 0.0% | 100.0% |

#### Win-rate matrix — config `baseline` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | banker | greedy | random | turtle |
|---|---|---|---|---|---|
| **aggro** | 50.0% | 4.4% | 0.2% | 62.6% | 17.4% |
| **banker** | 95.6% | 49.5% | 8.5% | 99.4% | 51.2% |
| **greedy** | 99.8% | 91.3% | 49.8% | 99.8% | 99.6% |
| **random** | 37.2% | 0.3% | 0.1% | 43.0% | 2.0% |
| **turtle** | 0.0% | 0.0% | 0.0% | 10.6% | 0.0% |

## Matchup detail

### aggro vs aggro — config `baseline` (10000 games)

- **Turns:** median 90, p10 90, p90 90, p95 91, max 94
- **Outcomes:** aggro (seat 0) 50.2% · draws 0.0% · stalls 0.00% · first-player wins 44.7% (of decided)
- **Banks:** seat0 mean 13.4, seat1 mean 13.3; winners 26.6 vs losers 0.2
- **Attack vs defense:** 140.5 attacks/game vs 0.0 monster sets/game (face-up summons 37.9); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 37.9/game (+102.09 unusable) → bank 323090, remove 55497, decline 0
- **Jokers:** win rate by jokers cast — 0: 44.4% (108), 1: 48.6% (1635), 2+: 50.2% (18257)
- **Spells cast/game:** J-rank 4.63
- **Sac summons/game:** 1-sac 7.07, 2-sac 2.19 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** partial hand 49%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 1%, four of a kind 5%, straight flush 45%
- **Winning hands:** high card 0%, pair 0%, two pair 0%, full house 1%, four of a kind 9%, straight flush 90%

### aggro vs banker — config `baseline` (10000 games)

- **Turns:** median 90, p10 86, p90 90, p95 90, max 94
- **Outcomes:** aggro (seat 0) 4.4% · draws 0.0% · stalls 0.00% · first-player wins 50.3% (of decided)
- **Banks:** seat0 mean 1.0, seat1 mean 23.3; winners 23.9 vs losers 0.4
- **Attack vs defense:** 132.2 attacks/game vs 4.0 monster sets/game (face-up summons 34.8); attacks into defense 5.4/game
- **Wall punish:** 2.83/game, 2.59 bank cards lost/game
- **Bank triggers:** 37.8/game (+87.68 unusable) → bank 323603, remove 54683, decline 0
- **Jokers:** win rate by jokers cast — 0: 35.0% (123), 1: 41.7% (1745), 2+: 50.9% (18132)
- **Spells cast/game:** J-rank 3.33
- **Sac summons/game:** 1-sac 7.87, 2-sac 2.38 · milled cards/game 0.07

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 16% | 14% | 13% | 11% | 2% | 2% | 2% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | — | — | 1.0 |

- **Showdown hands (all):** partial hand 48%, high card 0%, pair 0%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 3%, four of a kind 9%, straight flush 39%
- **Winning hands:** partial hand 0%, high card 0%, pair 0%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 4%, four of a kind 17%, straight flush 77%

### aggro vs greedy — config `baseline` (10000 games)

- **Turns:** median 79, p10 74, p90 84, p95 86, max 92
- **Outcomes:** aggro (seat 0) 0.2% · draws 0.0% · stalls 0.00% · first-player wins 50.3% (of decided)
- **Banks:** seat0 mean 0.1, seat1 mean 11.5; winners 11.5 vs losers 0.1
- **Attack vs defense:** 133.5 attacks/game vs 1.8 monster sets/game (face-up summons 36.0); attacks into defense 2.0/game
- **Wall punish:** 1.04/game, 0.90 bank cards lost/game
- **Bank triggers:** 18.5/game (+112.28 unusable) → bank 155197, remove 30215, decline 0
- **Jokers:** win rate by jokers cast — 0: 32.7% (520), 1: 44.3% (4703), 2+: 52.4% (14777)
- **Poly:** 2.29/game, bust 7.9%, stand 92.1%, avg stood total 17.1
- **Spells cast/game:** J-rank 4.54, poly 2.29, revive 2.24, negate 1.46, K-rank 0.65
- **Sac summons/game:** 1-sac 9.80, 2-sac 3.75 · milled cards/game 0.08

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 7% | 7% | 7% | 5% | 1% | 2% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.1 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | 1.0 |

- **Showdown hands (all):** partial hand 50%, high card 0%, pair 1%, two pair 6%, three of a kind 1%, straight 1%, flush 3%, full house 27%, four of a kind 11%, straight flush 1%
- **Winning hands:** partial hand 0%, high card 0%, pair 2%, two pair 12%, three of a kind 2%, straight 3%, flush 5%, full house 53%, four of a kind 21%, straight flush 1%

### aggro vs random — config `baseline` (10000 games)

- **Turns:** median 83, p10 78, p90 88, p95 89, max 94
- **Outcomes:** aggro (seat 0) 62.4% · draws 0.3% · stalls 0.00% · first-player wins 49.0% (of decided)
- **Banks:** seat0 mean 6.6, seat1 mean 2.6; winners 8.3 vs losers 0.9
- **Attack vs defense:** 57.3 attacks/game vs 12.6 monster sets/game (face-up summons 31.4); attacks into defense 8.1/game
- **Wall punish:** 5.39/game, 3.83 bank cards lost/game
- **Bank triggers:** 23.2/game (+24.59 unusable) → bank 169719, remove 39504, decline 23033
- **Jokers:** win rate by jokers cast — 0: 47.7% (327), 1: 49.8% (3446), 2+: 49.9% (16227)
- **Poly:** 0.91/game, bust 31.0%, stand 69.0%, avg stood total 14.0
- **Spells cast/game:** J-rank 4.99, revive 2.44, K-rank 1.90, Q-rank 1.78, poly 0.93, negate 0.55, snipe 0.47
- **Sac summons/game:** 1-sac 11.75, 2-sac 4.66 · milled cards/game 1.68

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 26% | 25% | 25% | 25% | 36% | 35% | 30% | 40% | 38% | 34% |
| mean turns until flip | 1.3 | 1.3 | 1.3 | 1.3 | 1.6 | 1.6 | 1.6 | 1.7 | 1.7 | 1.7 |

- **Showdown hands (all):** partial hand 62%, high card 2%, pair 6%, two pair 6%, three of a kind 2%, straight 2%, flush 1%, full house 11%, four of a kind 6%, straight flush 3%
- **Winning hands:** partial hand 27%, high card 3%, pair 10%, two pair 11%, three of a kind 4%, straight 3%, flush 2%, full house 21%, four of a kind 12%, straight flush 6%

### aggro vs turtle — config `baseline` (10000 games)

- **Turns:** median 87, p10 83, p90 91, p95 91, max 96
- **Outcomes:** aggro (seat 0) 17.0% · draws 83.0% · stalls 0.00% · first-player wins 50.6% (of decided)
- **Banks:** seat0 mean 1.3, seat1 mean 0.0; winners 7.4 vs losers 0.0
- **Attack vs defense:** 34.2 attacks/game vs 22.1 monster sets/game (face-up summons 18.2); attacks into defense 16.9/game
- **Wall punish:** 12.87/game, 4.06 bank cards lost/game
- **Bank triggers:** 5.3/game (+9.02 unusable) → bank 53230, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (10030), 1: 15.3% (1004), 2+: 17.2% (8966)
- **Spells cast/game:** J-rank 3.18
- **Sac summons/game:** 1-sac 8.73, 2-sac 3.09 · milled cards/game 1.60

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 49% | 47% | 46% | 46% | 72% | 71% | 71% | 56% | 75% | 87% |
| mean turns until flip | 1.3 | 1.4 | 1.7 | 2.0 | 4.1 | 6.4 | 6.7 | 6.1 | 6.9 | 6.5 |

- **Showdown hands (all):** partial hand 95%, high card 0%, pair 1%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 2%, four of a kind 1%, straight flush 0%
- **Winning hands:** partial hand 37%, high card 3%, pair 9%, two pair 9%, three of a kind 2%, straight 5%, flush 4%, full house 21%, four of a kind 7%, straight flush 3%

### banker vs aggro — config `baseline` (10000 games)

- **Turns:** median 90, p10 86, p90 90, p95 90, max 94
- **Outcomes:** banker (seat 0) 95.7% · draws 0.0% · stalls 0.00% · first-player wins 49.5% (of decided)
- **Banks:** seat0 mean 23.4, seat1 mean 1.0; winners 23.9 vs losers 0.4
- **Attack vs defense:** 132.6 attacks/game vs 4.0 monster sets/game (face-up summons 34.8); attacks into defense 5.4/game
- **Wall punish:** 2.79/game, 2.56 bank cards lost/game
- **Bank triggers:** 37.9/game (+88.09 unusable) → bank 323953, remove 55156, decline 0
- **Jokers:** win rate by jokers cast — 0: 42.0% (119), 1: 43.9% (1710), 2+: 50.6% (18171)
- **Spells cast/game:** J-rank 3.32
- **Sac summons/game:** 1-sac 7.84, 2-sac 2.38 · milled cards/game 0.07

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 16% | 14% | 13% | 11% | 2% | 2% | 2% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | — | 1.0 | 1.0 |

- **Showdown hands (all):** partial hand 48%, high card 0%, pair 0%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 3%, four of a kind 9%, straight flush 38%
- **Winning hands:** partial hand 0%, high card 0%, pair 0%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 4%, four of a kind 17%, straight flush 77%

### banker vs banker — config `baseline` (10000 games)

- **Turns:** median 90, p10 90, p90 90, p95 91, max 94
- **Outcomes:** banker (seat 0) 49.6% · draws 0.9% · stalls 0.00% · first-player wins 66.0% (of decided)
- **Banks:** seat0 mean 1.3, seat1 mean 1.2; winners 2.1 vs losers 0.4
- **Attack vs defense:** 3.3 attacks/game vs 27.9 monster sets/game (face-up summons 2.2); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 2.7/game (+0.61 unusable) → bank 26008, remove 1048, decline 0
- **Jokers:** win rate by jokers cast — 0: 54.6% (108), 1: 52.8% (1637), 2+: 49.2% (18255)
- **Sac summons/game:** 1-sac 11.87, 2-sac 3.88 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 95% | 91% | 87% | 81% | 97% | 97% | 97% | 97% | 98% | 98% |
| mean turns until flip | 2.0 | 1.7 | 2.0 | 2.4 | 7.0 | 5.4 | 12.0 | — | — | — |

- **Showdown hands (all):** partial hand 92%, high card 2%, pair 3%, two pair 2%, three of a kind 0%, straight 1%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%
- **Winning hands:** partial hand 85%, high card 3%, pair 6%, two pair 3%, three of a kind 1%, straight 1%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%

### banker vs greedy — config `baseline` (10000 games)

- **Turns:** median 79, p10 74, p90 84, p95 85, max 91
- **Outcomes:** banker (seat 0) 8.3% · draws 0.1% · stalls 0.00% · first-player wins 48.8% (of decided)
- **Banks:** seat0 mean 0.9, seat1 mean 7.9; winners 8.6 vs losers 0.3
- **Attack vs defense:** 103.1 attacks/game vs 19.9 monster sets/game (face-up summons 21.8); attacks into defense 12.3/game
- **Wall punish:** 1.89/game, 1.80 bank cards lost/game
- **Bank triggers:** 15.8/game (+73.28 unusable) → bank 131982, remove 25634, decline 0
- **Jokers:** win rate by jokers cast — 0: 45.8% (441), 1: 50.8% (4198), 2+: 49.8% (15361)
- **Poly:** 1.95/game, bust 7.8%, stand 92.2%, avg stood total 17.1
- **Spells cast/game:** J-rank 2.18, revive 2.15, poly 1.95, negate 1.38, K-rank 1.25
- **Sac summons/game:** 1-sac 12.77, 2-sac 4.50 · milled cards/game 1.57

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 70% | 64% | 62% | 59% | 32% | 31% | 29% | 11% | 10% | 11% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.4 | 2.5 | 3.3 | 3.4 | 3.7 | 4.4 | 3.9 |

- **Showdown hands (all):** partial hand 55%, high card 2%, pair 6%, two pair 11%, three of a kind 2%, straight 1%, flush 2%, full house 16%, four of a kind 5%, straight flush 1%
- **Winning hands:** partial hand 12%, high card 3%, pair 12%, two pair 21%, three of a kind 4%, straight 2%, flush 4%, full house 32%, four of a kind 10%, straight flush 1%

### banker vs random — config `baseline` (10000 games)

- **Turns:** median 84, p10 78, p90 88, p95 90, max 94
- **Outcomes:** banker (seat 0) 99.5% · draws 0.3% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 19.8, seat1 mean 0.0; winners 19.9 vs losers 0.0
- **Attack vs defense:** 70.0 attacks/game vs 24.2 monster sets/game (face-up summons 24.2); attacks into defense 5.5/game
- **Wall punish:** 2.14/game, 0.32 bank cards lost/game
- **Bank triggers:** 23.9/game (+39.75 unusable) → bank 218619, remove 16560, decline 3325
- **Jokers:** win rate by jokers cast — 0: 46.2% (327), 1: 46.1% (3425), 2+: 50.7% (16248)
- **Poly:** 0.54/game, bust 30.1%, stand 69.9%, avg stood total 14.0
- **Spells cast/game:** J-rank 2.69, K-rank 2.38, revive 2.37, Q-rank 1.87, poly 0.55, negate 0.40, snipe 0.35
- **Sac summons/game:** 1-sac 15.92, 2-sac 5.31 · milled cards/game 2.46

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 55% | 54% | 52% | 50% | 49% | 49% | 46% | 43% | 42% | 42% |
| mean turns until flip | 2.1 | 2.1 | 2.2 | 2.4 | 2.8 | 3.2 | 3.3 | 3.0 | 3.1 | 3.1 |

- **Showdown hands (all):** partial hand 51%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 5%, four of a kind 17%, straight flush 27%
- **Winning hands:** partial hand 2%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 9%, four of a kind 33%, straight flush 55%

### banker vs turtle — config `baseline` (10000 games)

- **Turns:** median 91, p10 90, p90 91, p95 93, max 97
- **Outcomes:** banker (seat 0) 51.0% · draws 49.0% · stalls 0.00% · first-player wins 85.2% (of decided)
- **Banks:** seat0 mean 0.8, seat1 mean 0.0; winners 1.6 vs losers 0.0
- **Attack vs defense:** 1.0 attacks/game vs 28.8 monster sets/game (face-up summons 0.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 0.8/game (+0.21 unusable) → bank 8333, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (10000), 1: 53.7% (374), 2+: 50.9% (9626)
- **Sac summons/game:** 1-sac 12.25, 2-sac 3.64 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 98% | 97% | 95% | 93% | 99% | 99% | 99% | 99% | 100% | 100% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** partial hand 98%, high card 0%, pair 1%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%
- **Winning hands:** partial hand 92%, high card 2%, pair 3%, two pair 2%, three of a kind 1%, straight 1%, flush 0%, full house 1%, four of a kind 0%

### greedy vs aggro — config `baseline` (10000 games)

- **Turns:** median 79, p10 74, p90 84, p95 86, max 91
- **Outcomes:** greedy (seat 0) 99.9% · draws 0.0% · stalls 0.00% · first-player wins 49.7% (of decided)
- **Banks:** seat0 mean 11.5, seat1 mean 0.1; winners 11.5 vs losers 0.0
- **Attack vs defense:** 133.5 attacks/game vs 1.8 monster sets/game (face-up summons 35.9); attacks into defense 1.9/game
- **Wall punish:** 1.01/game, 0.88 bank cards lost/game
- **Bank triggers:** 18.5/game (+112.47 unusable) → bank 154759, remove 30021, decline 0
- **Jokers:** win rate by jokers cast — 0: 34.8% (506), 1: 44.8% (4778), 2+: 52.2% (14716)
- **Poly:** 2.31/game, bust 7.7%, stand 92.3%, avg stood total 17.1
- **Spells cast/game:** J-rank 4.54, poly 2.31, revive 2.25, negate 1.48, K-rank 0.65
- **Sac summons/game:** 1-sac 9.80, 2-sac 3.72 · milled cards/game 0.08

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 7% | 7% | 6% | 5% | 1% | 2% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.2 | 1.1 | 1.2 | 1.2 | 1.1 | 1.0 | 1.0 | 1.2 | 1.0 | 1.0 |

- **Showdown hands (all):** partial hand 50%, high card 0%, pair 1%, two pair 5%, three of a kind 1%, straight 2%, flush 2%, full house 27%, four of a kind 11%, straight flush 1%
- **Winning hands:** partial hand 0%, high card 0%, pair 2%, two pair 11%, three of a kind 2%, straight 3%, flush 5%, full house 53%, four of a kind 22%, straight flush 1%

### greedy vs banker — config `baseline` (10000 games)

- **Turns:** median 79, p10 73, p90 84, p95 85, max 90
- **Outcomes:** greedy (seat 0) 91.1% · draws 0.1% · stalls 0.00% · first-player wins 48.5% (of decided)
- **Banks:** seat0 mean 7.9, seat1 mean 1.0; winners 8.6 vs losers 0.3
- **Attack vs defense:** 103.0 attacks/game vs 19.9 monster sets/game (face-up summons 21.7); attacks into defense 12.3/game
- **Wall punish:** 1.90/game, 1.81 bank cards lost/game
- **Bank triggers:** 15.6/game (+73.25 unusable) → bank 131210, remove 24652, decline 0
- **Jokers:** win rate by jokers cast — 0: 49.4% (466), 1: 50.6% (4240), 2+: 49.8% (15294)
- **Poly:** 1.96/game, bust 7.8%, stand 92.2%, avg stood total 17.1
- **Spells cast/game:** J-rank 2.18, revive 2.15, poly 1.96, negate 1.38, K-rank 1.23
- **Sac summons/game:** 1-sac 12.73, 2-sac 4.47 · milled cards/game 1.56

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 70% | 64% | 62% | 59% | 32% | 31% | 30% | 11% | 10% | 12% |
| mean turns until flip | 1.2 | 1.2 | 1.3 | 1.4 | 2.5 | 3.3 | 3.3 | 3.6 | 4.6 | 4.2 |

- **Showdown hands (all):** partial hand 56%, high card 2%, pair 6%, two pair 10%, three of a kind 2%, straight 1%, flush 2%, full house 16%, four of a kind 5%, straight flush 1%
- **Winning hands:** partial hand 13%, high card 3%, pair 11%, two pair 20%, three of a kind 4%, straight 2%, flush 4%, full house 31%, four of a kind 10%, straight flush 1%

### greedy vs greedy — config `baseline` (10000 games)

- **Turns:** median 78, p10 72, p90 83, p95 84, max 90
- **Outcomes:** greedy (seat 0) 50.3% · draws 0.4% · stalls 0.00% · first-player wins 46.1% (of decided)
- **Banks:** seat0 mean 3.1, seat1 mean 3.1; winners 5.7 vs losers 0.6
- **Attack vs defense:** 79.7 attacks/game vs 20.5 monster sets/game (face-up summons 25.2); attacks into defense 13.7/game
- **Wall punish:** 2.08/game, 2.03 bank cards lost/game
- **Bank triggers:** 15.2/game (+48.41 unusable) → bank 117544, remove 34832, decline 0
- **Jokers:** win rate by jokers cast — 0: 45.3% (558), 1: 47.9% (4568), 2+: 50.5% (14874)
- **Poly:** 2.54/game, bust 7.6%, stand 92.4%, avg stood total 17.2
- **Spells cast/game:** revive 4.79, J-rank 4.25, K-rank 3.35, poly 2.67, negate 2.35, snipe 1.69
- **Sac summons/game:** 1-sac 15.31, 2-sac 4.56 · milled cards/game 2.19

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 66% | 59% | 57% | 55% | 33% | 35% | 31% | 8% | 3% | 4% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.3 | 1.6 | 1.4 | 1.3 | 1.6 | 2.9 | 2.6 |

- **Showdown hands (all):** partial hand 67%, high card 1%, pair 5%, two pair 9%, three of a kind 3%, straight 0%, flush 0%, full house 11%, four of a kind 3%, straight flush 0%
- **Winning hands:** partial hand 34%, high card 2%, pair 10%, two pair 18%, three of a kind 7%, straight 1%, flush 1%, full house 22%, four of a kind 6%, straight flush 0%

### greedy vs random — config `baseline` (10000 games)

- **Turns:** median 78, p10 73, p90 84, p95 85, max 91
- **Outcomes:** greedy (seat 0) 99.8% · draws 0.1% · stalls 0.00% · first-player wins 49.7% (of decided)
- **Banks:** seat0 mean 8.4, seat1 mean 0.0; winners 8.4 vs losers 0.0
- **Attack vs defense:** 112.4 attacks/game vs 11.3 monster sets/game (face-up summons 31.0); attacks into defense 6.6/game
- **Wall punish:** 1.68/game, 1.22 bank cards lost/game
- **Bank triggers:** 12.1/game (+92.95 unusable) → bank 107285, remove 11130, decline 2740
- **Jokers:** win rate by jokers cast — 0: 41.1% (642), 1: 46.9% (4949), 2+: 51.4% (14409)
- **Poly:** 2.43/game, bust 9.8%, stand 90.2%, avg stood total 16.8
- **Spells cast/game:** revive 4.44, J-rank 3.70, K-rank 3.06, poly 2.50, negate 2.13, snipe 1.87, Q-rank 1.13
- **Sac summons/game:** 1-sac 13.16, 2-sac 4.61 · milled cards/game 1.14

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 38% | 35% | 34% | 33% | 20% | 19% | 17% | 7% | 6% | 5% |
| mean turns until flip | 1.2 | 1.2 | 1.2 | 1.2 | 1.4 | 1.4 | 1.4 | 1.7 | 1.7 | 1.7 |

- **Showdown hands (all):** partial hand 55%, high card 1%, pair 6%, two pair 11%, three of a kind 2%, straight 1%, flush 2%, full house 18%, four of a kind 4%, straight flush 0%
- **Winning hands:** partial hand 10%, high card 2%, pair 11%, two pair 23%, three of a kind 5%, straight 2%, flush 3%, full house 35%, four of a kind 8%, straight flush 0%

### greedy vs turtle — config `baseline` (10000 games)

- **Turns:** median 79, p10 73, p90 84, p95 86, max 94
- **Outcomes:** greedy (seat 0) 99.6% · draws 0.4% · stalls 0.00% · first-player wins 49.7% (of decided)
- **Banks:** seat0 mean 8.6, seat1 mean 0.0; winners 8.7 vs losers 0.0
- **Attack vs defense:** 114.0 attacks/game vs 17.6 monster sets/game (face-up summons 22.4); attacks into defense 12.9/game
- **Wall punish:** 2.20/game, 1.93 bank cards lost/game
- **Bank triggers:** 10.6/game (+88.25 unusable) → bank 105599, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 2.3% (10235), 1: 99.4% (2249), 2+: 99.7% (7516)
- **Poly:** 2.22/game, bust 7.6%, stand 92.4%, avg stood total 17.1
- **Spells cast/game:** poly 2.22, revive 2.11, snipe 2.07, J-rank 1.94, negate 1.47, K-rank 0.26
- **Sac summons/game:** 1-sac 12.17, 2-sac 4.62 · milled cards/game 0.88

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 66% | 61% | 60% | 59% | 20% | 24% | 28% | 2% | 5% | 15% |
| mean turns until flip | 1.2 | 1.3 | 1.4 | 1.5 | 3.0 | 3.8 | 4.4 | 4.1 | 6.3 | 6.0 |

- **Showdown hands (all):** partial hand 56%, high card 1%, pair 5%, two pair 11%, three of a kind 2%, straight 1%, flush 2%, full house 18%, four of a kind 5%, straight flush 0%
- **Winning hands:** partial hand 12%, high card 2%, pair 10%, two pair 22%, three of a kind 4%, straight 1%, flush 3%, full house 35%, four of a kind 9%, straight flush 0%

### random vs aggro — config `baseline` (10000 games)

- **Turns:** median 83, p10 78, p90 88, p95 89, max 94
- **Outcomes:** random (seat 0) 37.0% · draws 0.2% · stalls 0.00% · first-player wins 49.5% (of decided)
- **Banks:** seat0 mean 2.6, seat1 mean 6.4; winners 8.0 vs losers 1.0
- **Attack vs defense:** 56.7 attacks/game vs 12.6 monster sets/game (face-up summons 31.4); attacks into defense 8.1/game
- **Wall punish:** 5.44/game, 3.90 bank cards lost/game
- **Bank triggers:** 23.2/game (+24.04 unusable) → bank 168844, remove 39962, decline 22717
- **Jokers:** win rate by jokers cast — 0: 48.9% (317), 1: 49.9% (3451), 2+: 49.9% (16232)
- **Poly:** 0.93/game, bust 31.3%, stand 68.7%, avg stood total 13.9
- **Spells cast/game:** J-rank 5.01, revive 2.44, K-rank 1.89, Q-rank 1.78, poly 0.96, negate 0.53, snipe 0.48
- **Sac summons/game:** 1-sac 11.79, 2-sac 4.66 · milled cards/game 1.69

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 26% | 25% | 25% | 25% | 36% | 34% | 30% | 41% | 37% | 34% |
| mean turns until flip | 1.3 | 1.3 | 1.3 | 1.3 | 1.6 | 1.6 | 1.6 | 1.7 | 1.7 | 1.7 |

- **Showdown hands (all):** partial hand 63%, high card 2%, pair 6%, two pair 6%, three of a kind 2%, straight 2%, flush 1%, full house 11%, four of a kind 6%, straight flush 3%
- **Winning hands:** partial hand 29%, high card 3%, pair 10%, two pair 10%, three of a kind 4%, straight 3%, flush 2%, full house 21%, four of a kind 12%, straight flush 6%

### random vs banker — config `baseline` (10000 games)

- **Turns:** median 84, p10 78, p90 88, p95 90, max 94
- **Outcomes:** random (seat 0) 0.3% · draws 0.5% · stalls 0.00% · first-player wins 50.1% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 19.7; winners 19.8 vs losers 0.0
- **Attack vs defense:** 70.0 attacks/game vs 24.3 monster sets/game (face-up summons 24.2); attacks into defense 5.5/game
- **Wall punish:** 2.12/game, 0.33 bank cards lost/game
- **Bank triggers:** 23.8/game (+39.87 unusable) → bank 217696, remove 16505, decline 3494
- **Jokers:** win rate by jokers cast — 0: 48.8% (303), 1: 45.6% (3460), 2+: 50.7% (16237)
- **Poly:** 0.54/game, bust 30.4%, stand 69.6%, avg stood total 14.1
- **Spells cast/game:** J-rank 2.69, K-rank 2.40, revive 2.37, Q-rank 1.86, poly 0.55, negate 0.40, snipe 0.36
- **Sac summons/game:** 1-sac 15.95, 2-sac 5.33 · milled cards/game 2.43

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 55% | 53% | 52% | 51% | 49% | 49% | 47% | 42% | 43% | 42% |
| mean turns until flip | 2.1 | 2.1 | 2.2 | 2.5 | 2.8 | 3.2 | 3.4 | 2.9 | 3.1 | 3.1 |

- **Showdown hands (all):** partial hand 51%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 5%, four of a kind 17%, straight flush 27%
- **Winning hands:** partial hand 2%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 9%, four of a kind 33%, straight flush 54%

### random vs greedy — config `baseline` (10000 games)

- **Turns:** median 78, p10 73, p90 84, p95 85, max 90
- **Outcomes:** random (seat 0) 0.1% · draws 0.1% · stalls 0.00% · first-player wins 50.2% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 8.4; winners 8.4 vs losers 0.0
- **Attack vs defense:** 112.8 attacks/game vs 11.3 monster sets/game (face-up summons 31.0); attacks into defense 6.6/game
- **Wall punish:** 1.68/game, 1.22 bank cards lost/game
- **Bank triggers:** 12.1/game (+93.33 unusable) → bank 107097, remove 10898, decline 2757
- **Jokers:** win rate by jokers cast — 0: 40.9% (618), 1: 46.9% (4887), 2+: 51.3% (14495)
- **Poly:** 2.41/game, bust 10.1%, stand 89.9%, avg stood total 16.9
- **Spells cast/game:** revive 4.45, J-rank 3.72, K-rank 3.07, poly 2.48, negate 2.14, snipe 1.87, Q-rank 1.13
- **Sac summons/game:** 1-sac 13.18, 2-sac 4.64 · milled cards/game 1.14

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 38% | 36% | 34% | 33% | 20% | 19% | 17% | 7% | 6% | 5% |
| mean turns until flip | 1.2 | 1.2 | 1.2 | 1.2 | 1.4 | 1.4 | 1.4 | 1.7 | 1.7 | 1.7 |

- **Showdown hands (all):** partial hand 55%, high card 1%, pair 5%, two pair 11%, three of a kind 2%, straight 1%, flush 2%, full house 17%, four of a kind 4%, straight flush 0%
- **Winning hands:** partial hand 10%, high card 2%, pair 11%, two pair 22%, three of a kind 5%, straight 2%, flush 4%, full house 35%, four of a kind 8%, straight flush 0%

### random vs random — config `baseline` (10000 games)

- **Turns:** median 79, p10 73, p90 85, p95 86, max 94
- **Outcomes:** random (seat 0) 42.8% · draws 14.1% · stalls 0.00% · first-player wins 49.4% (of decided)
- **Banks:** seat0 mean 1.1, seat1 mean 1.1; winners 2.2 vs losers 0.3
- **Attack vs defense:** 22.4 attacks/game vs 26.4 monster sets/game (face-up summons 26.4); attacks into defense 7.6/game
- **Wall punish:** 4.29/game, 1.79 bank cards lost/game
- **Bank triggers:** 9.6/game (+3.85 unusable) → bank 53451, remove 13343, decline 29490
- **Jokers:** win rate by jokers cast — 0: 35.5% (583), 1: 40.4% (4672), 2+: 44.1% (14745)
- **Poly:** 1.66/game, bust 31.3%, stand 68.7%, avg stood total 14.0
- **Spells cast/game:** revive 4.71, J-rank 4.55, K-rank 3.15, Q-rank 2.89, poly 1.73, snipe 1.42, negate 1.22
- **Sac summons/game:** 1-sac 18.02, 2-sac 8.00 · milled cards/game 3.37

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% |
| mean turns until flip | 1.7 | 1.7 | 1.7 | 1.7 | 1.8 | 1.8 | 1.8 | 1.9 | 1.9 | 1.9 |

- **Showdown hands (all):** partial hand 97%, high card 0%, pair 1%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%
- **Winning hands:** partial hand 94%, high card 1%, pair 3%, two pair 1%, three of a kind 1%, straight 0%, flush 0%, full house 0%, four of a kind 0%

### random vs turtle — config `baseline` (10000 games)

- **Turns:** median 83, p10 76, p90 89, p95 90, max 98
- **Outcomes:** random (seat 0) 1.9% · draws 87.6% · stalls 0.00% · first-player wins 50.4% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 0.2; winners 1.6 vs losers 0.0
- **Attack vs defense:** 14.7 attacks/game vs 38.0 monster sets/game (face-up summons 14.5); attacks into defense 11.8/game
- **Wall punish:** 7.90/game, 0.38 bank cards lost/game
- **Bank triggers:** 0.8/game (+0.33 unusable) → bank 5874, remove 76, decline 2155
- **Jokers:** win rate by jokers cast — 0: 10.4% (10120), 1: 1.8% (1929), 2+: 1.9% (7951)
- **Poly:** 0.85/game, bust 30.7%, stand 69.3%, avg stood total 14.0
- **Spells cast/game:** revive 2.40, J-rank 2.34, snipe 1.85, Q-rank 1.48, K-rank 1.42, poly 0.87, negate 0.43
- **Sac summons/game:** 1-sac 17.30, 2-sac 7.92 · milled cards/game 2.98

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 74% | 73% | 74% | 74% | 68% | 71% | 74% | 54% | 67% | 81% |
| mean turns until flip | 2.0 | 2.3 | 2.6 | 3.0 | 3.6 | 5.7 | 7.5 | 3.9 | 6.7 | 8.2 |

- **Showdown hands (all):** partial hand 100%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, full house 0%, four of a kind 0%
- **Winning hands:** partial hand 99%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, full house 0%, four of a kind 0%

### turtle vs aggro — config `baseline` (10000 games)

- **Turns:** median 87, p10 83, p90 91, p95 91, max 96
- **Outcomes:** turtle (seat 0) 0.0% · draws 82.1% · stalls 0.00% · first-player wins 51.3% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 1.4; winners 7.7 vs losers 0.0
- **Attack vs defense:** 35.1 attacks/game vs 22.1 monster sets/game (face-up summons 18.2); attacks into defense 16.9/game
- **Wall punish:** 12.80/game, 4.15 bank cards lost/game
- **Bank triggers:** 5.5/game (+9.66 unusable) → bank 55196, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (10037), 1: 15.2% (965), 2+: 18.2% (8998)
- **Spells cast/game:** J-rank 3.15
- **Sac summons/game:** 1-sac 8.70, 2-sac 3.09 · milled cards/game 1.61

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 49% | 47% | 46% | 46% | 71% | 71% | 70% | 57% | 73% | 87% |
| mean turns until flip | 1.3 | 1.4 | 1.7 | 2.0 | 4.0 | 6.5 | 6.9 | 5.8 | 7.0 | 6.4 |

- **Showdown hands (all):** partial hand 94%, high card 0%, pair 1%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 2%, four of a kind 1%, straight flush 0%
- **Winning hands:** partial hand 35%, high card 4%, pair 9%, two pair 10%, three of a kind 2%, straight 5%, flush 4%, full house 21%, four of a kind 8%, straight flush 3%

### turtle vs banker — config `baseline` (10000 games)

- **Turns:** median 91, p10 90, p90 91, p95 93, max 97
- **Outcomes:** turtle (seat 0) 0.0% · draws 48.6% · stalls 0.00% · first-player wins 85.5% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 0.8; winners 1.6 vs losers 0.0
- **Attack vs defense:** 1.0 attacks/game vs 28.8 monster sets/game (face-up summons 0.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 0.8/game (+0.18 unusable) → bank 8340, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (10000), 1: 47.1% (365), 2+: 51.6% (9635)
- **Sac summons/game:** 1-sac 12.23, 2-sac 3.65 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 98% | 96% | 95% | 93% | 99% | 99% | 99% | 99% | 99% | 100% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** partial hand 98%, high card 0%, pair 1%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%
- **Winning hands:** partial hand 92%, high card 2%, pair 3%, two pair 2%, three of a kind 1%, straight 1%, flush 0%, full house 1%, four of a kind 0%

### turtle vs greedy — config `baseline` (10000 games)

- **Turns:** median 79, p10 73, p90 84, p95 86, max 91
- **Outcomes:** turtle (seat 0) 0.0% · draws 0.4% · stalls 0.00% · first-player wins 50.2% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 8.7; winners 8.7 vs losers 0.0
- **Attack vs defense:** 114.2 attacks/game vs 17.6 monster sets/game (face-up summons 22.4); attacks into defense 12.9/game
- **Wall punish:** 2.20/game, 1.93 bank cards lost/game
- **Bank triggers:** 10.6/game (+88.50 unusable) → bank 105848, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 2.2% (10224), 1: 99.6% (2237), 2+: 99.7% (7539)
- **Poly:** 2.21/game, bust 7.7%, stand 92.3%, avg stood total 17.1
- **Spells cast/game:** poly 2.21, revive 2.13, snipe 2.07, J-rank 1.93, negate 1.47, K-rank 0.26
- **Sac summons/game:** 1-sac 12.17, 2-sac 4.64 · milled cards/game 0.87

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 66% | 61% | 60% | 59% | 20% | 24% | 27% | 3% | 5% | 15% |
| mean turns until flip | 1.2 | 1.3 | 1.4 | 1.5 | 2.9 | 3.7 | 4.5 | 5.1 | 5.9 | 6.0 |

- **Showdown hands (all):** partial hand 56%, high card 1%, pair 5%, two pair 10%, three of a kind 2%, straight 1%, flush 2%, full house 18%, four of a kind 5%, straight flush 0%
- **Winning hands:** partial hand 12%, high card 2%, pair 10%, two pair 21%, three of a kind 4%, straight 2%, flush 3%, full house 36%, four of a kind 10%, straight flush 0%

### turtle vs random — config `baseline` (10000 games)

- **Turns:** median 83, p10 76, p90 90, p95 90, max 96
- **Outcomes:** turtle (seat 0) 10.7% · draws 87.2% · stalls 0.00% · first-player wins 46.4% (of decided)
- **Banks:** seat0 mean 0.2, seat1 mean 0.0; winners 1.6 vs losers 0.0
- **Attack vs defense:** 14.7 attacks/game vs 38.0 monster sets/game (face-up summons 14.5); attacks into defense 11.9/game
- **Wall punish:** 7.88/game, 0.38 bank cards lost/game
- **Bank triggers:** 0.8/game (+0.33 unusable) → bank 5949, remove 93, decline 2215
- **Jokers:** win rate by jokers cast — 0: 10.5% (10144), 1: 2.2% (1972), 2+: 2.2% (7884)
- **Poly:** 0.86/game, bust 30.7%, stand 69.2%, avg stood total 13.9
- **Spells cast/game:** revive 2.42, J-rank 2.32, snipe 1.87, Q-rank 1.47, K-rank 1.40, poly 0.88, negate 0.44
- **Sac summons/game:** 1-sac 17.27, 2-sac 7.96 · milled cards/game 2.96

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 74% | 74% | 74% | 74% | 68% | 71% | 74% | 54% | 67% | 80% |
| mean turns until flip | 2.0 | 2.3 | 2.6 | 3.0 | 3.7 | 5.7 | 7.4 | 4.0 | 6.7 | 8.2 |

- **Showdown hands (all):** partial hand 100%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, full house 0%, four of a kind 0%
- **Winning hands:** partial hand 99%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, full house 0%, four of a kind 0%

### turtle vs turtle — config `baseline` (10000 games)

- **Turns:** median 98, p10 98, p90 98, p95 98, max 98
- **Outcomes:** turtle (seat 0) 0.0% · draws 100.0% · stalls 0.00% · first-player wins 0.0% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 0.0; winners NaN vs losers 0.0
- **Attack vs defense:** 0.0 attacks/game vs 29.7 monster sets/game (face-up summons 0.0); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 0.0/game (+0.00 unusable) → bank 0, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (20000), 1: 0.0% (0), 2+: 0.0% (0)
- **Sac summons/game:** 1-sac 12.85, 2-sac 3.40 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** partial hand 100%
