# Sim report — `results/E3`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| wallPunishAttacker | aggro vs aggro | 10000 | 90 | 90 | 90 | 94 | 0.00% | 50.2% | 44.7% | 0.0% |
| wallPunishAttacker | aggro vs greedy | 10000 | 79 | 74 | 84 | 92 | 0.00% | 0.3% | 50.2% | 0.0% |
| wallPunishAttacker | greedy vs aggro | 10000 | 79 | 74 | 84 | 91 | 0.00% | 99.9% | 49.7% | 0.0% |
| wallPunishAttacker | greedy vs greedy | 10000 | 78 | 72 | 83 | 90 | 0.00% | 50.2% | 45.8% | 0.4% |
| wallPunishDefender | aggro vs aggro | 10000 | 90 | 90 | 90 | 94 | 0.00% | 50.2% | 44.7% | 0.0% |
| wallPunishDefender | aggro vs greedy | 10000 | 79 | 74 | 84 | 92 | 0.00% | 0.2% | 50.3% | 0.0% |
| wallPunishDefender | greedy vs aggro | 10000 | 79 | 74 | 84 | 91 | 0.00% | 99.9% | 49.7% | 0.0% |
| wallPunishDefender | greedy vs greedy | 10000 | 78 | 72 | 83 | 90 | 0.00% | 50.1% | 46.7% | 0.4% |

#### Win-rate matrix — config `wallPunishAttacker` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | greedy |
|---|---|---|
| **aggro** | 50.0% | 0.2% |
| **greedy** | 99.8% | 49.8% |

#### Win-rate matrix — config `wallPunishDefender` (row agent vs column agent, both seats pooled; draws count against)

| | aggro | greedy |
|---|---|---|
| **aggro** | 50.0% | 0.1% |
| **greedy** | 99.9% | 49.8% |

## Matchup detail

### aggro vs aggro — config `wallPunishAttacker` (10000 games)

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

### aggro vs greedy — config `wallPunishAttacker` (10000 games)

- **Turns:** median 79, p10 74, p90 84, p95 86, max 92
- **Outcomes:** aggro (seat 0) 0.3% · draws 0.0% · stalls 0.00% · first-player wins 50.2% (of decided)
- **Banks:** seat0 mean 0.1, seat1 mean 11.5; winners 11.5 vs losers 0.1
- **Attack vs defense:** 133.4 attacks/game vs 1.8 monster sets/game (face-up summons 36.0); attacks into defense 2.0/game
- **Wall punish:** 1.05/game, 0.91 bank cards lost/game
- **Bank triggers:** 18.5/game (+112.26 unusable) → bank 155166, remove 30119, decline 0
- **Jokers:** win rate by jokers cast — 0: 32.6% (518), 1: 44.3% (4706), 2+: 52.4% (14776)
- **Poly:** 2.29/game, bust 7.9%, stand 92.1%, avg stood total 17.1
- **Spells cast/game:** J-rank 4.53, poly 2.29, revive 2.24, negate 1.46, K-rank 0.65
- **Sac summons/game:** 1-sac 9.81, 2-sac 3.75 · milled cards/game 0.08

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 7% | 7% | 6% | 5% | 1% | 2% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.1 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | 1.0 |

- **Showdown hands (all):** partial hand 50%, high card 0%, pair 1%, two pair 6%, three of a kind 1%, straight 1%, flush 3%, full house 27%, four of a kind 11%, straight flush 1%
- **Winning hands:** partial hand 0%, high card 0%, pair 2%, two pair 12%, three of a kind 2%, straight 3%, flush 5%, full house 53%, four of a kind 21%, straight flush 1%

### greedy vs aggro — config `wallPunishAttacker` (10000 games)

