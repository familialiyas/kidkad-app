import type { ParticleConfig } from "./starfield";

export interface DecorationAsset {
  key: string;
  src: string;
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
      // Standardized 512x512 canvas, same as dino — display size/rotation
      // are randomized per placement instance (decorations.ts), not fixed
      // per-asset. The 3 ringed planets + sun + rocket read as the "grand"
      // pieces (landmark tier); the plainer round planets are closer in
      // visual weight to the moons/stars they sit alongside (small tier).
      decorations: {
        large: [
          { key: "rocket", src: "/assets/theme/space/decorations/rocket.png" },
          { key: "sun", src: "/assets/theme/space/decorations/sun.png" },
          { key: "planet-01", src: "/assets/theme/space/decorations/planet-01.png" }, // ringed, tan
          { key: "planet-04", src: "/assets/theme/space/decorations/planet-04.png" }, // ringed, pink
          { key: "planet-05", src: "/assets/theme/space/decorations/planet-05.png" }, // ringed, orange
        ],
        small: [
          { key: "planet-02", src: "/assets/theme/space/decorations/planet-02.png" }, // cratered, mars-like
          { key: "planet-03", src: "/assets/theme/space/decorations/planet03.png" }, // teal striped
          { key: "planet-06", src: "/assets/theme/space/decorations/planet-06.png" }, // green polka-dot
          { key: "planet-07", src: "/assets/theme/space/decorations/planet-07.png" }, // teal wave
          { key: "moon-01", src: "/assets/theme/space/decorations/moon-01.png" },
          { key: "moon-crescent", src: "/assets/theme/space/decorations/moon-crescent.png" },
          { key: "star", src: "/assets/theme/space/decorations/star.png" },
          { key: "star-cluster", src: "/assets/theme/space/decorations/star-cluster.png" },
          { key: "comet", src: "/assets/theme/space/decorations/comet.png" },
          { key: "asteroid", src: "/assets/theme/space/decorations/asteroid.png" },
          { key: "alien-01", src: "/assets/theme/space/decorations/alien-01.png" },
          { key: "alien-02", src: "/assets/theme/space/decorations/alien-02.png" },
          { key: "alien-03", src: "/assets/theme/space/decorations/alien-03.png" },
          { key: "ufo", src: "/assets/theme/space/decorations/ufo.png" },
          { key: "ufo-02", src: "/assets/theme/space/decorations/ufo-02.png" },
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
      // Standardized 512x512 canvas — see space's decorations above.
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
