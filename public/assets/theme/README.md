# Theme assets

Assets split into two locations:

- **`public/assets/shared/`** — coin, reward gift, audio (music + SFX), and
  the mute icons. Identical across every theme by product decision, so
  there's exactly one copy, used by all themes.
- **`public/assets/theme/<name>/`** — character sprites and decorations.
  These differ per theme, one folder per `orders.template` value.
  **`space` is the only theme that exists and ships today** — `template`
  isn't switched on anywhere yet (see `PROJECT_STATUS.md`), so the `space`
  section below doubles as the spec a second theme (e.g. Dinosaur, Ocean)
  would need to satisfy.

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
  character/
  decorations/
```

Every theme needs:
- **`character/`** — 2 characters (boy/girl) × 2 states (idle/victory) = 4
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

### `space` (current)

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

### `dinosaur` (not yet built)
_Fill in once this theme exists: characters table + large/small decoration
tables, same shape as `space` above._

### `ocean` (not yet built)
_Same — fill in when built._

## Adding a second theme

1. Create `public/assets/theme/<name>/` with `character/` and
   `decorations/` — **not** `audio/`, `coin/`, `icons/`, or `reward/`; those
   are shared and already exist under `public/assets/shared/`.
2. Provide the character and decoration assets, sized per the guidance
   above.
3. Add a matching entry to `THEME_CONFIG` in `src/lib/theme-config.ts` for
   `characterSprites` and `decorations` (currently a single flat object
   scoped to `space` — it'll need to become keyed by theme name, since
   nothing reads `template` yet). `backgroundMusicSrc`, `muteIcons`,
   `coinSprites`, and `rewardSprites` need no changes — they already point
   at the shared location every theme uses.
4. Fill in that theme's section in this doc (see the `dinosaur`/`ocean`
   placeholders above).
