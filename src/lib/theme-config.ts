import type { ParticleConfig } from "./starfield";
import type { SlotName } from "./decorations";

/**
 * One image src per named decoration slot — all 20 required (TypeScript's
 * `Record<SlotName, string>` enforces this). Size, placement frequency, and
 * tilt behavior are NOT specified here; they live entirely in
 * DECORATION_SLOTS (decorations.ts), the master layout extracted from
 * space's current placement, and apply identically to every theme. A theme
 * only ever decides which asset fills which slot — see the "CONVENTION"
 * note on space's `decorations` below and "Adding a new theme from
 * scratch" in the theme asset README.
 */
export type ThemeDecorationAssets = Record<SlotName, string>;

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
  decorations: ThemeDecorationAssets;
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
// coin/reward/audio are identical across every theme by product decision,
// so they live under public/assets/shared/ instead of being duplicated per
// theme. characterSprites/decorations/particles/skyGradient differ per
// theme, keyed under `themes` by the orders.template value — resolved via
// getTheme() below. Only /invite/[guest_link] actually reads an order's
// template today; /create's steps (CharacterSelectStep, ToneSelectStep,
// PreviewStep) still hardcode themes.space since there's no theme-picker UI
// yet (see "Making a theme selectable" in the assets doc).
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
      // per-asset.
      //
      // CONVENTION — this theme IS the master layout: its 20 decoration
      // slot names (and every slot's size/frequency/tilt config) are
      // defined once, theme-independently, in DECORATION_SLOTS
      // (decorations.ts). A theme here supplies only an image src per slot
      // name — never its own size/density/tilt config — so every theme,
      // present and future, inherits space's exact placement/sizing/
      // "crowdiness" behavior automatically. Adding a new theme means
      // supplying 20 assets and slotting them into these exact 20 names
      // (any asset-to-slot assignment is fine); no changes needed in
      // decorations.ts.
      decorations: {
        rocket: "/assets/theme/space/decorations/rocket.png",
        sun: "/assets/theme/space/decorations/sun.png",
        "planet-01": "/assets/theme/space/decorations/planet-01.png", // ringed, tan
        "planet-04": "/assets/theme/space/decorations/planet-04.png", // ringed, pink
        "planet-05": "/assets/theme/space/decorations/planet-05.png", // ringed, orange
        "planet-02": "/assets/theme/space/decorations/planet-02.png", // cratered, mars-like
        "planet-03": "/assets/theme/space/decorations/planet-03.png", // teal striped
        "planet-06": "/assets/theme/space/decorations/planet-06.png", // green polka-dot
        "planet-07": "/assets/theme/space/decorations/planet-07.png", // teal wave
        "moon-01": "/assets/theme/space/decorations/moon-01.png",
        "moon-crescent": "/assets/theme/space/decorations/moon-crescent.png",
        star: "/assets/theme/space/decorations/star.png",
        "star-cluster": "/assets/theme/space/decorations/star-cluster.png",
        comet: "/assets/theme/space/decorations/comet.png",
        asteroid: "/assets/theme/space/decorations/asteroid.png",
        "alien-01": "/assets/theme/space/decorations/alien-01.png",
        "alien-02": "/assets/theme/space/decorations/alien-02.png",
        "alien-03": "/assets/theme/space/decorations/alien-03.png",
        "ufo-01": "/assets/theme/space/decorations/ufo-01.png",
        "ufo-02": "/assets/theme/space/decorations/ufo-02.png",
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
      // Standardized 512x512 canvas — see space's decorations above and its
      // "CONVENTION" note. dino's 20 assets slot into space's 20 named
      // slots per an explicit mapping table provided directly (not derived
      // by role/visual-weight heuristics like an earlier pass) — see below.
      decorations: {
        "alien-01": "/assets/theme/dino/decorations/baby-dino-01.png",
        "alien-02": "/assets/theme/dino/decorations/baby-dino-02.png",
        "alien-03": "/assets/theme/dino/decorations/baby-dino-03.png",
        asteroid: "/assets/theme/dino/decorations/rocks.png",
        comet: "/assets/theme/dino/decorations/bone.png",
        "moon-01": "/assets/theme/dino/decorations/egg.png",
        "moon-crescent": "/assets/theme/dino/decorations/egg-cracked.png",
        "planet-01": "/assets/theme/dino/decorations/dino-01.png",
        "planet-02": "/assets/theme/dino/decorations/dino-02.png",
        "planet-03": "/assets/theme/dino/decorations/dino-03.png",
        "planet-04": "/assets/theme/dino/decorations/dino-04.png",
        "planet-05": "/assets/theme/dino/decorations/dino-05.png",
        "planet-06": "/assets/theme/dino/decorations/dino-06.png",
        "planet-07": "/assets/theme/dino/decorations/dino-07.png",
        rocket: "/assets/theme/dino/decorations/trees.png",
        "star-cluster": "/assets/theme/dino/decorations/mushroom.png",
        star: "/assets/theme/dino/decorations/footprint.png",
        sun: "/assets/theme/dino/decorations/volcano.png",
        "ufo-01": "/assets/theme/dino/decorations/dino-fly-01.png",
        "ufo-02": "/assets/theme/dino/decorations/dino-fly-02.png",
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
      // Darkened across the whole scroll (was a much lighter #5c3a1e →
      // #f4c15f daylight gradient) to match space's dark-background
      // contrast against decoration art — the bright top stop in
      // particular was washing out light-colored assets the way space's
      // deep navy never does.
      skyGradient: "linear-gradient(to top, #201004 0%, #4a2810 55%, #6b3d16 100%)",
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
