import { mulberry32, hashStringToSeed } from "./seeded-random";
import { THEME_CONFIG } from "./theme-config";

export interface PlacedDecoration {
  id: string;
  src: string;
  width: number;
  height: number;
  top: number;
  side: "left" | "right";
  /** Distance from the chosen side's edge, as a percentage of viewport width. */
  insetPct: number;
  /** Independent float-loop timing so decorations don't bob in sync. */
  floatDurationS: number;
  floatDelayS: number;
  /** Static per-instance look so repeats of the same asset don't read as copy-pasted. */
  baseRotationDeg: number;
  baseScale: number;
}

// Middle depth layer: slower than foreground gameplay (character/coins at
// 100%), faster than the distant star field (60%) — see STAR_PARALLAX_FACTOR.
export const DECORATION_PARALLAX_FACTOR = 0.8;

const LARGE_MIN_COUNT = 1;
const LARGE_MAX_COUNT = 2;
const SMALL_MIN_COUNT = 2;
const SMALL_MAX_COUNT = 4;

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

const ROTATION_MAX_DEG = 15;
const SCALE_MIN = 0.85;
const SCALE_MAX = 1.15;

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface DecorationInstance {
  key: string;
  src: string;
  width: number;
  height: number;
}

/** Same seed (e.g. guest_link) always produces the same layout; different invites look different. */
export function generateDecorations(seed: string, worldHeight: number): PlacedDecoration[] {
  const random = mulberry32(hashStringToSeed(`${seed}:decorations`));

  const instances: DecorationInstance[] = [];
  function queueInstances(defs: typeof THEME_CONFIG.decorations.large, min: number, max: number) {
    for (const d of defs) {
      const count = min + Math.floor(random() * (max - min + 1));
      for (let i = 0; i < count; i++) instances.push(d);
    }
  }
  queueInstances(THEME_CONFIG.decorations.large, LARGE_MIN_COUNT, LARGE_MAX_COUNT);
  queueInstances(THEME_CONFIG.decorations.small, SMALL_MIN_COUNT, SMALL_MAX_COUNT);

  // Shuffle so large/small types interleave, then walk down the world height
  // slot by slot — this is what guarantees the minimum spacing above.
  const shuffled = shuffle(instances, random);
  const slotHeight = worldHeight / shuffled.length;

  return shuffled.map((d, i) => ({
    id: `${d.key}-${i}`,
    src: d.src,
    width: d.width,
    height: d.height,
    top: i * slotHeight + random() * slotHeight * JITTER_FRACTION,
    side: random() < 0.5 ? "left" : "right",
    insetPct: MARGIN_MIN_INSET_PCT + random() * (MARGIN_MAX_INSET_PCT - MARGIN_MIN_INSET_PCT),
    floatDurationS: FLOAT_DURATION_MIN_S + random() * (FLOAT_DURATION_MAX_S - FLOAT_DURATION_MIN_S),
    // Negative delay starts the loop partway through immediately, so
    // decorations desync from frame one instead of drifting apart slowly.
    floatDelayS: -random() * FLOAT_DURATION_MAX_S,
    baseRotationDeg: (random() * 2 - 1) * ROTATION_MAX_DEG,
    baseScale: SCALE_MIN + random() * (SCALE_MAX - SCALE_MIN),
  }));
}
