/**
 * Shared deterministic pseudo-random helpers for the NER-SAFE intelligence
 * engines. Deterministic seeding keeps every derived metric reproducible so a
 * demonstration can be replayed identically.
 */

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random in [0,1) for a seed string. */
export function seeded(seed: string): number {
  let x = hashString(seed);
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 100000) / 100000;
}

/** Deterministic integer in [min, max]. */
export function seededInt(seed: string, min: number, max: number): number {
  return min + Math.floor(seeded(seed) * (max - min + 1));
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
