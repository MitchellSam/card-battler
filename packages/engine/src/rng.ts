// Seeded RNG (mulberry32). The engine performs zero unseeded randomness: every
// shuffle / random pick flows through an injected SeededRNG. The caller owns the
// RNG instance; action log + seed reproduces any game.

export interface SeededRNG {
  /** Uniform float in [0, 1). */
  float(): number;
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Current internal state, for external persistence if the caller wants it. */
  getState(): number;
}

export function createRng(seed: number): SeededRNG {
  let a = seed >>> 0;
  const float = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    float,
    int: (maxExclusive: number) => Math.floor(float() * maxExclusive),
    getState: () => a,
  };
}

/** In-place Fisher-Yates shuffle driven by the seeded RNG. */
export function shuffle<T>(items: T[], rng: SeededRNG): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
  return items;
}
