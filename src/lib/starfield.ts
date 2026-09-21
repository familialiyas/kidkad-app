import { mulberry32, hashStringToSeed } from "./seeded-random";

export interface ParticleConfig {
  /** CSS color for every dot in this theme's ambient layer. */
  color: string;
  sizeMin: number;
  sizeMax: number;
  opacityMin: number;
  opacityMax: number;
}

export interface Star {
  id: number;
  top: number;
  leftPct: number;
  size: number;
  opacity: number;
}

const STAR_COUNT = 100;
export const STAR_PARALLAX_FACTOR = 0.6;

/**
 * Ambient dot particle field — historically "stars" (space's white dots),
 * generalized to be theme-driven: same generation/parallax/seeding
 * mechanics, but color/size/opacity now come from the theme's
 * ParticleConfig instead of being hardcoded, so e.g. dino can render warm
 * "pollen" instead of white stars.
 *
 * Same seed (e.g. guest_link) always produces the same layout; different
 * invites look different.
 */
export function generateStars(seed: string, worldHeight: number, config: ParticleConfig): Star[] {
  const random = mulberry32(hashStringToSeed(`${seed}:stars`));
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    top: random() * worldHeight,
    leftPct: random() * 100,
    size: config.sizeMin + random() * (config.sizeMax - config.sizeMin),
    opacity: config.opacityMin + random() * (config.opacityMax - config.opacityMin),
  }));
}
