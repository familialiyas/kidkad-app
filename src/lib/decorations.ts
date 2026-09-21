import { mulberry32, hashStringToSeed } from "./seeded-random";
import type { DecorationAsset, ThemeAssets } from "./theme-config";

export interface PlacedDecoration {
  id: string;
  src: string;
  size: number;
  top: number;
  side: "left" | "right";
  /** Distance from the chosen side's edge, as a percentage of the game world's own (frame-capped) width. */
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

// Base margin band most decorations live in — kept fairly close to the
// edges so the character has clear room to walk down the center; a couple
// of deliberately-placed instances (see OVERLAP_* below) go well past this
// on purpose.
const MARGIN_MIN_INSET_PCT = 2;
const MARGIN_MAX_INSET_PCT = 22;

// A paired left/right instance shares a base row position but isn't a
// mechanical mirror — each side jitters independently within these ranges
// so the symmetry reads as "composed", not a rigid grid.
const PAIR_INSET_JITTER_PCT = 4;
const PAIR_INSET_CLAMP_MIN_PCT = 1;
const PAIR_INSET_CLAMP_MAX_PCT = MARGIN_MAX_INSET_PCT + PAIR_INSET_JITTER_PCT;
const PAIR_TOP_JITTER_FRACTION = 0.15;

// Share of instances that break from the paired rhythm entirely — placed
// independently (own side, own inset, no mirrored partner) so the path
// reads as "somewhat" symmetrical rather than a strict repeating pattern.
const EXTRA_FRACTION = 0.22;
const EXTRA_MIN_COUNT = 2;

// A small number of instances (large-tier preferred, for a clear
// silhouette), deliberately pushed well past the normal margin band so
// they cross into the character's path. GameWorld renders the character
// behind decorations (z-[5] vs decorations' z-[8]), so these read as the
// character briefly walking behind the object rather than a layout bug —
// "once or twice" per the design brief, not a recurring pattern.
const OVERLAP_TARGET_COUNT = 2;
const OVERLAP_MIN_INSET_PCT = 26;
const OVERLAP_MAX_INSET_PCT = 38;

// The character starts near the top of the world (~300px, before she's
// begun scrolling) and stays there while the opening dialogue plays — a
// large decoration reaching toward center in that window would immediately
// block her before she's even been seen clearly, rather than reading as a
// fun mid-game surprise. Keeps large-tier instances out of the deliberate
// overlap pool here, and is enforced again as a final clamp below in case
// an ordinary (non-deliberate) large placement lands nearby with a high
// inset by chance.
const START_CLEARANCE_PX = 600;
const START_CLEARANCE_MAX_INSET_PCT = 10;

// A few instances — any tier, no "does this species make sense at this
// size" logic — get scaled up well past their tier's normal range, purely
// for visual variety: a couple of dinosaurs (or, in space, a couple of
// planets) read as strikingly bigger than their neighbors instead of every
// instance of a given tier landing in the same size ballpark.
const HERO_SIZE_COUNT = 3;
const HERO_SIZE_MULTIPLIER_MIN = 1.3;
const HERO_SIZE_MULTIPLIER_MAX = 1.8;
const HERO_SIZE_MAX_PX = 280;

// Every row (a pair, or a lone extra) gets its own vertical slot of the
// world height, landing only in the first JITTER_FRACTION of that slot —
// guaranteeing a minimum gap to the next row instead of letting two rows
// land arbitrarily close together.
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

function clampInsetPct(pct: number): number {
  return Math.min(PAIR_INSET_CLAMP_MAX_PCT, Math.max(PAIR_INSET_CLAMP_MIN_PCT, pct));
}

interface DecorationInstance extends DecorationAsset {
  tier: "large" | "small";
}

type Row =
  | { kind: "pair"; a: DecorationInstance; b: DecorationInstance }
  | { kind: "single"; item: DecorationInstance };

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

  const shuffled = shuffle(instances, random);
  const total = shuffled.length;
  if (total === 0) return [];

  // Most instances form left/right pairs (the "somewhat symmetrical" base
  // rhythm); a smaller slice breaks off as independent extras that disrupt
  // that balance instead of mirroring anything.
  let extrasCount = Math.min(total, Math.max(EXTRA_MIN_COUNT, Math.round(total * EXTRA_FRACTION)));
  if ((total - extrasCount) % 2 === 1) extrasCount = Math.min(total, extrasCount + 1);

  const extraInstances = shuffled.slice(0, extrasCount);
  const pairPool = shuffled.slice(extrasCount);

  const rows: Row[] = [];
  for (let i = 0; i < pairPool.length; i += 2) {
    rows.push({ kind: "pair", a: pairPool[i], b: pairPool[i + 1] });
  }
  for (const item of extraInstances) {
    rows.push({ kind: "single", item });
  }
  // Interleaved randomly (not all pairs first, then all extras) so the
  // disruption is spread down the whole path rather than lopsided.
  const orderedRows = shuffle(rows, random);
  const slotHeight = worldHeight / orderedRows.length;

