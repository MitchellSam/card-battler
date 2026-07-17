# Sim report — `results/R0`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| baseline | aggro vs aggro | 10000 | 46 | 46 | 47 | 49 | 0.00% | 49.7% | 46.0% | 0.0% |
| baseline | aggro vs banker | 10000 | 46 | 44 | 46 | 49 | 0.00% | 9.2% | 50.6% | 0.0% |
| baseline | aggro vs greedy | 10000 | 43 | 40 | 45 | 49 | 0.00% | 0.3% | 50.2% | 0.0% |
| baseline | aggro vs random | 10000 | 45 | 43 | 46 | 49 | 0.00% | 54.1% | 50.2% | 0.1% |
| baseline | aggro vs turtle | 10000 | 46 | 44 | 47 | 50 | 0.00% | 29.4% | 54.7% | 70.5% |
| baseline | banker vs aggro | 10000 | 46 | 44 | 46 | 49 | 0.00% | 89.8% | 50.1% | 0.0% |
| baseline | banker vs banker | 10000 | 46 | 46 | 47 | 49 | 0.00% | 25.6% | 12.8% | 49.1% |
| baseline | banker vs greedy | 10000 | 43 | 40 | 45 | 48 | 0.00% | 3.0% | 50.1% | 0.0% |
| baseline | banker vs random | 10000 | 45 | 42 | 46 | 49 | 0.00% | 97.0% | 49.9% | 1.9% |
| baseline | banker vs turtle | 10000 | 47 | 46 | 48 | 50 | 0.00% | 10.9% | 29.4% | 89.1% |
| baseline | greedy vs aggro | 10000 | 43 | 40 | 45 | 49 | 0.00% | 99.8% | 49.8% | 0.0% |
| baseline | greedy vs banker | 10000 | 43 | 40 | 45 | 49 | 0.00% | 97.0% | 49.3% | 0.0% |
| baseline | greedy vs greedy | 10000 | 42 | 40 | 45 | 48 | 0.00% | 49.3% | 46.2% | 0.0% |
| baseline | greedy vs random | 10000 | 43 | 40 | 45 | 49 | 0.00% | 100.0% | 49.8% | 0.0% |
| baseline | greedy vs turtle | 10000 | 43 | 41 | 45 | 49 | 0.00% | 99.4% | 49.8% | 0.6% |
| baseline | random vs aggro | 10000 | 45 | 43 | 46 | 50 | 0.00% | 45.4% | 49.2% | 0.1% |
| baseline | random vs banker | 10000 | 45 | 42 | 46 | 49 | 0.00% | 1.1% | 50.4% | 1.9% |
| baseline | random vs greedy | 10000 | 43 | 40 | 45 | 49 | 0.00% | 0.1% | 50.2% | 0.0% |
| baseline | random vs random | 10000 | 44 | 42 | 46 | 49 | 0.00% | 45.9% | 49.8% | 7.5% |
| baseline | random vs turtle | 10000 | 46 | 43 | 47 | 50 | 0.00% | 2.5% | 48.9% | 92.0% |
| baseline | turtle vs aggro | 10000 | 46 | 44 | 47 | 50 | 0.00% | 0.0% | 55.0% | 68.9% |
| baseline | turtle vs banker | 10000 | 47 | 46 | 48 | 50 | 0.00% | 0.0% | 30.6% | 89.2% |
| baseline | turtle vs greedy | 10000 | 43 | 41 | 45 | 49 | 0.00% | 0.0% | 50.3% | 0.5% |
| baseline | turtle vs random | 10000 | 46 | 43 | 47 | 50 | 0.00% | 5.1% | 47.5% | 92.3% |
| baseline | turtle vs turtle | 10000 | 50 | 50 | 50 | 50 | 0.00% | 0.0% | 0.0% | 100.0% |

#### Win-rate matrix — config `baseline` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | banker | greedy | random | turtle |
|---|---|---|---|---|---|
| **aggro** | 50.0% | 9.7% | 0.3% | 54.4% | 30.3% |
| **banker** | 90.3% | 25.4% | 3.0% | 97.0% | 10.9% |
| **greedy** | 99.7% | 97.0% | 50.0% | 100.0% | 99.5% |
| **random** | 45.6% | 1.1% | 0.1% | 46.2% | 2.5% |
| **turtle** | 0.0% | 0.0% | 0.0% | 5.3% | 0.0% |

## Matchup detail

### aggro vs aggro — config `baseline` (10000 games)

- **Turns:** median 46, p10 46, p90 47, p95 47, max 49
- **Outcomes:** aggro (seat 0) 49.7% · draws 0.0% · stalls 0.00% · first-player wins 46.0% (of decided)
- **Banks:** seat0 mean 16.0, seat1 mean 16.2; winners 30.1 vs losers 2.1
- **Attack vs defense:** 58.6 attacks/game vs 0.0 monster sets/game (face-up summons 31.4); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 40.4/game (+17.64 unusable) → bank 363409, remove 40871, decline 0
- **Jokers:** win rate by jokers cast — 0: 40.2% (82), 1: 48.6% (1279), 2+: 50.1% (18639)
- **Spells cast/game:** J-rank 5.17
- **Sac summons/game:** 1-sac 5.72, 2-sac 1.18 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** high card 40%, pair 2%, two pair 1%, three of a kind 1%, straight 0%, flush 0%, full house 3%, four of a kind 9%, straight flush 45%
- **Winning hands:** full house 0%, four of a kind 11%, straight flush 89%

### aggro vs banker — config `baseline` (10000 games)

