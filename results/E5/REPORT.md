# Sim report — `results/E5`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| deckOutFailedDraw | aggro vs aggro | 10000 | 92 | 92 | 92 | 94 | 0.00% | 50.2% | 44.6% | 0.0% |
| deckOutFailedDraw | banker vs banker | 10000 | 92 | 92 | 92 | 94 | 0.00% | 49.6% | 66.0% | 0.9% |
| deckOutFailedDraw | banker vs greedy | 10000 | 81 | 75 | 86 | 92 | 0.00% | 7.8% | 48.8% | 0.1% |
| deckOutFailedDraw | greedy vs banker | 10000 | 81 | 75 | 85 | 92 | 0.00% | 91.8% | 48.5% | 0.1% |
| deckOutFailedDraw | greedy vs greedy | 10000 | 79 | 73 | 84 | 92 | 0.00% | 50.7% | 46.2% | 0.4% |

#### Win-rate matrix — config `deckOutFailedDraw` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | banker | greedy |
|---|---|---|---|
| **aggro** | 50.0% | — | — |
| **banker** | — | 49.5% | 7.9% |
| **greedy** | — | 92.0% | 49.8% |

## Matchup detail

### aggro vs aggro — config `deckOutFailedDraw` (10000 games)

- **Turns:** median 92, p10 92, p90 92, p95 92, max 94
- **Outcomes:** aggro (seat 0) 50.2% · draws 0.0% · stalls 0.00% · first-player wins 44.6% (of decided)
- **Banks:** seat0 mean 13.7, seat1 mean 13.6; winners 27.2 vs losers 0.1
- **Attack vs defense:** 144.6 attacks/game vs 0.0 monster sets/game (face-up summons 38.7); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 38.6/game (+105.49 unusable) → bank 329709, remove 56360, decline 0
- **Jokers:** win rate by jokers cast — 0: 43.3% (60), 1: 47.1% (1008), 2+: 50.2% (18932)
- **Spells cast/game:** J-rank 4.73
- **Sac summons/game:** 1-sac 7.21, 2-sac 2.23 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| mean turns until flip | — | — | — | — | — | — | — | — | — | — |

- **Showdown hands (all):** partial hand 49%, high card 0%, pair 0%, two pair 0%, three of a kind 0%, straight 0%, flush 0%, full house 1%, four of a kind 4%, straight flush 46%
- **Winning hands:** pair 0%, two pair 0%, full house 1%, four of a kind 8%, straight flush 91%

### banker vs banker — config `deckOutFailedDraw` (10000 games)

- **Turns:** median 92, p10 92, p90 92, p95 92, max 94
- **Outcomes:** banker (seat 0) 49.6% · draws 0.9% · stalls 0.00% · first-player wins 66.0% (of decided)
- **Banks:** seat0 mean 1.3, seat1 mean 1.2; winners 2.1 vs losers 0.4
- **Attack vs defense:** 3.3 attacks/game vs 28.0 monster sets/game (face-up summons 2.2); attacks into defense 0.0/game
- **Wall punish:** 0.00/game, 0.00 bank cards lost/game
- **Bank triggers:** 2.7/game (+0.61 unusable) → bank 26008, remove 1048, decline 0
- **Jokers:** win rate by jokers cast — 0: 57.4% (61), 1: 56.6% (1009), 2+: 49.1% (18930)
- **Sac summons/game:** 1-sac 11.94, 2-sac 3.88 · milled cards/game 0.00

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 95% | 91% | 87% | 81% | 97% | 97% | 97% | 97% | 98% | 98% |
| mean turns until flip | 2.0 | 1.7 | 2.0 | 2.4 | 7.0 | 5.4 | 12.0 | — | — | — |

- **Showdown hands (all):** partial hand 92%, high card 2%, pair 3%, two pair 2%, three of a kind 0%, straight 1%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%
- **Winning hands:** partial hand 85%, high card 3%, pair 6%, two pair 3%, three of a kind 1%, straight 1%, flush 0%, full house 1%, four of a kind 0%, straight flush 0%

### banker vs greedy — config `deckOutFailedDraw` (10000 games)

- **Turns:** median 81, p10 75, p90 86, p95 87, max 92
- **Outcomes:** banker (seat 0) 7.8% · draws 0.1% · stalls 0.00% · first-player wins 48.8% (of decided)
- **Banks:** seat0 mean 0.9, seat1 mean 8.1; winners 8.8 vs losers 0.3
- **Attack vs defense:** 106.4 attacks/game vs 20.2 monster sets/game (face-up summons 22.2); attacks into defense 12.5/game
- **Wall punish:** 1.94/game, 1.85 bank cards lost/game
- **Bank triggers:** 16.1/game (+75.83 unusable) → bank 134926, remove 26150, decline 0
- **Jokers:** win rate by jokers cast — 0: 46.9% (373), 1: 51.1% (3702), 2+: 49.8% (15925)
- **Poly:** 1.99/game, bust 7.7%, stand 90.4%, avg stood total 17.1
- **Spells cast/game:** J-rank 2.21, revive 2.18, poly 1.99, negate 1.41, K-rank 1.27
- **Sac summons/game:** 1-sac 12.97, 2-sac 4.57 · milled cards/game 1.57

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 70% | 64% | 62% | 59% | 32% | 31% | 29% | 11% | 9% | 11% |
| mean turns until flip | 1.2 | 1.2 | 1.3 | 1.4 | 2.5 | 3.3 | 3.4 | 3.7 | 4.4 | 3.9 |

