// The whole guest game renders inside a fixed-width "phone frame" at every
// screen size (centered, letterboxed on wider viewports) instead of scaling
// up to fill a desktop browser — matches max-w-md, already used elsewhere
// for dialogue/form width (DialogueBox, StepShell, ReturnVisitScreen's card).
export const GAME_FRAME_MAX_WIDTH = 448;

// The game frame itself stays a normal in-flow, centered block (so its
// `position: fixed` descendants — mute/menu buttons, HUD, dialogue overlays —
// keep the viewport as their containing block and stay genuinely pinned
// while the tall world scrolls underneath). That means a `fixed` element
// anchored to e.g. `left-4` lands 16px from the actual *browser* edge, not
// the frame's edge, once the viewport is wider than the frame. This computes
// the equivalent inset from the frame's edge instead: on screens narrower
// than the frame it reduces to plain `insetPx` (unchanged from before), and
// on wider screens it lands at the frame's visible edge + insetPx.
export function frameInset(insetPx: number): string {
  return `calc(50% - min(${GAME_FRAME_MAX_WIDTH}px, 100vw) / 2 + ${insetPx}px)`;
}

// For a `position: fixed` full-bleed layer (a dim backdrop, a menu panel)
// that should span the frame's width instead of `inset-0`'s actual viewport
// width — pair with `left: frameInset(0)` and `top`/`bottom: 0`.
export function frameWidth(): string {
  return `min(${GAME_FRAME_MAX_WIDTH}px, 100vw)`;
}

// No dedicated "end zone" — the reward now appears right at the character's
// position in the same scrollable space scene, so the world just needs a
// little room past the last coin (2700) for that to happen.
export const WORLD_HEIGHT = 3000;
// ~28% of a typical phone viewport (390-430px wide) — clearly readable
// without dominating the screen. Sprite art is a fixed 300x450 (2:3), so
// height is derived from width to preserve its aspect ratio.
export const CHARACTER_WIDTH = 110;
export const CHARACTER_HEIGHT = Math.round(CHARACTER_WIDTH * (450 / 300));
// Roughly where the head sits within the sprite's height, used to anchor
// dialogue boxes near the character's head rather than its center of mass.
export const CHARACTER_HEAD_Y_RATIO = 0.25;
// How far below the character the reward gift spawns.
export const REWARD_OFFSET_FROM_CHARACTER = CHARACTER_HEIGHT + 40;
// Displayed size of the reward gift sprite (square art) — a big, prominent
// hero moment, deliberately much larger than the coins or even the character.
export const REWARD_SIZE = 260;

// "idle" = sealed, tappable; "opened" = briefly shown before mission complete.
export type RewardPhase = "idle" | "opened";

export interface CoinDef {
  id: 1 | 2 | 3;
  side: "left" | "right";
  top: number;
  label: string;
}

export const COINS: CoinDef[] = [
  { id: 1, side: "left", top: 900, label: "Date & Time" },
  { id: 2, side: "right", top: 1800, label: "Location" },
  { id: 3, side: "left", top: 2700, label: "Dress Code" },
];
