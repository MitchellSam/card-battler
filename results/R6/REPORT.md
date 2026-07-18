# Sim report — `results/R6`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| bankScaleMargin | banker vs banker | 10000 | 46 | 46 | 47 | 49 | 0.00% | 25.7% | 12.9% | 49.1% |
| bankScaleMargin | banker vs greedy | 10000 | 43 | 40 | 45 | 49 | 0.00% | 3.5% | 50.1% | 0.0% |
| bankScaleMargin | greedy vs banker | 10000 | 43 | 40 | 45 | 49 | 0.00% | 96.6% | 49.9% | 0.0% |
| bankScaleMargin | greedy vs greedy | 10000 | 42 | 40 | 45 | 48 | 0.00% | 49.8% | 48.2% | 0.0% |
| bankScalePower | banker vs banker | 10000 | 46 | 46 | 47 | 49 | 0.00% | 25.6% | 13.0% | 49.1% |
| bankScalePower | banker vs greedy | 10000 | 43 | 40 | 45 | 49 | 0.00% | 5.0% | 50.3% | 0.0% |
| bankScalePower | greedy vs banker | 10000 | 43 | 40 | 45 | 49 | 0.00% | 95.1% | 49.7% | 0.0% |
| bankScalePower | greedy vs greedy | 10000 | 42 | 40 | 45 | 48 | 0.00% | 48.6% | 48.7% | 0.0% |
| baseline | banker vs banker | 10000 | 46 | 46 | 47 | 49 | 0.00% | 25.6% | 12.8% | 49.1% |
| baseline | banker vs greedy | 10000 | 43 | 40 | 45 | 48 | 0.00% | 3.3% | 50.2% | 0.0% |
| baseline | greedy vs banker | 10000 | 43 | 40 | 45 | 49 | 0.00% | 96.6% | 49.8% | 0.0% |
| baseline | greedy vs greedy | 10000 | 43 | 40 | 45 | 48 | 0.00% | 49.7% | 46.8% | 0.0% |

#### Win-rate matrix — config `bankScaleMargin` (row agent vs column agent, both seats pooled; draws count against)

| | banker | greedy |
|---|---|---|
| **banker** | 25.4% | 3.5% |
| **greedy** | 96.5% | 50.0% |

#### Win-rate matrix — config `bankScalePower` (row agent vs column agent, both seats pooled; draws count against)

| | banker | greedy |
|---|---|---|
| **banker** | 25.4% | 5.0% |
| **greedy** | 95.0% | 50.0% |

#### Win-rate matrix — config `baseline` (row agent vs column agent, both seats pooled; draws count against)

| | banker | greedy |
|---|---|---|
| **banker** | 25.4% | 3.3% |
| **greedy** | 96.7% | 50.0% |

## Matchup detail

### banker vs banker — config `bankScaleMargin` (10000 games)