- **Showdown hands (all):** partial hand 55%, high card 2%, pair 6%, two pair 11%, three of a kind 2%, straight 1%, flush 2%, full house 17%, four of a kind 5%, straight flush 1%
- **Winning hands:** partial hand 11%, high card 3%, pair 11%, two pair 21%, three of a kind 4%, straight 2%, flush 4%, full house 33%, four of a kind 10%, straight flush 1%

### greedy vs banker — config `deckOutFailedDraw` (10000 games)

- **Turns:** median 81, p10 75, p90 85, p95 87, max 92
- **Outcomes:** greedy (seat 0) 91.8% · draws 0.1% · stalls 0.00% · first-player wins 48.5% (of decided)
- **Banks:** seat0 mean 8.1, seat1 mean 0.9; winners 8.8 vs losers 0.3
- **Attack vs defense:** 106.3 attacks/game vs 20.2 monster sets/game (face-up summons 22.1); attacks into defense 12.6/game
- **Wall punish:** 1.95/game, 1.86 bank cards lost/game
- **Bank triggers:** 15.9/game (+75.80 unusable) → bank 134133, remove 25200, decline 0
- **Jokers:** win rate by jokers cast — 0: 49.2% (382), 1: 51.0% (3722), 2+: 49.7% (15896)
- **Poly:** 2.00/game, bust 7.7%, stand 90.5%, avg stood total 17.1
- **Spells cast/game:** J-rank 2.22, revive 2.19, poly 2.00, negate 1.41, K-rank 1.25
- **Sac summons/game:** 1-sac 12.94, 2-sac 4.55 · milled cards/game 1.57

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 70% | 64% | 62% | 59% | 32% | 31% | 30% | 11% | 10% | 12% |
| mean turns until flip | 1.2 | 1.2 | 1.3 | 1.4 | 2.5 | 3.3 | 3.3 | 3.6 | 4.6 | 4.3 |

- **Showdown hands (all):** partial hand 55%, high card 2%, pair 6%, two pair 10%, three of a kind 2%, straight 1%, flush 2%, full house 16%, four of a kind 5%, straight flush 1%
- **Winning hands:** partial hand 12%, high card 3%, pair 11%, two pair 20%, three of a kind 4%, straight 2%, flush 4%, full house 32%, four of a kind 10%, straight flush 1%

### greedy vs greedy — config `deckOutFailedDraw` (10000 games)

- **Turns:** median 79, p10 73, p90 84, p95 86, max 92
- **Outcomes:** greedy (seat 0) 50.7% · draws 0.4% · stalls 0.00% · first-player wins 46.2% (of decided)
- **Banks:** seat0 mean 3.2, seat1 mean 3.1; winners 5.8 vs losers 0.6
- **Attack vs defense:** 81.7 attacks/game vs 21.0 monster sets/game (face-up summons 25.7); attacks into defense 14.0/game
- **Wall punish:** 2.13/game, 2.08 bank cards lost/game
- **Bank triggers:** 15.5/game (+49.66 unusable) → bank 119708, remove 35691, decline 0
- **Jokers:** win rate by jokers cast — 0: 45.6% (447), 1: 48.6% (4055), 2+: 50.3% (15498)
- **Poly:** 2.58/game, bust 7.5%, stand 91.6%, avg stood total 17.2
- **Spells cast/game:** revive 4.90, J-rank 4.34, K-rank 3.41, poly 2.72, negate 2.40, snipe 1.73
- **Sac summons/game:** 1-sac 15.60, 2-sac 4.67 · milled cards/game 2.20

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 66% | 59% | 57% | 55% | 33% | 35% | 32% | 8% | 3% | 4% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.3 | 1.6 | 1.4 | 1.3 | 1.6 | 2.9 | 2.6 |

- **Showdown hands (all):** partial hand 66%, high card 1%, pair 5%, two pair 9%, three of a kind 3%, straight 0%, flush 0%, full house 11%, four of a kind 3%, straight flush 0%
- **Winning hands:** partial hand 33%, high card 2%, pair 10%, two pair 18%, three of a kind 7%, straight 1%, flush 1%, full house 22%, four of a kind 6%, straight flush 0%
