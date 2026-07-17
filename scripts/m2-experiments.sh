#!/usr/bin/env bash
# M2.5 re-simulation matrix (see M2.5_IMPLEMENTATION_BRIEF.md). The original M2
# E0-E6 runs (pre-ratification rules) are historical; their reports remain in
# results/E*. New baseline = draw-2 + no-battle-T1 + draw-phase-only deck-out.
#   R0: full 5×5 matchup matrix at the new baseline
#   R1: ante ∈ {5, 8} (ante 0 = R0) on greedy/banker/aggro mirrors + greedy×banker
#   R2/R3 are analyses of R0 output (first-player rates; K-spell instrumentation).
set -euo pipefail
cd "$(dirname "$0")/.."

GAMES="${GAMES:-10000}"
JOBS="${JOBS:-6}"
CFG=packages/sim/configs

jobs_file="$(mktemp)"
trap 'rm -f "$jobs_file"' EXIT

emit() { # p0 p1 out [config]
  # NB: no trailing blanks — xargs -L treats a trailing blank as line continuation.
  local line="--p0 $1 --p1 $2 --games $GAMES --seed 1 --out $3"
  [ $# -ge 4 ] && line="$line --config $4"
  echo "$line" >>"$jobs_file"
}

AGENTS=(random aggro turtle banker greedy)

for a in "${AGENTS[@]}"; do
  for b in "${AGENTS[@]}"; do
    emit "$a" "$b" results/R0
  done
done

for cfg in ante5 ante8; do
  for pair in "greedy greedy" "banker banker" "aggro aggro" "greedy banker" "banker greedy"; do
    emit $pair results/R1 "$CFG/$cfg.json"
  done
done

echo "$(wc -l <"$jobs_file") runs × $GAMES games, $JOBS parallel jobs"
xargs -P "$JOBS" -L 1 npx tsx packages/sim/src/cli.ts run <"$jobs_file"
echo "all runs complete"