- **Turns:** median 79, p10 74, p90 84, p95 86, max 91
- **Outcomes:** greedy (seat 0) 99.9% · draws 0.0% · stalls 0.00% · first-player wins 49.7% (of decided)
- **Banks:** seat0 mean 11.5, seat1 mean 0.1; winners 11.6 vs losers 0.0
- **Attack vs defense:** 133.5 attacks/game vs 1.8 monster sets/game (face-up summons 35.9); attacks into defense 2.0/game
- **Wall punish:** 1.01/game, 0.88 bank cards lost/game
- **Bank triggers:** 18.5/game (+112.46 unusable) → bank 154774, remove 29951, decline 0
- **Jokers:** win rate by jokers cast — 0: 34.9% (505), 1: 44.8% (4775), 2+: 52.2% (14720)
- **Poly:** 2.31/game, bust 7.7%, stand 92.3%, avg stood total 17.1
- **Spells cast/game:** J-rank 4.54, poly 2.31, revive 2.25, negate 1.47, K-rank 0.65
- **Sac summons/game:** 1-sac 9.80, 2-sac 3.72 · milled cards/game 0.08

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 7% | 7% | 6% | 5% | 1% | 2% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.2 | 1.1 | 1.2 | 1.2 | 1.1 | 1.0 | 1.0 | 1.2 | 1.0 | 1.0 |

- **Showdown hands (all):** partial hand 50%, high card 0%, pair 1%, two pair 5%, three of a kind 1%, straight 2%, flush 2%, full house 27%, four of a kind 11%, straight flush 1%
- **Winning hands:** partial hand 0%, high card 0%, pair 2%, two pair 11%, three of a kind 2%, straight 3%, flush 5%, full house 53%, four of a kind 21%, straight flush 1%

### greedy vs greedy — config `wallPunishAttacker` (10000 games)

- **Turns:** median 78, p10 72, p90 83, p95 84, max 90
- **Outcomes:** greedy (seat 0) 50.2% · draws 0.4% · stalls 0.00% · first-player wins 45.8% (of decided)
- **Banks:** seat0 mean 3.1, seat1 mean 3.1; winners 5.7 vs losers 0.6
- **Attack vs defense:** 79.4 attacks/game vs 20.6 monster sets/game (face-up summons 25.1); attacks into defense 13.7/game
- **Wall punish:** 2.06/game, 2.01 bank cards lost/game
- **Bank triggers:** 15.2/game (+48.20 unusable) → bank 117000, remove 34540, decline 0
- **Jokers:** win rate by jokers cast — 0: 45.5% (561), 1: 48.1% (4575), 2+: 50.5% (14864)
- **Poly:** 2.53/game, bust 7.6%, stand 92.4%, avg stood total 17.2
- **Spells cast/game:** revive 4.79, J-rank 4.25, K-rank 3.35, poly 2.67, negate 2.36, snipe 1.69
- **Sac summons/game:** 1-sac 15.33, 2-sac 4.56 · milled cards/game 2.22

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 66% | 59% | 57% | 55% | 34% | 35% | 32% | 8% | 3% | 4% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.3 | 1.6 | 1.4 | 1.4 | 1.6 | 3.0 | 2.5 |

- **Showdown hands (all):** partial hand 67%, high card 0%, pair 3%, two pair 9%, three of a kind 3%, straight 0%, flush 0%, full house 13%, four of a kind 4%, straight flush 0%
- **Winning hands:** partial hand 34%, high card 1%, pair 6%, two pair 17%, three of a kind 6%, straight 1%, flush 1%, full house 26%, four of a kind 8%, straight flush 0%

### aggro vs aggro — config `wallPunishDefender` (10000 games)

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

### aggro vs greedy — config `wallPunishDefender` (10000 games)

- **Turns:** median 79, p10 74, p90 84, p95 86, max 92
- **Outcomes:** aggro (seat 0) 0.2% · draws 0.0% · stalls 0.00% · first-player wins 50.3% (of decided)
- **Banks:** seat0 mean 0.1, seat1 mean 11.5; winners 11.5 vs losers 0.1
- **Attack vs defense:** 133.5 attacks/game vs 1.8 monster sets/game (face-up summons 36.0); attacks into defense 2.0/game
- **Wall punish:** 1.04/game, 0.90 bank cards lost/game
- **Bank triggers:** 18.6/game (+112.30 unusable) → bank 155213, remove 30303, decline 0
- **Jokers:** win rate by jokers cast — 0: 32.9% (523), 1: 44.3% (4699), 2+: 52.4% (14778)
- **Poly:** 2.29/game, bust 7.9%, stand 92.1%, avg stood total 17.1
- **Spells cast/game:** J-rank 4.53, poly 2.29, revive 2.24, negate 1.46, K-rank 0.65
- **Sac summons/game:** 1-sac 9.80, 2-sac 3.75 · milled cards/game 0.08

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 7% | 7% | 7% | 5% | 1% | 2% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.1 | 1.1 | 1.2 | 1.1 | 1.1 | 1.1 | 1.0 | 1.0 | 1.0 | 1.0 |

