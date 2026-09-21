import type { ParticleConfig } from "./starfield";

export interface DecorationAsset {
  key: string;
  src: string;
}

export interface ThemeDecorations {
  large: DecorationAsset[];
  small: DecorationAsset[];
}

/** How many instances of each decoration key spawn per invite — see
 * src/lib/decorations.ts. Per-theme (not shared) since a theme with more
 * distinct decoration keys than another would otherwise end up visibly
 * busier just from having more art, not from any deliberate density choice. */
export interface DecorationDensity {
  largeMinCount: number;
  largeMaxCount: number;
  smallMinCount: number;
  smallMaxCount: number;
}

/**
 * Colors for the dialogue box and everything visually attached to it
 * (footer buttons, RSVP form, the in-game menu, the return-visit card) —
 * read as CSS custom properties set on each of those components' own root
 * (DialogueBox.tsx, ReturnVisitScreen.tsx, GameClient.tsx's menu panel),
 * inherited from there by DialogueButton/RsvpForm/icons via normal CSS
 * cascade. See the `.ui-*`/`.dialogue-btn-*` rules in globals.css.
 *
 * `*Rgb` fields are space-separated "R G B" triplets (not hex) so CSS can
 * blend them to arbitrary opacities via `rgb(var(--x) / N%)` without a
 * separate variable per opacity level.
 */
export interface UiColors {
  accent: string;
  accentLight: string;
  accentRgb: string;
  accentLightRgb: string;
  boxBg: string;
}

/** `rgbTriplet` is a "R G B" string (see UiColors) — returns a plain rgba() color. */
export function withAlpha(rgbTriplet: string, alpha: number): string {
  const [r, g, b] = rgbTriplet.split(" ");
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  /** e.g. "{name}'s Space Mission" on the title screen — TitleScreen.tsx
   * reads this instead of hardcoding "Space Mission". */
  missionLabel: string;
  decorations: ThemeDecorations;
  decorationDensity: DecorationDensity;
  /** Ambient dot layer (src/lib/starfield.ts) — space uses white "stars",
   * other themes can recolor/resize via this instead of a hardcoded look. */
  particles: ParticleConfig;
  /** CSS background value for the world/sky behind everything else. */
  skyGradient: string;
  uiColors: UiColors;
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
      missionLabel: "Space Mission",
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
      decorationDensity: {
        largeMinCount: 1,
        largeMaxCount: 2,
        smallMinCount: 2,
        smallMaxCount: 4,
      },
      particles: {
        color: "#ffffff",
        sizeMin: 1,
        sizeMax: 3,
        opacityMin: 0.4,
        opacityMax: 1,
      },
      skyGradient: "linear-gradient(to top, #0a0e27 0%, #1a1f4e 100%)",
      uiColors: {
        accent: "#22d3ee", // cyan-400
        accentLight: "#67e8f9", // cyan-300
        accentRgb: "34 211 238",
        accentLightRgb: "103 232 249",
        boxBg: "#0f1442",
      },
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
      missionLabel: "Dino Mission",
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
      // Matches space's density (2-4 per small-tier key) — an earlier pass
      // halved this to 1-2 because the then-fully-random placement read as
      // cluttered/overlapping at the full count. Since decorations.ts now
      // places most instances as loosely-mirrored left/right pairs with
      // deliberate clearance down the center path, the full density reads
      // as full/composed rather than cluttered — matching space's look.
      decorationDensity: {
        largeMinCount: 1,
        largeMaxCount: 2,
        smallMinCount: 2,
        smallMaxCount: 4,
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
      // Consistently warm throughout the scroll (softened from an earlier
      // pass that went full dark jungle-green at the bottom — that read as
      // a jarring day-to-night shift rather than one warm daylight scene).
      skyGradient: "linear-gradient(to top, #5c3a1e 0%, #b3702e 55%, #f4c15f 100%)",
      uiColors: {
        accent: "#e8a33d", // warm amber/gold
        accentLight: "#f5d68a", // soft warm gold
        accentRgb: "232 163 61",
        accentLightRgb: "245 214 138",
        boxBg: "#2b2410", // deep warm brown-olive
      },
    },
  },
} satisfies {
  backgroundMusicSrc: string;
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

/** CSS custom properties for `theme.uiColors`, meant to be spread onto a
 * `style` prop (cast to `React.CSSProperties`, same as any other inline
 * custom-property usage in this codebase) on the root of a "themed region"
 * — DialogueBox.tsx, ReturnVisitScreen.tsx, and GameClient.tsx's in-game
 * menu each set these once on their own wrapper; the `.ui-*`/`.dialogue-btn-*`
 * rules in globals.css and DialogueButton.tsx/RsvpForm.tsx read them back
 * via normal CSS inheritance, not as a prop threaded through every level. */
export function themeUiStyle(theme: ThemeAssets): Record<string, string> {
  const c = theme.uiColors;
  return {
    "--ui-accent": c.accent,
    "--ui-accent-light": c.accentLight,
    "--ui-accent-rgb": c.accentRgb,
    "--ui-accent-light-rgb": c.accentLightRgb,
    "--ui-box-bg": c.boxBg,
  };
}