- **Turns:** median 46, p10 44, p90 46, p95 47, max 49
- **Outcomes:** aggro (seat 0) 9.2% · draws 0.0% · stalls 0.00% · first-player wins 50.6% (of decided)
- **Banks:** seat0 mean 2.7, seat1 mean 23.6; winners 24.6 vs losers 1.7
- **Attack vs defense:** 58.3 attacks/game vs 4.9 monster sets/game (face-up summons 28.0); attacks into defense 6.1/game
- **Wall punish:** 3.03/game, 2.62 bank cards lost/game
- **Bank triggers:** 34.7/game (+16.14 unusable) → bank 318067, remove 28784, decline 0
- **Jokers:** win rate by jokers cast — 0: 38.5% (91), 1: 40.2% (1334), 2+: 50.8% (18575)
- **Spells cast/game:** J-rank 3.43
- **Sac summons/game:** 1-sac 6.63, 2-sac 1.38 · milled cards/game 0.08

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 25% | 20% | 18% | 15% | 3% | 3% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.0 | 1.0 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | — | 1.0 | — |

- **Showdown hands (all):** high card 43%, pair 2%, two pair 2%, three of a kind 1%, straight 0%, flush 0%, full house 4%, four of a kind 12%, straight flush 36%
- **Winning hands:** high card 0%, pair 1%, two pair 1%, three of a kind 1%, straight 0%, flush 0%, full house 4%, four of a kind 22%, straight flush 71%

### aggro vs greedy — config `baseline` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** aggro (seat 0) 0.3% · draws 0.0% · stalls 0.00% · first-player wins 50.2% (of decided)
- **Banks:** seat0 mean 0.1, seat1 mean 18.5; winners 18.5 vs losers 0.1
- **Attack vs defense:** 74.1 attacks/game vs 1.5 monster sets/game (face-up summons 29.3); attacks into defense 1.2/game
- **Wall punish:** 0.57/game, 0.38 bank cards lost/game
- **Bank triggers:** 23.2/game (+49.09 unusable) → bank 211053, remove 21245, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (186), 1: 12.8% (2251), 2+: 55.3% (17563)
- **Poly:** 2.40/game, bust 9.7%, stand 90.3%, avg stood total 16.5
- **Spells cast/game:** J-rank 4.95, poly 2.40, revive 2.33, negate 1.51, K-rank 1.08
- **K spells (R3):** 1.08/game, Ace-as-11 fuel 22.5% of casts, outright debuff kills 96.8% of casts (avg power destroyed 3.5)
- **Sac summons/game:** 1-sac 6.95, 2-sac 1.95 · milled cards/game 0.02

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 6% | 8% | 6% | 6% | 1% | 1% | 2% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.1 | 1.2 | 1.1 | 1.1 | 1.1 | 1.0 | — | 1.0 |

- **Showdown hands (all):** high card 50%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 15%, four of a kind 28%, straight flush 8%
- **Winning hands:** two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 29%, four of a kind 55%, straight flush 15%

### aggro vs random — config `baseline` (10000 games)

- **Turns:** median 45, p10 43, p90 46, p95 47, max 49
- **Outcomes:** aggro (seat 0) 54.1% · draws 0.1% · stalls 0.00% · first-player wins 50.2% (of decided)
- **Banks:** seat0 mean 6.4, seat1 mean 4.7; winners 9.4 vs losers 1.7
- **Attack vs defense:** 28.0 attacks/game vs 9.7 monster sets/game (face-up summons 25.9); attacks into defense 6.2/game
- **Wall punish:** 4.06/game, 2.64 bank cards lost/game
- **Bank triggers:** 18.5/game (+1.72 unusable) → bank 153860, remove 16755, decline 14034
- **Jokers:** win rate by jokers cast — 0: 48.5% (167), 1: 48.5% (2269), 2+: 50.2% (17564)
- **Poly:** 0.68/game, bust 15.0%, stand 85.0%, avg stood total 8.5
- **Spells cast/game:** J-rank 5.77, revive 2.52, Q-rank 2.35, K-rank 2.33, poly 0.69, negate 0.40, snipe 0.31
- **K spells (R3):** 2.33/game, Ace-as-11 fuel 3.4% of casts, outright debuff kills 79.5% of casts (avg power destroyed 3.6)
- **Sac summons/game:** 1-sac 9.11, 2-sac 2.56 · milled cards/game 1.26

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 26% | 25% | 23% | 22% | 38% | 33% | 28% | 47% | 42% | 31% |
| mean turns until flip | 1.2 | 1.2 | 1.2 | 1.2 | 1.3 | 1.3 | 1.3 | 1.4 | 1.4 | 1.4 |

- **Showdown hands (all):** high card 46%, pair 15%, two pair 9%, three of a kind 3%, straight 3%, flush 2%, full house 11%, four of a kind 8%, straight flush 3%
- **Winning hands:** high card 10%, pair 18%, two pair 15%, three of a kind 6%, straight 5%, flush 3%, full house 22%, four of a kind 15%, straight flush 6%

### aggro vs turtle — config `baseline` (10000 games)

