# Sim report — `results/E6`

## Summary

| config | matchup | games | med turns | p10 | p90 | max | stall | p0 win | 1st-player win | draws |
|---|---|---|---|---|---|---|---|---|---|---|
| polyJokerWild | banker vs banker | 10000 | 90 | 90 | 90 | 94 | 0.00% | 49.6% | 66.0% | 0.9% |
| polyJokerWild | greedy vs greedy | 10000 | 78 | 72 | 83 | 91 | 0.00% | 50.5% | 46.3% | 0.4% |
| polyJokerWild | random vs random | 10000 | 79 | 73 | 85 | 94 | 0.00% | 42.8% | 49.4% | 14.2% |

#### Win-rate matrix — config `polyJokerWild` (row agent vs column agent, both seats pooled; draws count against)

| | banker | greedy | random |
|---|---|---|---|
| **banker** | 49.5% | — | — |
| **greedy** | — | 49.8% | — |
| **random** | — | — | 42.9% |

## Matchup detail

### banker vs banker — config `polyJokerWild` (10000 games)

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

### greedy vs greedy — config `polyJokerWild` (10000 games)

- **Turns:** median 78, p10 72, p90 83, p95 84, max 91
- **Outcomes:** greedy (seat 0) 50.5% · draws 0.4% · stalls 0.00% · first-player wins 46.3% (of decided)
- **Banks:** seat0 mean 3.2, seat1 mean 3.1; winners 5.7 vs losers 0.6
- **Attack vs defense:** 80.3 attacks/game vs 20.6 monster sets/game (face-up summons 25.2); attacks into defense 13.8/game
- **Wall punish:** 2.07/game, 2.02 bank cards lost/game
- **Bank triggers:** 15.3/game (+48.84 unusable) → bank 118136, remove 34991, decline 0
- **Jokers:** win rate by jokers cast — 0: 45.3% (505), 1: 50.7% (4536), 2+: 49.7% (14959)
- **Poly:** 2.54/game, bust 7.0%, stand 93.0%, avg stood total 17.4
- **Spells cast/game:** revive 4.81, J-rank 4.27, K-rank 3.36, poly 2.68, negate 2.36, snipe 1.70
- **Sac summons/game:** 1-sac 15.32, 2-sac 4.57 · milled cards/game 2.18

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 66% | 59% | 57% | 55% | 33% | 35% | 32% | 8% | 3% | 4% |
| mean turns until flip | 1.2 | 1.3 | 1.3 | 1.3 | 1.6 | 1.4 | 1.3 | 1.6 | 2.8 | 2.7 |

- **Showdown hands (all):** partial hand 66%, high card 1%, pair 5%, two pair 9%, three of a kind 3%, straight 0%, flush 0%, full house 11%, four of a kind 3%, straight flush 0%
- **Winning hands:** partial hand 33%, high card 2%, pair 11%, two pair 18%, three of a kind 7%, straight 1%, flush 1%, full house 22%, four of a kind 6%, straight flush 0%

### random vs random — config `polyJokerWild` (10000 games)

- **Turns:** median 79, p10 73, p90 85, p95 86, max 94
- **Outcomes:** random (seat 0) 42.8% · draws 14.2% · stalls 0.00% · first-player wins 49.4% (of decided)
- **Banks:** seat0 mean 1.1, seat1 mean 1.1; winners 2.2 vs losers 0.3
- **Attack vs defense:** 22.4 attacks/game vs 26.4 monster sets/game (face-up summons 26.4); attacks into defense 7.6/game
- **Wall punish:** 4.29/game, 1.79 bank cards lost/game
- **Bank triggers:** 9.6/game (+3.85 unusable) → bank 53522, remove 13357, decline 29455
- **Jokers:** win rate by jokers cast — 0: 37.0% (571), 1: 40.4% (4654), 2+: 43.9% (14775)
- **Poly:** 1.66/game, bust 33.3%, stand 66.7%, avg stood total 14.7
- **Spells cast/game:** revive 4.71, J-rank 4.55, K-rank 3.15, Q-rank 2.90, poly 1.73, snipe 1.42, negate 1.22
- **Sac summons/game:** 1-sac 18.03, 2-sac 8.00 · milled cards/game 3.37

| rank | A | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| set rate | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% | 50% |
| mean turns until flip | 1.7 | 1.7 | 1.7 | 1.7 | 1.8 | 1.8 | 1.8 | 1.9 | 1.9 | 1.9 |

- **Showdown hands (all):** partial hand 97%, high card 0%, pair 1%, two pair 1%, three of a kind 0%, straight 0%, flush 0%, full house 0%, four of a kind 0%
- **Winning hands:** partial hand 94%, high card 1%, pair 3%, two pair 1%, three of a kind 1%, straight 0%, flush 0%, full house 0%, four of a kind 0%
