import type { ParticleConfig } from "./starfield";

export interface DecorationAsset {
  key: string;
  src: string;
  /**
   * Legacy fixed display size, space-only. Every other theme (and space
   * itself once its decorations are re-exported onto the standardized
   * 512x512 canvas) omits these — size is then randomized per placement
   * instance from the tier's range in decorations.ts instead. Kept only so
   * space keeps rendering exactly as before until that re-export lands; see
   * public/assets/theme/README - Theme.md.
   */
  width?: number;
  height?: number;
}

export interface ThemeDecorations {
  large: DecorationAsset[];
  small: DecorationAsset[];
}

export interface ThemeAssets {
  characterSprites: {
    boy: { idle: string; yay: string };
    girl: { idle: string; yay: string };
  };
  /** Not consumed anywhere yet — CharacterSelectStep.tsx still hardcodes
   * "Astro Boy"/"Astro Girl" text directly. Wired here so the data exists
   * for whenever theme-selection UI gets built. */
  characterNames: {
    boy: string;
    girl: string;
  };
  decorations: ThemeDecorations;
  /** Ambient dot layer (src/lib/starfield.ts) — space uses white "stars",
   * other themes can recolor/resize via this instead of a hardcoded look. */
  particles: ParticleConfig;
  /** CSS background value for the world/sky behind everything else. */
  skyGradient: string;
}