- **Turns:** median 46, p10 44, p90 47, p95 48, max 50
- **Outcomes:** aggro (seat 0) 29.4% · draws 70.5% · stalls 0.00% · first-player wins 54.7% (of decided)
- **Banks:** seat0 mean 2.3, seat1 mean 0.0; winners 7.9 vs losers 0.0
- **Attack vs defense:** 25.2 attacks/game vs 18.0 monster sets/game (face-up summons 16.6); attacks into defense 16.1/game
- **Wall punish:** 10.47/game, 3.34 bank cards lost/game
- **Bank triggers:** 5.7/game (+0.82 unusable) → bank 56516, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.1% (10028), 1: 28.4% (703), 2+: 29.5% (9269)
- **Spells cast/game:** J-rank 3.25
- **Sac summons/game:** 1-sac 6.72, 2-sac 1.88 · milled cards/game 0.86

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 54% | 52% | 50% | 49% | 53% | 50% | 52% | 68% | 48% | 66% |
| mean turns until flip | 1.3 | 1.5 | 1.7 | 1.9 | 2.4 | 3.1 | 3.1 | 2.0 | 2.6 | 3.1 |

- **Showdown hands (all):** high card 89%, pair 2%, two pair 2%, three of a kind 1%, straight 1%, flush 1%, full house 3%, four of a kind 2%, straight flush 1%
- **Winning hands:** high card 23%, pair 15%, two pair 11%, three of a kind 5%, straight 4%, flush 3%, full house 23%, four of a kind 11%, straight flush 4%

### banker vs aggro — config `baseline` (10000 games)

- **Turns:** median 46, p10 44, p90 46, p95 47, max 49
- **Outcomes:** banker (seat 0) 89.8% · draws 0.0% · stalls 0.00% · first-player wins 50.1% (of decided)
- **Banks:** seat0 mean 23.5, seat1 mean 2.9; winners 24.6 vs losers 1.8
- **Attack vs defense:** 58.4 attacks/game vs 4.9 monster sets/game (face-up summons 27.9); attacks into defense 6.1/game
- **Wall punish:** 3.03/game, 2.61 bank cards lost/game
- **Bank triggers:** 34.8/game (+16.21 unusable) → bank 318701, remove 28828, decline 0
- **Jokers:** win rate by jokers cast — 0: 51.7% (89), 1: 44.5% (1353), 2+: 50.4% (18558)
- **Spells cast/game:** J-rank 3.41
- **Sac summons/game:** 1-sac 6.63, 2-sac 1.37 · milled cards/game 0.07

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 25% | 20% | 18% | 15% | 3% | 3% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.0 | 1.0 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | — | 1.0 | — |

- **Showdown hands (all):** high card 42%, pair 2%, two pair 1%, three of a kind 1%, straight 0%, flush 0%, full house 5%, four of a kind 12%, straight flush 36%
- **Winning hands:** high card 0%, pair 0%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 5%, four of a kind 22%, straight flush 71%

### banker vs banker — config `baseline` (10000 games)