- **Showdown hands (all):** partial hand 50%, high card 0%, pair 1%, two pair 6%, three of a kind 1%, straight 1%, flush 3%, full house 27%, four of a kind 11%, straight flush 1%
- **Winning hands:** partial hand 0%, high card 0%, pair 2%, two pair 12%, three of a kind 2%, straight 3%, flush 5%, full house 53%, four of a kind 21%, straight flush 1%

### greedy vs aggro — config `wallPunishDefender` (10000 games)

- **Turns:** median 79, p10 74, p90 84, p95 86, max 91
- **Outcomes:** greedy (seat 0) 99.9% · draws 0.0% · stalls 0.00% · first-player wins 49.7% (of decided)
- **Banks:** seat0 mean 11.5, seat1 mean 0.1; winners 11.5 vs losers 0.0
- **Attack vs defense:** 133.6 attacks/game vs 1.8 monster sets/game (face-up summons 35.9); attacks into defense 1.9/game
- **Wall punish:** 1.00/game, 0.87 bank cards lost/game
- **Bank triggers:** 18.5/game (+112.48 unusable) → bank 154791, remove 30126, decline 0
- **Jokers:** win rate by jokers cast — 0: 34.8% (509), 1: 44.8% (4772), 2+: 52.2% (14719)
- **Poly:** 2.31/game, bust 7.8%, stand 92.2%, avg stood total 17.1
- **Spells cast/game:** J-rank 4.54, poly 2.31, revive 2.25, negate 1.48, K-rank 0.65
- **Sac summons/game:** 1-sac 9.79, 2-sac 3.72 · milled cards/game 0.08

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 7% | 7% | 6% | 5% | 1% | 2% | 3% | 0% | 0% | 0% |
| mean turns until flip | 1.2 | 1.1 | 1.2 | 1.2 | 1.1 | 1.0 | 1.0 | 1.2 | 1.0 | 1.0 |

- **Showdown hands (all):** partial hand 50%, high card 0%, pair 1%, two pair 5%, three of a kind 1%, straight 2%, flush 2%, full house 27%, four of a kind 11%, straight flush 1%
- **Winning hands:** partial hand 0%, high card 0%, pair 2%, two pair 11%, three of a kind 2%, straight 3%, flush 5%, full house 54%, four of a kind 21%, straight flush 1%

### greedy vs greedy — config `wallPunishDefender` (10000 games)

- **Turns:** median 78, p10 72, p90 83, p95 84, max 90
- **Outcomes:** greedy (seat 0) 50.1% · draws 0.4% · stalls 0.00% · first-player wins 46.7% (of decided)
- **Banks:** seat0 mean 3.1, seat1 mean 3.1; winners 5.7 vs losers 0.6
- **Attack vs defense:** 80.4 attacks/game vs 20.4 monster sets/game (face-up summons 25.3); attacks into defense 13.8/game
- **Wall punish:** 2.11/game, 2.06 bank cards lost/game
- **Bank triggers:** 15.4/game (+48.85 unusable) → bank 118489, remove 35327, decline 0
- **Jokers:** win rate by jokers cast — 0: 45.1% (556), 1: 48.0% (4553), 2+: 50.5% (14891)
- **Poly:** 2.55/game, bust 7.7%, stand 92.3%, avg stood total 17.2
- **Spells cast/game:** revive 4.80, J-rank 4.25, K-rank 3.34, poly 2.68, negate 2.35, snipe 1.69
- **Sac summons/game:** 1-sac 15.27, 2-sac 4.54 · milled cards/game 2.13

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 66% | 59% | 57% | 55% | 33% | 35% | 31% | 7% | 3% | 4% |
| mean turns until flip | 1.2 | 1.2 | 1.3 | 1.3 | 1.6 | 1.4 | 1.3 | 1.6 | 2.7 | 2.5 |

- **Showdown hands (all):** partial hand 66%, high card 2%, pair 6%, two pair 10%, three of a kind 3%, straight 0%, flush 0%, full house 10%, four of a kind 2%, straight flush 0%
- **Winning hands:** partial hand 33%, high card 4%, pair 11%, two pair 20%, three of a kind 5%, straight 1%, flush 1%, full house 20%, four of a kind 5%, straight flush 0%
