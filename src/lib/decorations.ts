import { mulberry32, hashStringToSeed } from "./seeded-random";
import type { DecorationAsset, ThemeAssets } from "./theme-config";

export interface PlacedDecoration {
  id: string;
  src: string;
  size: number;
  top: number;
  side: "left" | "right";
  /** Distance from the chosen side's edge, as a percentage of viewport width. */
  insetPct: number;
  /** Independent float-loop timing so decorations don't bob in sync. */
  floatDurationS: number;
  floatDelayS: number;
  /** Static per-instance look so repeats of the same asset don't read as copy-pasted. */
  baseRotationDeg: number;
}

// Middle depth layer: slower than foreground gameplay (character/coins at
// 100%), faster than the distant star field (60%) — see STAR_PARALLAX_FACTOR.
export const DECORATION_PARALLAX_FACTOR = 0.8;

// Keeps decorations off the center path stripe (~28% of viewport, centered)
// by confining them to a band within each margin.
const MARGIN_MIN_INSET_PCT = 2;
const MARGIN_MAX_INSET_PCT = 30;

// Every decoration gets its own vertical "slot" of the world height, and
// lands only in the first JITTER_FRACTION of that slot — guaranteeing a
// minimum gap of (1 - JITTER_FRACTION) * slotHeight to the next one, instead
// of letting two items land arbitrarily close together.
const JITTER_FRACTION = 0.5;

const FLOAT_DURATION_MIN_S = 3;
const FLOAT_DURATION_MAX_S = 5;

// Most decoration art (standing dinosaurs, characters facing a specific
// way) has a clear grounded "right way up" — a full 0-360 spin reads as
// broken for those, so every decoration instead gets a small, playful
// left/right lean instead of a full rotation.
const TILT_MAX_DEG = 15;

// Every decoration asset is a standardized 512x512 transparent canvas
// (content centered/scaled within the square regardless of native aspect
// ratio) — rendered via object-fit: contain in a square container whose
// size is randomized per placement instance from these tier ranges, rather
// than a fixed size per asset.
const LANDMARK_SIZE_MIN = 150;
const LANDMARK_SIZE_MAX = 220;
const SMALL_SIZE_MIN = 60;
const SMALL_SIZE_MAX = 120;

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface DecorationInstance extends DecorationAsset {
  tier: "large" | "small";
}

/** Same seed (e.g. guest_link) always produces the same layout; different invites look different. */
export function generateDecorations(
  seed: string,
  worldHeight: number,
  theme: ThemeAssets
): PlacedDecoration[] {
  const random = mulberry32(hashStringToSeed(`${seed}:decorations`));

  const instances: DecorationInstance[] = [];
  function queueInstances(defs: DecorationAsset[], tier: "large" | "small", min: number, max: number) {
    for (const d of defs) {
      const count = min + Math.floor(random() * (max - min + 1));
      for (let i = 0; i < count; i++) instances.push({ ...d, tier });
    }
  }
  const density = theme.decorationDensity;
  queueInstances(theme.decorations.large, "large", density.largeMinCount, density.largeMaxCount);
  queueInstances(theme.decorations.small, "small", density.smallMinCount, density.smallMaxCount);

  // Shuffle so large/small types interleave, then walk down the world height
  // slot by slot — this is what guarantees the minimum spacing above.
  const shuffled = shuffle(instances, random);
  const slotHeight = worldHeight / shuffled.length;

  return shuffled.map((d, i) => {
    const [sizeMin, sizeMax] = d.tier === "large" ? [LANDMARK_SIZE_MIN, LANDMARK_SIZE_MAX] : [SMALL_SIZE_MIN, SMALL_SIZE_MAX];

    return {
      id: `${d.key}-${i}`,
      src: d.src,
      size: sizeMin + random() * (sizeMax - sizeMin),
      top: i * slotHeight + random() * slotHeight * JITTER_FRACTION,
      side: random() < 0.5 ? "left" : ("right" as const),
      insetPct: MARGIN_MIN_INSET_PCT + random() * (MARGIN_MAX_INSET_PCT - MARGIN_MIN_INSET_PCT),
      floatDurationS: FLOAT_DURATION_MIN_S + random() * (FLOAT_DURATION_MAX_S - FLOAT_DURATION_MIN_S),
      // Negative delay starts the loop partway through immediately, so
      // decorations desync from frame one instead of drifting apart slowly.
      floatDelayS: -random() * FLOAT_DURATION_MAX_S,
      // Constrained tilt, not a full spin — always right-side up, just a
      // slight random lean left or right.
      baseRotationDeg: (random() * 2 - 1) * TILT_MAX_DEG,
    };
  });
}