- **Turns:** median 46, p10 46, p90 47, p95 47, max 49
- **Outcomes:** banker (seat 0) 25.6% · draws 49.1% · stalls 0.00% · first-player wins 12.8% (of decided)
- **Banks:** seat0 mean 0.5, seat1 mean 0.5; winners 1.9 vs losers 0.0
- **Attack vs defense:** 1.0 attacks/game vs 25.9 monster sets/game (face-up summons 1.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 1.0/game (+0.01 unusable) → bank 10346, remove 29, decline 0
- **Jokers:** win rate by jokers cast — 0: 15.9% (82), 1: 16.9% (1278), 2+: 26.1% (18640)
- **Sac summons/game:** 1-sac 10.38, 2-sac 3.43 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 97% | 91% | 88% | 82% | 99% | 99% | 98% | 100% | 100% | 100% |
| mean turns until flip | 2.0 | 2.0 | — | 2.0 | 6.0 | — | 6.0 | — | — | — |

- **Showdown hands (all):** high card 95%, pair 3%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%, straight flush 0%
- **Winning hands:** high card 81%, pair 12%, two pair 3%, three of a kind 2%, straight 1%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%

### banker vs greedy — config `baseline` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 48
- **Outcomes:** banker (seat 0) 3.0% · draws 0.0% · stalls 0.00% · first-player wins 50.1% (of decided)
- **Banks:** seat0 mean 0.2, seat1 mean 13.1; winners 13.1 vs losers 0.1
- **Attack vs defense:** 52.4 attacks/game vs 15.8 monster sets/game (face-up summons 17.5); attacks into defense 8.8/game
- **Wall punish:** 1.71/game, 1.60 bank cards lost/game
- **Bank triggers:** 16.3/game (+25.18 unusable) → bank 155878, remove 7541, decline 0
- **Jokers:** win rate by jokers cast — 0: 14.7% (150), 1: 28.3% (1920), 2+: 52.6% (17930)
- **Poly:** 2.09/game, bust 10.1%, stand 89.9%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.45, poly 2.09, revive 2.03, K-rank 1.81, negate 1.09
- **K spells (R3):** 1.81/game, Ace-as-11 fuel 29.4% of casts, outright debuff kills 94.4% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 10.15, 2-sac 2.51 · milled cards/game 0.56

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 61% | 58% | 57% | 24% | 26% | 27% | 7% | 3% | 6% |
| mean turns until flip | 1.1 | 1.2 | 1.2 | 1.4 | 2.1 | 2.7 | 3.1 | 3.5 | 2.3 | 2.5 |

- **Showdown hands (all):** high card 51%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 24%, four of a kind 14%, straight flush 2%
- **Winning hands:** high card 3%, pair 3%, two pair 6%, three of a kind 1%, straight 2%, flush 4%, full house 49%, four of a kind 29%, straight flush 3%

### banker vs random — config `baseline` (10000 games)

- **Turns:** median 45, p10 42, p90 46, p95 47, max 49
- **Outcomes:** banker (seat 0) 97.0% · draws 1.9% · stalls 0.00% · first-player wins 49.9% (of decided)
- **Banks:** seat0 mean 13.4, seat1 mean 0.2; winners 13.7 vs losers 0.2
- **Attack vs defense:** 23.6 attacks/game vs 23.0 monster sets/game (face-up summons 15.8); attacks into defense 5.2/game
- **Wall punish:** 2.30/game, 0.42 bank cards lost/game
- **Bank triggers:** 15.2/game (+2.18 unusable) → bank 145352, remove 5284, decline 1803
- **Jokers:** win rate by jokers cast — 0: 28.5% (172), 1: 36.9% (2345), 2+: 50.9% (17483)
- **Poly:** 0.55/game, bust 14.2%, stand 85.8%, avg stood total 8.6
- **Spells cast/game:** J-rank 2.73, revive 2.41, K-rank 2.35, Q-rank 2.27, poly 0.56, negate 0.35, snipe 0.33
- **K spells (R3):** 2.35/game, Ace-as-11 fuel 4.3% of casts, outright debuff kills 62.7% of casts (avg power destroyed 5.5)
- **Sac summons/game:** 1-sac 12.49, 2-sac 3.87 · milled cards/game 1.53

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 65% | 61% | 61% | 60% | 56% | 57% | 56% | 51% | 53% | 55% |
| mean turns until flip | 1.8 | 1.8 | 1.9 | 2.3 | 2.6 | 3.1 | 3.4 | 2.6 | 2.8 | 3.0 |

- **Showdown hands (all):** high card 54%, pair 3%, two pair 1%, three of a kind 2%, straight 0%, flush 0%, full house 6%, four of a kind 19%, straight flush 16%
- **Winning hands:** high card 6%, pair 6%, two pair 2%, three of a kind 4%, straight 1%, flush 0%, full house 12%, four of a kind 38%, straight flush 32%

### banker vs turtle — config `baseline` (10000 games)

- **Turns:** median 47, p10 46, p90 48, p95 49, max 50
- **Outcomes:** banker (seat 0) 10.9% · draws 89.1% · stalls 0.00% · first-player wins 29.4% (of decided)
- **Banks:** seat0 mean 0.3, seat1 mean 0.0; winners 2.4 vs losers 0.0
- **Attack vs defense:** 0.3 attacks/game vs 26.4 monster sets/game (face-up summons 0.6); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 0.3/game (+0.01 unusable) → bank 2659, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (10000), 1: 11.7% (351), 2+: 10.8% (9649)
- **Sac summons/game:** 1-sac 11.13, 2-sac 2.93 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 98% | 96% | 95% | 94% | 100% | 100% | 99% | 100% | 100% | 100% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** high card 98%, pair 1%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%, straight flush 0%
- **Winning hands:** high card 72%, pair 18%, two pair 4%, three of a kind 2%, straight 1%, flush 1%, full house 2%, four of a kind 0%, straight flush 0%

### greedy vs aggro — config `baseline` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** greedy (seat 0) 99.8% · draws 0.0% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 18.4, seat1 mean 0.1; winners 18.4 vs losers 0.1
- **Attack vs defense:** 74.1 attacks/game vs 1.5 monster sets/game (face-up summons 29.4); attacks into defense 1.2/game
- **Wall punish:** 0.56/game, 0.38 bank cards lost/game
- **Bank triggers:** 23.2/game (+49.16 unusable) → bank 210620, remove 21366, decline 0
- **Jokers:** win rate by jokers cast — 0: 2.0% (199), 1: 13.2% (2237), 2+: 55.2% (17564)
- **Poly:** 2.41/game, bust 9.3%, stand 90.7%, avg stood total 16.4
- **Spells cast/game:** J-rank 4.96, poly 2.41, revive 2.33, negate 1.51, K-rank 1.10
- **K spells (R3):** 1.10/game, Ace-as-11 fuel 21.9% of casts, outright debuff kills 96.5% of casts (avg power destroyed 3.5)
- **Sac summons/game:** 1-sac 6.98, 2-sac 1.94 · milled cards/game 0.02

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 6% | 7% | 6% | 5% | 1% | 1% | 2% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.1 | 1.2 | 1.1 | 1.0 | 1.1 | — | — | — |

- **Showdown hands (all):** high card 50%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 15%, four of a kind 28%, straight flush 7%
- **Winning hands:** pair 0%, two pair 0%, straight 0%, flush 0%, full house 30%, four of a kind 55%, straight flush 15%

### greedy vs banker — config `baseline` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** greedy (seat 0) 97.0% · draws 0.0% · stalls 0.00% · first-player wins 49.3% (of decided)
- **Banks:** seat0 mean 13.0, seat1 mean 0.2; winners 13.1 vs losers 0.1
- **Attack vs defense:** 52.5 attacks/game vs 15.8 monster sets/game (face-up summons 17.5); attacks into defense 8.8/game
- **Wall punish:** 1.71/game, 1.60 bank cards lost/game
- **Bank triggers:** 16.3/game (+25.24 unusable) → bank 155570, remove 7448, decline 0
- **Jokers:** win rate by jokers cast — 0: 15.1% (146), 1: 28.6% (1915), 2+: 52.6% (17939)
- **Poly:** 2.08/game, bust 9.7%, stand 90.3%, avg stood total 16.4
- **Spells cast/game:** J-rank 2.48, poly 2.08, revive 2.03, K-rank 1.81, negate 1.09
- **K spells (R3):** 1.81/game, Ace-as-11 fuel 29.2% of casts, outright debuff kills 94.6% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 10.17, 2-sac 2.51 · milled cards/game 0.56

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 61% | 59% | 57% | 24% | 26% | 27% | 7% | 3% | 6% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.4 | 2.1 | 2.8 | 3.2 | 3.2 | 2.3 | 2.3 |

- **Showdown hands (all):** high card 51%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 24%, four of a kind 14%, straight flush 2%
- **Winning hands:** high card 3%, pair 4%, two pair 7%, three of a kind 1%, straight 2%, flush 4%, full house 49%, four of a kind 28%, straight flush 3%

### greedy vs greedy — config `baseline` (10000 games)

- **Turns:** median 42, p10 40, p90 45, p95 45, max 48
- **Outcomes:** greedy (seat 0) 49.3% · draws 0.0% · stalls 0.00% · first-player wins 46.2% (of decided)
- **Banks:** seat0 mean 5.4, seat1 mean 5.5; winners 9.3 vs losers 1.6
- **Attack vs defense:** 32.9 attacks/game vs 17.1 monster sets/game (face-up summons 19.0); attacks into defense 8.4/game
- **Wall punish:** 1.07/game, 1.02 bank cards lost/game
- **Bank triggers:** 15.6/game (+7.38 unusable) → bank 137875, remove 18151, decline 0
- **Jokers:** win rate by jokers cast — 0: 44.8% (125), 1: 47.0% (1921), 2+: 50.4% (17954)
- **Poly:** 2.40/game, bust 10.4%, stand 89.6%, avg stood total 16.7
- **Spells cast/game:** K-rank 5.09, J-rank 4.61, revive 4.42, poly 2.58, negate 2.20, snipe 1.61
- **K spells (R3):** 5.09/game, Ace-as-11 fuel 29.1% of casts, outright debuff kills 88.0% of casts (avg power destroyed 6.7)
- **Sac summons/game:** 1-sac 11.86, 2-sac 1.80 · milled cards/game 0.91

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 70% | 59% | 55% | 55% | 33% | 36% | 31% | 15% | 1% | 2% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.4 | 1.6 | 1.6 | 1.6 | 1.5 | 2.7 | 2.3 |

- **Showdown hands (all):** high card 44%, pair 9%, two pair 7%, three of a kind 3%, straight 2%, flush 1%, full house 23%, four of a kind 11%, straight flush 1%
- **Winning hands:** high card 4%, pair 8%, two pair 11%, three of a kind 4%, straight 3%, flush 3%, full house 44%, four of a kind 22%, straight flush 1%

### greedy vs random — config `baseline` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** greedy (seat 0) 100.0% · draws 0.0% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 15.0, seat1 mean 0.0; winners 15.0 vs losers 0.0
- **Attack vs defense:** 55.4 attacks/game vs 10.3 monster sets/game (face-up summons 24.7); attacks into defense 5.1/game
- **Wall punish:** 1.35/game, 0.95 bank cards lost/game
- **Bank triggers:** 18.0/game (+31.57 unusable) → bank 168873, remove 9402, decline 1468
- **Jokers:** win rate by jokers cast — 0: 6.4% (249), 1: 20.5% (2649), 2+: 55.2% (17102)
- **Poly:** 2.29/game, bust 10.5%, stand 89.5%, avg stood total 15.8
- **Spells cast/game:** revive 4.59, J-rank 4.10, K-rank 4.04, poly 2.41, negate 1.97, snipe 1.70, Q-rank 1.49
- **K spells (R3):** 4.04/game, Ace-as-11 fuel 9.6% of casts, outright debuff kills 66.4% of casts (avg power destroyed 4.8)
- **Sac summons/game:** 1-sac 10.38, 2-sac 2.24 · milled cards/game 0.68

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 41% | 38% | 34% | 33% | 24% | 20% | 16% | 12% | 7% | 5% |
| mean turns until flip | 1.2 | 1.2 | 1.2 | 1.3 | 1.4 | 1.4 | 1.4 | 1.5 | 1.4 | 1.5 |

- **Showdown hands (all):** high card 50%, pair 0%, two pair 1%, three of a kind 0%, straight 0%, flush 1%, full house 24%, four of a kind 21%, straight flush 3%
- **Winning hands:** high card 0%, pair 0%, two pair 2%, three of a kind 0%, straight 1%, flush 2%, full house 48%, four of a kind 42%, straight flush 6%

### greedy vs turtle — config `baseline` (10000 games)

- **Turns:** median 43, p10 41, p90 45, p95 46, max 49
- **Outcomes:** greedy (seat 0) 99.4% · draws 0.6% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 12.7, seat1 mean 0.0; winners 12.8 vs losers 0.0
- **Attack vs defense:** 51.4 attacks/game vs 16.2 monster sets/game (face-up summons 17.2); attacks into defense 10.2/game
- **Wall punish:** 1.90/game, 1.54 bank cards lost/game
- **Bank triggers:** 14.2/game (+24.77 unusable) → bank 142225, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (10005), 1: 99.7% (373), 2+: 99.4% (9622)
- **Poly:** 2.22/game, bust 9.8%, stand 90.2%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.54, poly 2.22, revive 2.00, snipe 1.96, K-rank 0.95, negate 0.92
- **K spells (R3):** 0.95/game, Ace-as-11 fuel 37.6% of casts, outright debuff kills 98.7% of casts (avg power destroyed 3.5)
- **Sac summons/game:** 1-sac 10.10, 2-sac 2.61 · milled cards/game 0.33

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 65% | 61% | 59% | 15% | 20% | 28% | 1% | 3% | 20% |
| mean turns until flip | 1.4 | 1.7 | 1.9 | 2.1 | 2.8 | 3.5 | 4.0 | 2.8 | 4.7 | 4.4 |

- **Showdown hands (all):** high card 52%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 1%, full house 24%, four of a kind 15%, straight flush 1%
- **Winning hands:** high card 3%, pair 5%, two pair 6%, three of a kind 2%, straight 1%, flush 3%, full house 47%, four of a kind 30%, straight flush 3%

### random vs aggro — config `baseline` (10000 games)

- **Turns:** median 45, p10 43, p90 46, p95 47, max 50
- **Outcomes:** random (seat 0) 45.4% · draws 0.1% · stalls 0.00% · first-player wins 49.2% (of decided)
- **Banks:** seat0 mean 4.7, seat1 mean 6.2; winners 9.2 vs losers 1.7
- **Attack vs defense:** 27.8 attacks/game vs 9.8 monster sets/game (face-up summons 25.8); attacks into defense 6.3/game
- **Wall punish:** 4.11/game, 2.67 bank cards lost/game
- **Bank triggers:** 18.3/game (+1.63 unusable) → bank 152357, remove 16753, decline 13874
- **Jokers:** win rate by jokers cast — 0: 42.9% (170), 1: 45.5% (2228), 2+: 50.6% (17602)
- **Poly:** 0.67/game, bust 14.2%, stand 85.8%, avg stood total 8.5
- **Spells cast/game:** J-rank 5.77, revive 2.52, Q-rank 2.35, K-rank 2.35, poly 0.69, negate 0.39, snipe 0.32
- **K spells (R3):** 2.35/game, Ace-as-11 fuel 3.6% of casts, outright debuff kills 79.8% of casts (avg power destroyed 3.6)
- **Sac summons/game:** 1-sac 9.13, 2-sac 2.55 · milled cards/game 1.26

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 26% | 25% | 24% | 22% | 38% | 34% | 28% | 47% | 41% | 32% |
| mean turns until flip | 1.2 | 1.2 | 1.2 | 1.2 | 1.3 | 1.3 | 1.3 | 1.4 | 1.4 | 1.4 |

- **Showdown hands (all):** high card 47%, pair 15%, two pair 9%, three of a kind 3%, straight 3%, flush 2%, full house 11%, four of a kind 8%, straight flush 3%
- **Winning hands:** high card 11%, pair 19%, two pair 15%, three of a kind 5%, straight 5%, flush 3%, full house 22%, four of a kind 15%, straight flush 6%

### random vs banker — config `baseline` (10000 games)

- **Turns:** median 45, p10 42, p90 46, p95 47, max 49
- **Outcomes:** random (seat 0) 1.1% · draws 1.9% · stalls 0.00% · first-player wins 50.4% (of decided)
- **Banks:** seat0 mean 0.2, seat1 mean 13.4; winners 13.7 vs losers 0.2
- **Attack vs defense:** 23.7 attacks/game vs 23.0 monster sets/game (face-up summons 15.9); attacks into defense 5.3/game
- **Wall punish:** 2.32/game, 0.41 bank cards lost/game
- **Bank triggers:** 15.3/game (+2.28 unusable) → bank 145427, remove 5405, decline 1787
- **Jokers:** win rate by jokers cast — 0: 29.6% (169), 1: 35.5% (2280), 2+: 51.0% (17551)
- **Poly:** 0.54/game, bust 15.0%, stand 85.0%, avg stood total 8.8
- **Spells cast/game:** J-rank 2.73, revive 2.41, K-rank 2.37, Q-rank 2.29, poly 0.55, negate 0.34, snipe 0.34
- **K spells (R3):** 2.37/game, Ace-as-11 fuel 4.4% of casts, outright debuff kills 63.7% of casts (avg power destroyed 5.5)
- **Sac summons/game:** 1-sac 12.45, 2-sac 3.90 · milled cards/game 1.51

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 65% | 61% | 61% | 60% | 55% | 57% | 56% | 51% | 53% | 55% |
| mean turns until flip | 1.8 | 1.8 | 1.9 | 2.3 | 2.6 | 3.1 | 3.3 | 2.5 | 2.9 | 3.0 |

- **Showdown hands (all):** high card 54%, pair 3%, two pair 1%, three of a kind 2%, straight 0%, flush 0%, full house 6%, four of a kind 18%, straight flush 16%
- **Winning hands:** high card 6%, pair 6%, two pair 2%, three of a kind 4%, straight 1%, flush 0%, full house 12%, four of a kind 37%, straight flush 32%

### random vs greedy — config `baseline` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** random (seat 0) 0.1% · draws 0.0% · stalls 0.00% · first-player wins 50.2% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 14.9; winners 14.9 vs losers 0.0
- **Attack vs defense:** 55.3 attacks/game vs 10.3 monster sets/game (face-up summons 24.7); attacks into defense 5.1/game
- **Wall punish:** 1.36/game, 0.95 bank cards lost/game
- **Bank triggers:** 17.9/game (+31.56 unusable) → bank 168452, remove 9256, decline 1378
- **Jokers:** win rate by jokers cast — 0: 6.0% (250), 1: 21.7% (2614), 2+: 55.0% (17136)
- **Poly:** 2.28/game, bust 10.4%, stand 89.6%, avg stood total 15.8
- **Spells cast/game:** revive 4.61, J-rank 4.12, K-rank 4.04, poly 2.39, negate 1.97, snipe 1.71, Q-rank 1.49
- **K spells (R3):** 4.04/game, Ace-as-11 fuel 9.2% of casts, outright debuff kills 65.8% of casts (avg power destroyed 4.8)
- **Sac summons/game:** 1-sac 10.36, 2-sac 2.27 · milled cards/game 0.68

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 41% | 38% | 35% | 32% | 24% | 19% | 16% | 11% | 8% | 5% |
| mean turns until flip | 1.2 | 1.2 | 1.2 | 1.3 | 1.4 | 1.4 | 1.4 | 1.5 | 1.5 | 1.5 |

- **Showdown hands (all):** high card 50%, pair 0%, two pair 1%, three of a kind 0%, straight 1%, flush 1%, full house 24%, four of a kind 21%, straight flush 3%
- **Winning hands:** high card 0%, pair 0%, two pair 2%, three of a kind 0%, straight 1%, flush 2%, full house 48%, four of a kind 41%, straight flush 5%

### random vs random — config `baseline` (10000 games)

- **Turns:** median 44, p10 42, p90 46, p95 46, max 49
- **Outcomes:** random (seat 0) 45.9% · draws 7.5% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 1.6, seat1 mean 1.6; winners 2.9 vs losers 0.5
- **Attack vs defense:** 13.8 attacks/game vs 20.4 monster sets/game (face-up summons 20.4); attacks into defense 5.5/game
- **Wall punish:** 3.16/game, 1.39 bank cards lost/game
- **Bank triggers:** 7.0/game (+0.08 unusable) → bank 51833, remove 6066, decline 12465
- **Jokers:** win rate by jokers cast — 0: 37.4% (235), 1: 43.3% (3018), 2+: 46.9% (16747)
- **Poly:** 1.14/game, bust 14.0%, stand 86.0%, avg stood total 8.7
- **Spells cast/game:** J-rank 4.93, revive 4.88, Q-rank 4.19, K-rank 4.14, poly 1.21, snipe 1.19, negate 0.93
- **K spells (R3):** 4.14/game, Ace-as-11 fuel 4.5% of casts, outright debuff kills 72.9% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 14.13, 2-sac 4.70 · milled cards/game 2.19

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% |
| mean turns until flip | 1.6 | 1.6 | 1.6 | 1.6 | 1.7 | 1.6 | 1.7 | 1.7 | 1.7 | 1.7 |

- **Showdown hands (all):** high card 87%, pair 10%, two pair 2%, three of a kind 1%, straight 0%, flush 0%, full house 0%, four of a kind 0%
- **Winning hands:** high card 71%, pair 22%, two pair 4%, three of a kind 2%, straight 1%, flush 0%, full house 1%, four of a kind 0%

### random vs turtle — config `baseline` (10000 games)

- **Turns:** median 46, p10 43, p90 47, p95 48, max 50
- **Outcomes:** random (seat 0) 2.5% · draws 92.0% · stalls 0.00% · first-player wins 48.9% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 0.1; winners 1.4 vs losers 0.0
- **Attack vs defense:** 11.0 attacks/game vs 30.1 monster sets/game (face-up summons 10.7); attacks into defense 9.1/game
- **Wall punish:** 5.25/game, 0.22 bank cards lost/game
- **Bank triggers:** 0.4/game (+0.00 unusable) → bank 3348, remove 16, decline 637
- **Jokers:** win rate by jokers cast — 0: 5.5% (10054), 1: 2.1% (1198), 2+: 2.6% (8748)
- **Poly:** 0.74/game, bust 14.2%, stand 85.8%, avg stood total 8.8
- **Spells cast/game:** J-rank 2.51, revive 2.42, Q-rank 2.10, snipe 1.72, K-rank 1.51, poly 0.76, negate 0.37
- **K spells (R3):** 1.51/game, Ace-as-11 fuel 5.7% of casts, outright debuff kills 62.6% of casts (avg power destroyed 5.0)
- **Sac summons/game:** 1-sac 12.70, 2-sac 5.35 · milled cards/game 1.73

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 76% | 77% | 78% | 63% | 69% | 75% | 52% | 57% | 78% |
| mean turns until flip | 2.3 | 3.0 | 3.4 | 3.9 | 3.2 | 4.5 | 5.6 | 2.3 | 2.9 | 5.1 |

- **Showdown hands (all):** high card 100%, pair 0%, two pair 0%, three of a kind 0%, four of a kind 0%
- **Winning hands:** high card 89%, pair 9%, two pair 0%, three of a kind 1%, four of a kind 0%

### turtle vs aggro — config `baseline` (10000 games)

- **Turns:** median 46, p10 44, p90 47, p95 47, max 50
- **Outcomes:** turtle (seat 0) 0.0% · draws 68.9% · stalls 0.00% · first-player wins 55.0% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 2.5; winners 7.9 vs losers 0.0
- **Attack vs defense:** 25.4 attacks/game vs 18.0 monster sets/game (face-up summons 16.6); attacks into defense 16.1/game
- **Wall punish:** 10.39/game, 3.35 bank cards lost/game
- **Bank triggers:** 5.8/game (+0.88 unusable) → bank 58135, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.1% (10026), 1: 28.4% (747), 2+: 31.4% (9227)
- **Spells cast/game:** J-rank 3.22
- **Sac summons/game:** 1-sac 6.75, 2-sac 1.86 · milled cards/game 0.87

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 54% | 52% | 50% | 50% | 53% | 49% | 51% | 66% | 49% | 64% |
| mean turns until flip | 1.3 | 1.5 | 1.7 | 1.9 | 2.4 | 3.0 | 3.2 | 2.0 | 2.7 | 3.0 |

- **Showdown hands (all):** high card 88%, pair 3%, two pair 2%, three of a kind 1%, straight 1%, flush 1%, full house 4%, four of a kind 2%, straight flush 1%
- **Winning hands:** high card 23%, pair 16%, two pair 11%, three of a kind 4%, straight 4%, flush 4%, full house 23%, four of a kind 12%, straight flush 4%

### turtle vs banker — config `baseline` (10000 games)

- **Turns:** median 47, p10 46, p90 48, p95 49, max 50
- **Outcomes:** turtle (seat 0) 0.0% · draws 89.2% · stalls 0.00% · first-player wins 30.6% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 0.3; winners 2.3 vs losers 0.0
- **Attack vs defense:** 0.3 attacks/game vs 26.4 monster sets/game (face-up summons 0.6); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 0.3/game (+0.00 unusable) → bank 2539, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.0% (10000), 1: 8.5% (352), 2+: 10.9% (9648)
- **Sac summons/game:** 1-sac 11.15, 2-sac 2.92 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 98% | 96% | 95% | 94% | 100% | 99% | 100% | 100% | 100% | 100% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** high card 98%, pair 1%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%
- **Winning hands:** high card 72%, pair 18%, two pair 4%, three of a kind 2%, straight 1%, flush 0%, full house 1%, four of a kind 0%

### turtle vs greedy — config `baseline` (10000 games)

- **Turns:** median 43, p10 41, p90 45, p95 46, max 49
- **Outcomes:** turtle (seat 0) 0.0% · draws 0.5% · stalls 0.00% · first-player wins 50.3% (of decided)
- **Banks:** seat0 mean 0.0, seat1 mean 12.8; winners 12.9 vs losers 0.0
- **Attack vs defense:** 52.1 attacks/game vs 16.1 monster sets/game (face-up summons 17.2); attacks into defense 10.3/game
- **Wall punish:** 1.92/game, 1.55 bank cards lost/game
- **Bank triggers:** 14.4/game (+25.18 unusable) → bank 143981, remove 0, decline 0
- **Jokers:** win rate by jokers cast — 0: 0.1% (10008), 1: 99.7% (398), 2+: 99.5% (9594)
- **Poly:** 2.22/game, bust 10.0%, stand 90.0%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.51, poly 2.22, revive 2.03, snipe 1.96, K-rank 0.95, negate 0.92
- **K spells (R3):** 0.95/game, Ace-as-11 fuel 37.4% of casts, outright debuff kills 98.6% of casts (avg power destroyed 3.5)
- **Sac summons/game:** 1-sac 10.00, 2-sac 2.62 · milled cards/game 0.33

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 65% | 61% | 60% | 15% | 19% | 28% | 1% | 3% | 19% |
| mean turns until flip | 1.4 | 1.7 | 1.9 | 2.1 | 2.7 | 3.4 | 4.0 | 3.6 | 4.0 | 4.6 |

- **Showdown hands (all):** high card 52%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 1%, full house 23%, four of a kind 16%, straight flush 1%
- **Winning hands:** high card 3%, pair 4%, two pair 6%, three of a kind 2%, straight 1%, flush 3%, full house 47%, four of a kind 31%, straight flush 3%

### turtle vs random — config `baseline` (10000 games)

- **Turns:** median 46, p10 43, p90 47, p95 48, max 50
- **Outcomes:** turtle (seat 0) 5.1% · draws 92.3% · stalls 0.00% · first-player wins 47.5% (of decided)
- **Banks:** seat0 mean 0.1, seat1 mean 0.0; winners 1.4 vs losers 0.0
- **Attack vs defense:** 11.0 attacks/game vs 30.0 monster sets/game (face-up summons 10.7); attacks into defense 9.1/game
- **Wall punish:** 5.29/game, 0.21 bank cards lost/game
- **Bank triggers:** 0.4/game (+0.00 unusable) → bank 3235, remove 18, decline 674
- **Jokers:** win rate by jokers cast — 0: 5.1% (10066), 1: 1.6% (1241), 2+: 2.7% (8693)
- **Poly:** 0.74/game, bust 15.0%, stand 85.0%, avg stood total 8.8
- **Spells cast/game:** J-rank 2.49, revive 2.42, Q-rank 2.11, snipe 1.70, K-rank 1.52, poly 0.76, negate 0.36
- **K spells (R3):** 1.52/game, Ace-as-11 fuel 5.9% of casts, outright debuff kills 63.8% of casts (avg power destroyed 5.0)
- **Sac summons/game:** 1-sac 12.68, 2-sac 5.35 · milled cards/game 1.73

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 80% | 76% | 77% | 78% | 63% | 68% | 74% | 52% | 56% | 80% |
| mean turns until flip | 2.3 | 2.9 | 3.4 | 3.9 | 3.3 | 4.5 | 5.6 | 2.3 | 3.0 | 5.0 |

- **Showdown hands (all):** high card 100%, pair 0%, two pair 0%, three of a kind 0%, full house 0%, four of a kind 0%
- **Winning hands:** high card 90%, pair 9%, two pair 1%, three of a kind 0%, full house 0%, four of a kind 0%

### turtle vs turtle — config `baseline` (10000 games)

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

- **Showdown hands (all):** high card 100%
