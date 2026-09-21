# Theme assets

Assets split into two locations:

- **`public/assets/shared/`** — coin, reward gift, audio (music + SFX), and
  the mute icons. Identical across every theme by product decision, so
  there's exactly one copy, used by all themes.
- **`public/assets/theme/<name>/`** — character sprites and decorations.
  These differ per theme, one folder per `orders.template` value.
  **`space` and `dino` both actually render** — `/invite/[guest_link]` reads
  an order's `template` and loads the matching theme (`getTheme()` in
  `theme-config.ts`, defaulting to `space` for null/unrecognized values).
  What's *not* built yet is any UI to pick a theme: `/create`'s steps
  (`CharacterSelectStep.tsx`, `ToneSelectStep.tsx`, `PreviewStep.tsx`) still
  hardcode `themes.space`, and `ThemeSelectStep.tsx` only offers "Space
  Mission" — so a dino invite currently only happens by setting an existing
  order's `template` column to `"dino"` directly. See "Making a theme
  selectable in `/create`" below for what's left.

**Source of truth:** `src/lib/theme-config.ts` is what the app actually
reads — every path, tier, and color here is wired through that one file. If
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
`src/app/invite/[guest_link]/PartyIcons.tsx`). Don't add PNGs for that icon
category, follow the SVG pattern instead.

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
  match it will crop/stretch). Each theme also has a `characterNames` entry
  (e.g. dino's `{ boy: "Dinoboy", girl: "Dinogirl" }`) — not consumed
  anywhere yet, since `CharacterSelectStep.tsx` still hardcodes "Astro
  Boy"/"Astro Girl" text directly.
- **`decorations/`** — parallax margin scenery placed by
  `src/lib/decorations.ts`, split into a rare **large/landmark** tier (1–2
  instances per invite) and a more freely-scattered **small** tier (2–4
  instances each). **Standardized canvas: every decoration asset is a
  512×512 transparent-background PNG, content centered/scaled within the
  square regardless of its native aspect ratio.** No per-asset width/height
  in `theme-config.ts` — display size is randomized per placement instance
  instead:
  - Rendered via `object-fit: contain` in a square container, so content
    scales proportionally with no distortion regardless of how much of the
    512×512 canvas it actually fills.
  - **Size** is randomized per instance (seeded, so deterministic per
    guest_link) within the tier's range: **large/landmark ≈150–220px,
    small ≈60–120px** (`LANDMARK_SIZE_MIN/MAX`, `SMALL_SIZE_MIN/MAX` in
    `decorations.ts`).
  - **Rotation** is a full random 0–360° per instance — nothing in this
    game has a "wrong way up".
  - A theme needs at least a few of each tier to avoid maps looking sparse;
    density itself (how many instances of each key spawn) is controlled by
    shared, theme-agnostic constants (`LARGE_MIN_COUNT`/`MAX_COUNT`,
    `SMALL_MIN_COUNT`/`MAX_COUNT`).

  Both `space` and `dino` are on this same standardized system — space was
  re-exported (its original 10 decorations replaced with a richer 20-file
  set: aliens, a sun, 7 planets, 2 UFOs, plus the original rocket/moons/
  stars/comet/asteroid) and its `theme-config.ts` entries no longer specify
  width/height. `DecorationAsset` has no size fields at all now; a theme
  that somehow needed fixed per-asset sizing again would need that added
  back deliberately, not inherited from a leftover code path.

Also per-theme: **`particles`** (the ambient dot layer, `src/lib/starfield.ts`
— space uses small white "stars"; a theme can recolor/resize via
`{ color, sizeMin, sizeMax, opacityMin, opacityMax }`) and **`skyGradient`**
(a CSS `background` value for the world behind everything else).

### `space` (live)

**Characters:** (`characterNames`: Astro Boy / Astro Girl)
| File | Native size | Displayed size |
|---|---|---|
| `astroboy-idle.png` | 300×450 (2:3) | 110×165 |
| `astroboy-yay.png` | 300×450 | 110×165 |
| `astrogirl-idle.png` | 300×450 | 110×165 |
| `astrogirl-yay.png` | 300×450 | 110×165 |

**Decorations — large/landmark tier** (all 512×512, size randomized ~150–220px):
| Key | File | Notes |
|---|---|---|
| rocket | `rocket.png` | |
| sun | `sun.png` | |
| planet-01 | `planet-01.png` | ringed, tan |
| planet-04 | `planet-04.png` | ringed, pink |
| planet-05 | `planet-05.png` | ringed, orange |

**Decorations — small tier** (all 512×512, size randomized ~60–120px):
| Key | File | Notes |
|---|---|---|
| planet-02 | `planet-02.png` | cratered, mars-like, no ring |
| planet-03 | `planet03.png` | teal striped, no ring — note the actual filename has no hyphen |
| planet-06 | `planet-06.png` | green polka-dot, no ring |
| planet-07 | `planet-07.png` | teal wave, no ring |
| moon-01 | `moon-01.png` | |
| moon-crescent | `moon-crescent.png` | |
| star | `star.png` | |
| star-cluster | `star-cluster.png` | |
| comet | `comet.png` | |
| asteroid | `asteroid.png` | |
| alien-01, alien-02, alien-03 | `alien-0{1..3}.png` | 3 variants |
| ufo, ufo-02 | `ufo.png`, `ufo-02.png` | 2 variants |

Tiering call: the 3 ringed planets + sun + rocket read as the "grand"
centerpiece pieces; the 4 plainer round planets sit in the small tier
alongside the moons/stars, closer to them in visual weight.

**Particles:** white, size 1–3px, opacity 0.4–1.
**Sky:** `linear-gradient(to top, #0a0e27 0%, #1a1f4e 100%)` (deep navy).

### `dino` (live)

**Characters:** (`characterNames`: Dinoboy / Dinogirl)
| File | Native size | Displayed size |
|---|---|---|
| `dinoboy-idle.png` | 300×450 (2:3) | 110×165 |
| `dinoboy-yay.png` | 300×450 | 110×165 |
| `dinogirl-idle.png` | 300×450 | 110×165 |
| `dinogirl-yay.png` | 300×450 | 110×165 |

**Decorations — large/landmark tier** (all 512×512, size randomized ~150–220px):
| Key | File | Notes |
|---|---|---|
| volcano | `volcano.png` | |
| trees | `trees.png` | |
| dino-00 | `dino-00.png` | brontosaurus/longneck |

**Decorations — small tier** (all 512×512, size randomized ~60–120px):
| Key | File | Notes |
|---|---|---|
| rocks | `rocks.png` | |
| mushroom | `mushroom.png` | |
| leaf | `leaf.png` | |
| footprint | `footprint.png` | |
| egg | `egg.png` | |
| bone | `bone.png` | |
| dino-01 | `dino-01.png` | stegosaurus |
| dino-02 | `dino-02.png` | pterodactyl |
| dino-03 | `dino-03.png` | ankylosaurus |
| dino-04 | `dino-04.png` | raptor |
| dino-05 | `dino-05.png` | triceratops |
| baby-dino-01 … baby-dino-06 | `baby-dino-0{1..6}.png` | 6 variants |

**Particles:** warm "floating pollen", `#ffe9b3`, same size/opacity range as
space's stars (1–3px, 0.4–1 opacity) — just recolored.
**Sky:** `linear-gradient(to top, #2d5016 0%, #a15a2e 50%, #f4a940 100%)` —
deep jungle green at the ground, through warm dusk amber, to golden-hour at
the top.

### `ocean` (empty scaffold)
Folder exists (`public/assets/theme/ocean/`) but has no assets yet — nothing
wired into `THEME_CONFIG`.

## Making a theme selectable in `/create`

`/invite/[guest_link]` already resolves and renders whichever theme an
order's `template` column names — that part is done for both `space` and
`dino`. What's still missing is any way for a customer to actually *choose*
`dino` while creating an invite:

1. Add a card for it in `ThemeSelectStep.tsx` (currently hardcodes "Space
   Mission" as selected and a single locked placeholder card) and thread
   the choice through `CreateOrderClient.tsx` into the `template` field
   `/api/orders` already accepts.
2. `CharacterSelectStep.tsx`, `ToneSelectStep.tsx`, and `PreviewStep.tsx`
   (the /create steps that preview a character sprite while building a new
   order) still hardcode `THEME_CONFIG.themes.space` — once there's a
   selected theme to read instead, swap those to use it (and pull the
   card/button label from that theme's `characterNames` instead of the
   hardcoded "Astro Boy"/"Astro Girl" strings).
3. Until then, the only way to see a `dino` invite is setting an existing
   order's `template` column to `"dino"` directly (e.g. via Supabase).

## Adding a new theme from scratch

1. Create `public/assets/theme/<name>/` with `characters/` and
   `decorations/` — **not** `audio/`, `coin/`, `icons/`, or `reward/`; those
   are shared and already exist under `public/assets/shared/`.
2. Provide 4 character PNGs (2:3, matching space/dino's spec) and enough
   decorations per tier, every one a 512×512 transparent-canvas PNG (content
   centered/scaled within the square, no cropping) — don't specify
   width/height for them, the shared randomized-scale system handles sizing.
3. Add a `themes.<name>` entry to `THEME_CONFIG` in `src/lib/theme-config.ts`
   (`characterSprites`, `characterNames`, `decorations`, `particles`,
   `skyGradient` — same shape as `dino`). `backgroundMusicSrc`, `muteIcons`,
   `coinSprites`, and `rewardSprites` need no changes.
4. Fill in that theme's section in this doc.
5. Follow "Making a theme selectable in `/create`" above to actually expose
   it as a customer-facing choice — `/invite/[guest_link]` will already
   render it correctly for any order whose `template` names it.