// Centralized theme assets. Everything that plays backgroundMusicSrc
// (AudioToggle) reads from here.
//
// coin/reward/audio/mute-icon are identical across every theme by product
// decision, so they live under public/assets/shared/ instead of being
// duplicated per theme. characterSprites/decorations/particles/skyGradient
// differ per theme, keyed under `themes` by the orders.template value —
// resolved via getTheme() below. Only /invite/[guest_link] actually reads
// an order's template today; /create's steps (CharacterSelectStep,
// ToneSelectStep, PreviewStep) still hardcode themes.space since there's no
// theme-picker UI yet (see "Making a theme selectable" in the assets doc).
export const THEME_CONFIG = {
  backgroundMusicSrc: "/assets/shared/audio/bgm-space.mp3",
  muteIcons: {
    on: "/assets/shared/icons/icon-sound-on.png",
    off: "/assets/shared/icons/icon-sound-off.png",
  },
  coinSprites: {
    glow: "/assets/shared/coin/coin-glow.png",
    burst: "/assets/shared/coin/coin-burst.png",
  },
  rewardSprites: {
    closed: "/assets/shared/reward/gift-closed.png",
    opened: "/assets/shared/reward/gift-opened.png",
  },
  themes: {
    space: {
      characterSprites: {
        boy: {
          idle: "/assets/theme/space/characters/astroboy-idle.png",
          yay: "/assets/theme/space/characters/astroboy-yay.png",
        },
        girl: {
          idle: "/assets/theme/space/characters/astrogirl-idle.png",
          yay: "/assets/theme/space/characters/astrogirl-yay.png",
        },
      },
      characterNames: {
        boy: "Astro Boy",
        girl: "Astro Girl",
      },
      // Fixed width/height below is the pre-migration (legacy) sizing —
      // intentionally left as-is until space's decorations are re-exported
      // onto the standardized 512x512 canvas, at which point these should
      // drop width/height entirely (like dino's below) to pick up the
      // shared randomized-scale system.
      decorations: {
        large: [
          { key: "saturn-planet", src: "/assets/theme/space/decorations/saturn-planet.png", width: 200, height: 200 },
          { key: "striped-planet", src: "/assets/theme/space/decorations/striped-planet.png", width: 150, height: 150 },
          { key: "rocket", src: "/assets/theme/space/decorations/rocket.png", width: 120, height: 150 },
        ],
        small: [
          { key: "small-moon", src: "/assets/theme/space/decorations/small-moon.png", width: 100, height: 100 },
          { key: "crescent-moon", src: "/assets/theme/space/decorations/crescent-moon.png", width: 120, height: 120 },
          { key: "large-star", src: "/assets/theme/space/decorations/large-star.png", width: 100, height: 100 },
          { key: "star-cluster", src: "/assets/theme/space/decorations/star-cluster.png", width: 80, height: 80 },
          { key: "asteroid", src: "/assets/theme/space/decorations/asteroid.png", width: 80, height: 80 },
          { key: "comet", src: "/assets/theme/space/decorations/comet.png", width: 120, height: 80 },
          { key: "ufo", src: "/assets/theme/space/decorations/ufo.png", width: 120, height: 80 },
        ],
      },
      particles: {
        color: "#ffffff",
        sizeMin: 1,
        sizeMax: 3,
        opacityMin: 0.4,
        opacityMax: 1,
      },
      skyGradient: "linear-gradient(to top, #0a0e27 0%, #1a1f4e 100%)",
    },
    // Not selectable anywhere in the app yet (ThemeSelectStep.tsx still
    // only offers "space"), but fully wired into THEME_CONFIG and read by
    // /invite/[guest_link] once orders.template is set to "dino" — see
    // public/assets/theme/README - Theme.md.
    dino: {
      characterSprites: {
        boy: {
          idle: "/assets/theme/dino/characters/dinoboy-idle.png",
          yay: "/assets/theme/dino/characters/dinoboy-yay.png",
        },
        girl: {
          idle: "/assets/theme/dino/characters/dinogirl-idle.png",
          yay: "/assets/theme/dino/characters/dinogirl-yay.png",
        },
      },
      characterNames: {
        boy: "Dinoboy",
        girl: "Dinogirl",
      },
      // No width/height — every asset is a 512x512 transparent canvas, so
      // display size is randomized per placement from the tier's range
      // (decorations.ts) instead of fixed per-asset.
      decorations: {
        large: [
          { key: "volcano", src: "/assets/theme/dino/decorations/volcano.png" },
          { key: "trees", src: "/assets/theme/dino/decorations/trees.png" },
          { key: "dino-00", src: "/assets/theme/dino/decorations/dino-00.png" }, // brontosaurus/longneck
        ],
        small: [
          { key: "rocks", src: "/assets/theme/dino/decorations/rocks.png" },
          { key: "mushroom", src: "/assets/theme/dino/decorations/mushroom.png" },
          { key: "leaf", src: "/assets/theme/dino/decorations/leaf.png" },
          { key: "footprint", src: "/assets/theme/dino/decorations/footprint.png" },
          { key: "egg", src: "/assets/theme/dino/decorations/egg.png" },
          { key: "bone", src: "/assets/theme/dino/decorations/bone.png" },
          { key: "dino-01", src: "/assets/theme/dino/decorations/dino-01.png" }, // stegosaurus
          { key: "dino-02", src: "/assets/theme/dino/decorations/dino-02.png" }, // pterodactyl
          { key: "dino-03", src: "/assets/theme/dino/decorations/dino-03.png" }, // ankylosaurus
          { key: "dino-04", src: "/assets/theme/dino/decorations/dino-04.png" }, // raptor
          { key: "dino-05", src: "/assets/theme/dino/decorations/dino-05.png" }, // triceratops
          { key: "baby-dino-01", src: "/assets/theme/dino/decorations/baby-dino-01.png" },
          { key: "baby-dino-02", src: "/assets/theme/dino/decorations/baby-dino-02.png" },
          { key: "baby-dino-03", src: "/assets/theme/dino/decorations/baby-dino-03.png" },
          { key: "baby-dino-04", src: "/assets/theme/dino/decorations/baby-dino-04.png" },
          { key: "baby-dino-05", src: "/assets/theme/dino/decorations/baby-dino-05.png" },
          { key: "baby-dino-06", src: "/assets/theme/dino/decorations/baby-dino-06.png" },
        ],
      },
      // Warm "floating pollen" — same size/opacity feel as space's stars,
      // just recolored.
      particles: {
        color: "#ffe9b3",
        sizeMin: 1,
        sizeMax: 3,
        opacityMin: 0.4,
        opacityMax: 1,
      },
      // Deep jungle green at the ground, through a warm dusk amber, to a
      // golden-hour top.
      skyGradient: "linear-gradient(to top, #2d5016 0%, #a15a2e 50%, #f4a940 100%)",
    },
  },
} satisfies {
  backgroundMusicSrc: string;
  muteIcons: { on: string; off: string };
  coinSprites: { glow: string; burst: string };
  rewardSprites: { closed: string; opened: string };
  themes: Record<string, ThemeAssets>;
};

export type ThemeName = keyof typeof THEME_CONFIG.themes;

/** Resolves an order's `template` value to its theme config, falling back
 * to "space" for null/unrecognized values (the default before `template`
 * was wired to anything). */
export function getTheme(template?: string | null): ThemeAssets {
  if (template && template in THEME_CONFIG.themes) {
    return THEME_CONFIG.themes[template as ThemeName];
  }
  return THEME_CONFIG.themes.space;
}
