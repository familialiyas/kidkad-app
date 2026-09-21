# Theme assets

Assets split into two locations:

- **`public/assets/shared/`** — coin, reward gift, audio (music + SFX), and
  the mute icons. Identical across every theme by product decision, so
  there's exactly one copy, used by all themes.
- **`public/assets/theme/<name>/`** — character sprites and decorations.
  These differ per theme, one folder per `orders.template` value.
  **`space` is the only theme that's actually selectable/live** — `template`
  isn't switched on anywhere yet (see `PROJECT_STATUS.md`), and
  `ThemeSelectStep.tsx` only offers "Space Mission". `dinosaur` has assets
  wired into `THEME_CONFIG` (below) but isn't reachable from the UI yet.

**Source of truth:** `src/lib/theme-config.ts` is what the app actually
reads — every path and display size here is wired through that one file. If
this doc and the code ever disagree, trust the code and fix this doc.

## Shared assets — `public/assets/shared/` (every theme)

```
public/assets/shared/
  audio/
  coin/
  icons/
  reward/
```

### Coin — `coin/`
| File | Native size | Displayed size |
|---|---|---|
| `coin-glow.png` | 1264×1264 | 56×56 |
| `coin-burst.png` | 1264×1264 | 56×56 |

`glow` covers the locked/active/flying states; `burst` is the ~300ms collect
flash. Native files are ~22× the display size — likely an unoptimized raw
export, not a deliberate spec; 2–3× display size (~110–170px) would be
plenty if these ever get re-exported.

### Reward gift — `reward/`
| File | Native size | Displayed size |
|---|---|---|
| `gift-closed.png` | 1264×1264 | 260×260 |
| `gift-opened.png` | 1264×1264 | 260×260 |

Same oversizing note as the coin assets applies here.

### Icons — `icons/`
| File | Size | Status |
|---|---|---|
| `icon-sound-on.png` | 60×60 | **Active** — `AudioToggle.tsx` via `THEME_CONFIG.muteIcons` |
| `icon-sound-off.png` | 60×60 | **Active** — same |

These are the *only* raster icons in the app. Party-detail icons (calendar,
location, dress code, celebration) are inline SVG on purpose — a raster
`<img>` gets auto-inverted/washed out by OS-level "force dark mode" on some
devices, inline SVG via `currentColor` doesn't (see
`src/app/invite/[guest_link]/PartyIcons.tsx`). The 4 PNG equivalents that
used to live here (`icon-calendar.png`, `icon-celebration.png`,
`icon-dresscode.png`, `icon-location.png`) were deleted once confirmed dead
— don't re-add PNGs for that icon category, follow the SVG pattern instead.

### Audio — `audio/`
| File | Duration | Size |
|---|---|---|
| `bgm-space.mp3` | 34.4s (loops) | 1.34 MB |
| `sfx-coin-collect.mp3` | 1.91s | 30 KB |
| `sfx-gift-open.mp3` | 2.19s | 34 KB |
| `sfx-warp.mp3` | 1.04s | 16 KB |
| `sfx-dialogue-open.mp3` | 0.26s | 4 KB |
| `sfx-dialogue-close.mp3` | 0.13s | 2 KB |
| `sfx-button-tap.mp3` | 1.04s | 16 KB |
| `sfx-rsvp-success.mp3` | 1.28s | 20 KB |

One looping background track, plus 7 one-shot SFX (`src/lib/sfx.ts`). SFX are
decoded into `AudioBuffer`s at load, so keep new ones short (well under a
couple of seconds) — decode cost scales with duration, and these are meant
to feel instant on tap. Despite the filename, `bgm-space.mp3` is the shared
track for every theme, not space-specific — a rename would need a matching
path update in `theme-config.ts`.

## Per-theme assets — `public/assets/theme/<name>/`

```
public/assets/theme/<name>/
  characters/
  decorations/
```

Every theme needs:
- **`characters/`** — 2 characters (boy/girl) × 2 states (idle/victory) = 4
  transparent PNGs, portrait 2:3, named `<charactername>-idle.png` /
  `<charactername>-yay.png`. Display size comes from `CHARACTER_WIDTH` /
  `CHARACTER_HEIGHT` in `src/lib/game-constants.ts` (width is the source
  value; height is derived to preserve the 2:3 ratio — sprites that don't
  match it will crop/stretch).
- **`decorations/`** — parallax margin scenery placed by
  `src/lib/decorations.ts`, split into a rare "large/landmark" tier and a
  more freely-scattered "small" tier. Transparent PNG. The declared
  `width`/`height` in `theme-config.ts` drive placement math directly (not
  read from the file), so they must match each asset's actual aspect ratio.
  A theme needs at least a few of each tier to avoid maps looking sparse.

Wired in code as `THEME_CONFIG.themes.<name>.{characterSprites,decorations}`
in `src/lib/theme-config.ts`. Every consumer (`TitleScreen.tsx`,
`GameWorld.tsx`, `CharacterSelectStep.tsx`, `ToneSelectStep.tsx`,
`PreviewStep.tsx`, `decorations.ts`) is currently hardcoded to
`themes.space` specifically — nothing reads `orders.template` to pick a
theme dynamically yet, so adding a `themes.<name>` entry alone doesn't make
it playable (see "Making a theme selectable" below).

