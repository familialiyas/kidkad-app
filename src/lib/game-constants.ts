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
