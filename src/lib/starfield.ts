import { mulberry32, hashStringToSeed } from "./seeded-random";

export interface Star {
  id: number;
  top: number;
  leftPct: number;
  size: number;
  opacity: number;
}

const STAR_COUNT = 100;
export const STAR_PARALLAX_FACTOR = 0.6;

/** Same seed (e.g. guest_link) always produces the same star pattern; different invites look different. */
export function generateStars(seed: string, worldHeight: number): Star[] {
  const random = mulberry32(hashStringToSeed(`${seed}:stars`));
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    top: random() * worldHeight,
    leftPct: random() * 100,
    size: 1 + random() * 2,
    opacity: 0.4 + random() * 0.6,
  }));
}