### `space` (live)

**Characters:**
| File | Native size | Displayed size |
|---|---|---|
| `astroboy-idle.png` | 300×450 (2:3) | 110×165 |
| `astroboy-yay.png` | 300×450 | 110×165 |
| `astrogirl-idle.png` | 300×450 | 110×165 |
| `astrogirl-yay.png` | 300×450 | 110×165 |

**Decorations — large tier** (1–2 of each per invite):
| Key | File | Size |
|---|---|---|
| saturn-planet | `saturn-planet.png` | 200×200 |
| striped-planet | `striped-planet.png` | 150×150 |
| rocket | `rocket.png` | 120×150 |

**Decorations — small tier** (2–4 of each):
| Key | File | Size |
|---|---|---|
| small-moon | `small-moon.png` | 100×100 |
| crescent-moon | `crescent-moon.png` | 120×120 |
| large-star | `large-star.png` | 100×100 |
| star-cluster | `star-cluster.png` | 80×80 |
| asteroid | `asteroid.png` | 80×80 |
| comet | `comet.png` | 120×80 |
| ufo | `ufo.png` | 120×80 |

### `dinosaur` (assets in, not selectable yet)

Wired into `THEME_CONFIG.themes.dinosaur`, but **not reachable from the
UI** — `ThemeSelectStep.tsx` doesn't offer it, and nothing switches on
`orders.template`. The large/small tiering and display sizes below are a
first-pass reading of the art (all native files are a uniform 512×512, so
sizes are assigned per-tier rather than per-asset aspect ratio like space's
non-square pieces) — not visually tuned or reviewed. Revisit both before
this theme actually ships.

**Characters:**
| File | Native size | Displayed size |
|---|---|---|
| `dinoboy-idle.png` | 300×450 (2:3) | 110×165 |
| `dinoboy-yay.png` | 300×450 | 110×165 |
| `dinogirl-idle.png` | 300×450 | 110×165 |
| `dinogirl-yay.png` | 300×450 | 110×165 |

**Decorations — large tier** (8 keys — notably more than space's 3; density
constants in `decorations.ts` are currently shared across all themes and
haven't been rebalanced for this, so this tier will read much busier than
space's if ever turned on as-is):
| Key | File | Native size | Assigned display size |
|---|---|---|---|
| volcano | `volcano.png` | 512×512 | 160×160 |
| trees | `trees.png` | 512×512 | 160×160 |
| dino-00 … dino-05 (6 files) | `dino-0{0..5}.png` | 512×512 | 160×160 |

**Decorations — small tier** (12 keys):
| Key | File | Native size | Assigned display size |
|---|---|---|---|
| baby-dino-01 … baby-dino-06 (6 files) | `baby-dino-0{1..6}.png` | 512×512 | 90×90 |
| bone | `bone.png` | 512×512 | 90×90 |
| egg | `egg.png` | 512×512 | 90×90 |
| footprint | `footprint.png` | 512×512 | 90×90 |
| leaf | `leaf.png` | 512×512 | 90×90 |
| mushroom | `mushroom.png` | 512×512 | 90×90 |
| rocks | `rocks.png` | 512×512 | 90×90 |

### `ocean` (empty scaffold)
Folder exists (`public/assets/theme/ocean/`) but has no assets yet — nothing
wired into `THEME_CONFIG`.

## Making a theme selectable

Having a `themes.<name>` entry in `THEME_CONFIG` (dinosaur already does)
isn't enough on its own. To actually turn one on:

1. Add a card for it in `ThemeSelectStep.tsx` (currently hardcodes "Space
   Mission" as selected and a single locked placeholder card).
2. Make every consumer read the *order's* theme instead of hardcoding
   `themes.space` — `TitleScreen.tsx`, `GameWorld.tsx`,
   `CharacterSelectStep.tsx`, `ToneSelectStep.tsx`, `PreviewStep.tsx`, and
   `decorations.ts` (`generateDecorations`) all currently do this.
   `orders.template` already exists as a column to key off of.
3. For dinosaur specifically: rebalance `LARGE_MIN_COUNT`/`LARGE_MAX_COUNT`
   in `decorations.ts` if its large tier should feel as sparse as space's
   (8 large-tier types vs. space's 3, same density constants today), and
   spot-check the 90×90/160×160 display sizes assigned above against the
   actual art.

## Adding a new theme from scratch

1. Create `public/assets/theme/<name>/` with `characters/` and
   `decorations/` — **not** `audio/`, `coin/`, `icons/`, or `reward/`; those
   are shared and already exist under `public/assets/shared/`.
2. Provide the character and decoration assets, sized per the guidance
   above.
3. Add a `themes.<name>` entry to `THEME_CONFIG` in
   `src/lib/theme-config.ts` (`characterSprites` + `decorations`, same
   shape as `space`/`dinosaur`). `backgroundMusicSrc`, `muteIcons`,
   `coinSprites`, and `rewardSprites` need no changes.
4. Fill in that theme's section in this doc.
5. Follow "Making a theme selectable" above to actually expose it.
