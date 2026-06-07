// Mulberry32 — deterministic 32-bit PRNG. Stable across renders so the
// heatmap and any other fixture doesn't shimmer between SSR and hydration.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededIntArray(seed: number, length: number, max: number): number[] {
  const rand = mulberry32(seed);
  const out = new Array<number>(length);
  for (let i = 0; i < length; i++) out[i] = Math.floor(rand() * max);
  return out;
}