- **Turns:** median 46, p10 46, p90 47, p95 47, max 49
- **Outcomes:** banker (seat 0) 25.7% · draws 49.1% · stalls 0.00% · first-player wins 12.9% (of decided)
- **Banks:** seat0 mean 0.6, seat1 mean 0.6; winners 2.3 vs losers 0.0
- **Attack vs defense:** 1.0 attacks/game vs 25.9 monster sets/game (face-up summons 1.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 1.0/game (+0.04 unusable) → bank 12340, remove 57, decline 0
- **Jokers:** win rate by jokers cast — 0: 15.9% (82), 1: 16.9% (1278), 2+: 26.1% (18640)
- **Sac summons/game:** 1-sac 10.39, 2-sac 3.42 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 97% | 91% | 88% | 82% | 99% | 99% | 98% | 100% | 100% | 100% |
| mean turns until flip | 2.0 | 2.0 | — | 2.0 | 6.0 | — | 6.0 | — | — | — |

- **Showdown hands (all):** high card 94%, pair 3%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%
- **Winning hands:** high card 77%, pair 13%, two pair 4%, three of a kind 2%, straight 1%, flush 1%, full house 2%, four of a kind 0%, straight flush 0%

### banker vs greedy — config `bankScaleMargin` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** banker (seat 0) 3.5% · draws 0.0% · stalls 0.00% · first-player wins 50.1% (of decided)
- **Banks:** seat0 mean 0.2, seat1 mean 13.5; winners 13.6 vs losers 0.2
- **Attack vs defense:** 52.1 attacks/game vs 15.8 monster sets/game (face-up summons 17.3); attacks into defense 8.7/game
- **Wall punish:** 1.70/game, 1.61 bank cards lost/game
- **Bank triggers:** 12.7/game (+28.58 unusable) → bank 165857, remove 12288, decline 0
- **Jokers:** win rate by jokers cast — 0: 16.4% (140), 1: 28.8% (1912), 2+: 52.5% (17948)
- **Poly:** 2.09/game, bust 9.8%, stand 90.2%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.43, poly 2.09, revive 2.06, K-rank 1.78, negate 1.11
- **K spells (R3):** 1.78/game, Ace-as-11 fuel 29.5% of casts, outright debuff kills 94.2% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 9.97, 2-sac 2.54 · milled cards/game 0.56

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 78% | 62% | 59% | 58% | 24% | 27% | 28% | 6% | 3% | 5% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.4 | 2.1 | 2.8 | 3.2 | 4.0 | 2.1 | 2.2 |

- **Showdown hands (all):** high card 50%, pair 1%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 25%, four of a kind 15%, straight flush 2%
- **Winning hands:** high card 2%, pair 3%, two pair 6%, three of a kind 1%, straight 2%, flush 4%, full house 50%, four of a kind 29%, straight flush 4%

### greedy vs banker — config `bankScaleMargin` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** greedy (seat 0) 96.6% · draws 0.0% · stalls 0.00% · first-player wins 49.9% (of decided)
- **Banks:** seat0 mean 13.5, seat1 mean 0.3; winners 13.6 vs losers 0.2
- **Attack vs defense:** 52.3 attacks/game vs 15.8 monster sets/game (face-up summons 17.3); attacks into defense 8.7/game
- **Wall punish:** 1.69/game, 1.61 bank cards lost/game
- **Bank triggers:** 12.7/game (+28.72 unusable) → bank 165732, remove 12022, decline 0
- **Jokers:** win rate by jokers cast — 0: 14.9% (148), 1: 29.5% (1933), 2+: 52.5% (17919)
- **Poly:** 2.08/game, bust 9.6%, stand 90.4%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.46, poly 2.08, revive 2.05, K-rank 1.79, negate 1.11
- **K spells (R3):** 1.79/game, Ace-as-11 fuel 29.1% of casts, outright debuff kills 94.5% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 10.00, 2-sac 2.54 · milled cards/game 0.55

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 78% | 62% | 59% | 57% | 24% | 27% | 28% | 6% | 3% | 6% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.4 | 2.1 | 2.8 | 3.1 | 3.7 | 2.2 | 2.2 |

- **Showdown hands (all):** high card 50%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 25%, four of a kind 14%, straight flush 2%
- **Winning hands:** high card 1%, pair 3%, two pair 6%, three of a kind 1%, straight 2%, flush 4%, full house 51%, four of a kind 28%, straight flush 4%

### greedy vs greedy — config `bankScaleMargin` (10000 games)

- **Turns:** median 42, p10 40, p90 45, p95 45, max 48
- **Outcomes:** greedy (seat 0) 49.8% · draws 0.0% · stalls 0.00% · first-player wins 48.2% (of decided)
- **Banks:** seat0 mean 6.4, seat1 mean 6.5; winners 10.7 vs losers 2.2
- **Attack vs defense:** 33.7 attacks/game vs 17.1 monster sets/game (face-up summons 18.6); attacks into defense 6.7/game
- **Wall punish:** 1.03/game, 0.99 bank cards lost/game
- **Bank triggers:** 15.9/game (+9.58 unusable) → bank 183018, remove 44266, decline 0
- **Jokers:** win rate by jokers cast — 0: 43.9% (139), 1: 45.8% (1826), 2+: 50.5% (18035)
- **Poly:** 2.42/game, bust 10.6%, stand 89.4%, avg stood total 16.7
- **Spells cast/game:** K-rank 4.95, J-rank 4.59, revive 4.47, poly 2.60, negate 2.24, snipe 1.63
- **K spells (R3):** 4.95/game, Ace-as-11 fuel 27.6% of casts, outright debuff kills 87.3% of casts (avg power destroyed 6.6)
- **Sac summons/game:** 1-sac 11.57, 2-sac 1.61 · milled cards/game 0.87

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 69% | 60% | 56% | 55% | 32% | 36% | 32% | 9% | 1% | 1% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.4 | 1.7 | 1.6 | 1.6 | 1.6 | 2.4 | 2.0 |

- **Showdown hands (all):** high card 37%, pair 7%, two pair 7%, three of a kind 3%, straight 2%, flush 1%, full house 27%, four of a kind 15%, straight flush 1%
- **Winning hands:** high card 1%, pair 3%, two pair 8%, three of a kind 3%, straight 3%, flush 2%, full house 49%, four of a kind 29%, straight flush 2%

### banker vs banker — config `bankScalePower` (10000 games)

- **Turns:** median 46, p10 46, p90 47, p95 47, max 49
- **Outcomes:** banker (seat 0) 25.6% · draws 49.1% · stalls 0.00% · first-player wins 13.0% (of decided)
- **Banks:** seat0 mean 0.6, seat1 mean 0.6; winners 2.3 vs losers 0.0
- **Attack vs defense:** 1.0 attacks/game vs 25.9 monster sets/game (face-up summons 1.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 1.0/game (+0.04 unusable) → bank 12454, remove 66, decline 0
- **Jokers:** win rate by jokers cast — 0: 15.9% (82), 1: 16.9% (1278), 2+: 26.1% (18640)
- **Sac summons/game:** 1-sac 10.39, 2-sac 3.42 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 97% | 91% | 88% | 82% | 99% | 99% | 98% | 100% | 100% | 100% |
| mean turns until flip | 2.0 | 2.0 | — | 2.0 | 6.0 | — | 6.0 | — | — | — |

- **Showdown hands (all):** high card 94%, pair 3%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%
- **Winning hands:** high card 77%, pair 13%, two pair 4%, three of a kind 2%, straight 1%, flush 1%, full house 2%, four of a kind 0%, straight flush 0%

### banker vs greedy — config `bankScalePower` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** banker (seat 0) 5.0% · draws 0.0% · stalls 0.00% · first-player wins 50.3% (of decided)
- **Banks:** seat0 mean 0.5, seat1 mean 13.5; winners 13.7 vs losers 0.3
- **Attack vs defense:** 51.8 attacks/game vs 15.9 monster sets/game (face-up summons 17.2); attacks into defense 8.7/game
- **Wall punish:** 1.66/game, 1.58 bank cards lost/game
- **Bank triggers:** 12.8/game (+28.29 unusable) → bank 172647, remove 17180, decline 0
- **Jokers:** win rate by jokers cast — 0: 16.8% (137), 1: 29.2% (1912), 2+: 52.5% (17951)
- **Poly:** 2.07/game, bust 9.9%, stand 90.1%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.45, poly 2.08, revive 2.05, K-rank 1.79, negate 1.11
- **K spells (R3):** 1.79/game, Ace-as-11 fuel 29.3% of casts, outright debuff kills 93.9% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 10.05, 2-sac 2.54 · milled cards/game 0.58

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 78% | 62% | 59% | 58% | 25% | 27% | 28% | 6% | 3% | 5% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.4 | 2.2 | 2.8 | 3.2 | 4.0 | 2.1 | 2.2 |

- **Showdown hands (all):** high card 49%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 25%, four of a kind 15%, straight flush 2%
- **Winning hands:** high card 1%, pair 2%, two pair 5%, three of a kind 1%, straight 2%, flush 4%, full house 50%, four of a kind 29%, straight flush 4%

### greedy vs banker — config `bankScalePower` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** greedy (seat 0) 95.1% · draws 0.0% · stalls 0.00% · first-player wins 49.7% (of decided)
- **Banks:** seat0 mean 13.5, seat1 mean 0.5; winners 13.7 vs losers 0.3
- **Attack vs defense:** 51.9 attacks/game vs 16.0 monster sets/game (face-up summons 17.3); attacks into defense 8.7/game
- **Wall punish:** 1.66/game, 1.59 bank cards lost/game
- **Bank triggers:** 12.8/game (+28.36 unusable) → bank 172540, remove 16834, decline 0
- **Jokers:** win rate by jokers cast — 0: 18.1% (155), 1: 30.1% (1918), 2+: 52.4% (17927)
- **Poly:** 2.08/game, bust 9.6%, stand 90.4%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.47, poly 2.08, revive 2.05, K-rank 1.80, negate 1.11
- **K spells (R3):** 1.80/game, Ace-as-11 fuel 29.2% of casts, outright debuff kills 94.3% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 10.08, 2-sac 2.53 · milled cards/game 0.56

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 78% | 62% | 59% | 57% | 24% | 27% | 29% | 6% | 3% | 6% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.4 | 2.1 | 2.9 | 3.2 | 3.1 | 2.2 | 2.3 |

- **Showdown hands (all):** high card 49%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 25%, four of a kind 15%, straight flush 2%
- **Winning hands:** high card 1%, pair 3%, two pair 6%, three of a kind 1%, straight 2%, flush 4%, full house 50%, four of a kind 29%, straight flush 4%

### greedy vs greedy — config `bankScalePower` (10000 games)

- **Turns:** median 42, p10 40, p90 45, p95 45, max 48
- **Outcomes:** greedy (seat 0) 48.6% · draws 0.0% · stalls 0.00% · first-player wins 48.7% (of decided)
- **Banks:** seat0 mean 6.8, seat1 mean 7.0; winners 11.1 vs losers 2.7
- **Attack vs defense:** 33.9 attacks/game vs 17.2 monster sets/game (face-up summons 18.4); attacks into defense 6.7/game
- **Wall punish:** 1.00/game, 0.97 bank cards lost/game
- **Bank triggers:** 15.7/game (+9.94 unusable) → bank 209997, remove 61978, decline 0
- **Jokers:** win rate by jokers cast — 0: 50.7% (142), 1: 46.6% (1868), 2+: 50.4% (17990)
- **Poly:** 2.44/game, bust 10.4%, stand 89.6%, avg stood total 16.7
- **Spells cast/game:** K-rank 4.88, J-rank 4.58, revive 4.50, poly 2.61, negate 2.25, snipe 1.64
- **K spells (R3):** 4.88/game, Ace-as-11 fuel 26.9% of casts, outright debuff kills 86.9% of casts (avg power destroyed 6.6)
- **Sac summons/game:** 1-sac 11.48, 2-sac 1.59 · milled cards/game 0.88

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 68% | 61% | 56% | 55% | 32% | 37% | 33% | 8% | 1% | 1% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.4 | 1.7 | 1.6 | 1.6 | 1.5 | 2.2 | 1.9 |

- **Showdown hands (all):** high card 34%, pair 7%, two pair 8%, three of a kind 3%, straight 2%, flush 2%, full house 27%, four of a kind 15%, straight flush 1%
- **Winning hands:** high card 1%, pair 2%, two pair 8%, three of a kind 3%, straight 3%, flush 3%, full house 48%, four of a kind 30%, straight flush 3%

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
- **Outcomes:** banker (seat 0) 3.3% · draws 0.0% · stalls 0.00% · first-player wins 50.2% (of decided)
- **Banks:** seat0 mean 0.2, seat1 mean 13.1; winners 13.1 vs losers 0.2
- **Attack vs defense:** 52.6 attacks/game vs 15.8 monster sets/game (face-up summons 17.5); attacks into defense 8.7/game
- **Wall punish:** 1.71/game, 1.60 bank cards lost/game
- **Bank triggers:** 16.6/game (+25.24 unusable) → bank 157470, remove 8348, decline 0
- **Jokers:** win rate by jokers cast — 0: 14.2% (148), 1: 29.1% (1911), 2+: 52.5% (17941)
- **Poly:** 2.09/game, bust 10.0%, stand 90.0%, avg stood total 16.5
- **Spells cast/game:** J-rank 2.45, poly 2.09, revive 2.02, K-rank 1.81, negate 1.09
- **K spells (R3):** 1.81/game, Ace-as-11 fuel 29.5% of casts, outright debuff kills 94.4% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 10.15, 2-sac 2.50 · milled cards/game 0.57

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 61% | 58% | 57% | 24% | 26% | 27% | 6% | 3% | 6% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.4 | 2.1 | 2.7 | 3.0 | 3.5 | 2.1 | 2.2 |

- **Showdown hands (all):** high card 51%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 25%, four of a kind 14%, straight flush 2%
- **Winning hands:** high card 2%, pair 3%, two pair 6%, three of a kind 1%, straight 2%, flush 4%, full house 49%, four of a kind 29%, straight flush 3%

### greedy vs banker — config `baseline` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 46, max 49
- **Outcomes:** greedy (seat 0) 96.6% · draws 0.0% · stalls 0.00% · first-player wins 49.8% (of decided)
- **Banks:** seat0 mean 13.1, seat1 mean 0.2; winners 13.1 vs losers 0.2
- **Attack vs defense:** 52.6 attacks/game vs 15.8 monster sets/game (face-up summons 17.5); attacks into defense 8.7/game
- **Wall punish:** 1.70/game, 1.60 bank cards lost/game
- **Bank triggers:** 16.5/game (+25.30 unusable) → bank 157141, remove 8156, decline 0
- **Jokers:** win rate by jokers cast — 0: 18.4% (158), 1: 29.6% (1925), 2+: 52.5% (17917)
- **Poly:** 2.09/game, bust 9.8%, stand 90.2%, avg stood total 16.4
- **Spells cast/game:** J-rank 2.48, poly 2.09, revive 2.02, K-rank 1.80, negate 1.10
- **K spells (R3):** 1.80/game, Ace-as-11 fuel 29.2% of casts, outright debuff kills 94.6% of casts (avg power destroyed 4.3)
- **Sac summons/game:** 1-sac 10.17, 2-sac 2.50 · milled cards/game 0.55

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 79% | 61% | 59% | 57% | 23% | 26% | 27% | 7% | 3% | 6% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.4 | 2.1 | 2.8 | 3.1 | 3.3 | 2.2 | 2.2 |

- **Showdown hands (all):** high card 51%, pair 2%, two pair 3%, three of a kind 1%, straight 1%, flush 2%, full house 25%, four of a kind 14%, straight flush 2%
- **Winning hands:** high card 2%, pair 4%, two pair 6%, three of a kind 2%, straight 1%, flush 4%, full house 50%, four of a kind 28%, straight flush 3%

### greedy vs greedy — config `baseline` (10000 games)

- **Turns:** median 43, p10 40, p90 45, p95 45, max 48
- **Outcomes:** greedy (seat 0) 49.7% · draws 0.0% · stalls 0.00% · first-player wins 46.8% (of decided)
- **Banks:** seat0 mean 5.9, seat1 mean 6.0; winners 9.7 vs losers 2.3
- **Attack vs defense:** 33.7 attacks/game vs 17.2 monster sets/game (face-up summons 18.9); attacks into defense 6.6/game
- **Wall punish:** 1.04/game, 1.01 bank cards lost/game
- **Bank triggers:** 18.3/game (+7.16 unusable) → bank 156342, remove 26803, decline 0
- **Jokers:** win rate by jokers cast — 0: 51.8% (141), 1: 44.7% (1854), 2+: 50.5% (18005)
- **Poly:** 2.41/game, bust 10.4%, stand 89.6%, avg stood total 16.7
- **Spells cast/game:** K-rank 5.01, J-rank 4.60, revive 4.45, poly 2.58, negate 2.22, snipe 1.63
- **K spells (R3):** 5.01/game, Ace-as-11 fuel 27.9% of casts, outright debuff kills 87.6% of casts (avg power destroyed 6.7)
- **Sac summons/game:** 1-sac 11.91, 2-sac 1.55 · milled cards/game 0.89

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 70% | 59% | 55% | 55% | 33% | 35% | 31% | 11% | 1% | 1% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.4 | 1.7 | 1.6 | 1.6 | 1.5 | 2.3 | 2.4 |

- **Showdown hands (all):** high card 38%, pair 9%, two pair 7%, three of a kind 3%, straight 2%, flush 1%, full house 25%, four of a kind 13%, straight flush 1%
- **Winning hands:** high card 4%, pair 6%, two pair 9%, three of a kind 4%, straight 3%, flush 2%, full house 46%, four of a kind 25%, straight flush 1%