  function place(
    d: DecorationInstance,
    id: string,
    top: number,
    side: "left" | "right",
    insetPct: number
  ): { deco: PlacedDecoration; tier: "large" | "small" } {
    const [sizeMin, sizeMax] =
      d.tier === "large" ? [LANDMARK_SIZE_MIN, LANDMARK_SIZE_MAX] : [SMALL_SIZE_MIN, SMALL_SIZE_MAX];
    return {
      tier: d.tier,
      deco: {
        id,
        src: d.src,
        size: sizeMin + random() * (sizeMax - sizeMin),
        top,
        side,
        insetPct,
        floatDurationS: FLOAT_DURATION_MIN_S + random() * (FLOAT_DURATION_MAX_S - FLOAT_DURATION_MIN_S),
        // Negative delay starts the loop partway through immediately, so
        // decorations desync from frame one instead of drifting apart slowly.
        floatDelayS: -random() * FLOAT_DURATION_MAX_S,
        // Constrained tilt, not a full spin — always right-side up, just a
        // slight random lean left or right.
        baseRotationDeg: (random() * 2 - 1) * TILT_MAX_DEG,
      },
    };
  }

  const placed: { deco: PlacedDecoration; tier: "large" | "small" }[] = [];

  orderedRows.forEach((row, i) => {
    const rowTop = i * slotHeight + random() * slotHeight * JITTER_FRACTION;

    if (row.kind === "pair") {
      const baseInset = MARGIN_MIN_INSET_PCT + random() * (MARGIN_MAX_INSET_PCT - MARGIN_MIN_INSET_PCT);
      const leftTop = rowTop + (random() * 2 - 1) * slotHeight * PAIR_TOP_JITTER_FRACTION;
      const rightTop = rowTop + (random() * 2 - 1) * slotHeight * PAIR_TOP_JITTER_FRACTION;
      const leftInset = clampInsetPct(baseInset + (random() * 2 - 1) * PAIR_INSET_JITTER_PCT);
      const rightInset = clampInsetPct(baseInset + (random() * 2 - 1) * PAIR_INSET_JITTER_PCT);
      placed.push(place(row.a, `${row.a.key}-${i}-l`, leftTop, "left", leftInset));
      placed.push(place(row.b, `${row.b.key}-${i}-r`, rightTop, "right", rightInset));
    } else {
      const side = random() < 0.5 ? "left" : ("right" as const);
      const insetPct = MARGIN_MIN_INSET_PCT + random() * (MARGIN_MAX_INSET_PCT - MARGIN_MIN_INSET_PCT);
      placed.push(place(row.item, `${row.item.key}-${i}-x`, rowTop, side, insetPct));
    }
  });

  // A couple of instances (large-tier preferred, for a clear "walking
  // behind" silhouette) deliberately cross into the character's path
  // instead of staying in the margin — excluding anything near the world's
  // start (see START_CLEARANCE_PX above).
  const clearOfStart = (p: { deco: PlacedDecoration }) => p.deco.top >= START_CLEARANCE_PX;
  const largeCandidates = shuffle(
    placed.filter((p) => p.tier === "large" && clearOfStart(p)),
    random
  );
  const overlapCandidates =
    largeCandidates.length > 0 ? largeCandidates : shuffle(placed.filter(clearOfStart), random);
  for (const candidate of overlapCandidates.slice(0, OVERLAP_TARGET_COUNT)) {
    candidate.deco.insetPct = OVERLAP_MIN_INSET_PCT + random() * (OVERLAP_MAX_INSET_PCT - OVERLAP_MIN_INSET_PCT);
  }

  // A few "hero" instances get an oversized boost, independent of the
  // overlap picks above (the two can land on the same instance or not —
  // either way is fine, a huge decoration crossing the path is an even
  // bigger moment) — also excluding anything near the start, since a hero
  // instance is wide enough to reach the character regardless of inset.
  const heroCandidates = shuffle(placed.filter(clearOfStart), random).slice(0, HERO_SIZE_COUNT);
  for (const candidate of heroCandidates) {
    const multiplier = HERO_SIZE_MULTIPLIER_MIN + random() * (HERO_SIZE_MULTIPLIER_MAX - HERO_SIZE_MULTIPLIER_MIN);
    candidate.deco.size = Math.min(HERO_SIZE_MAX_PX, candidate.deco.size * multiplier);
  }

  // Final safety net: whatever put it there (an ordinary pair/extra that
  // happened to roll a high inset and/or a large size, not just the
  // deliberate overlap/hero passes above), no large decoration this close
  // to the start should still be reaching toward center. Caps size back to
  // the tier's own minimum too — a low inset alone doesn't help if the
  // item is wide enough to reach center from the edge regardless.
  for (const p of placed) {
    if (p.tier === "large" && p.deco.top < START_CLEARANCE_PX) {
      p.deco.insetPct = Math.min(p.deco.insetPct, START_CLEARANCE_MAX_INSET_PCT);
      p.deco.size = Math.min(p.deco.size, LANDMARK_SIZE_MIN);
    }
  }

  return placed.map((p) => p.deco);
}
