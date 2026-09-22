# Theme assets

Assets split into two locations:

- **`public/assets/shared/`** — coin, reward gift, and audio (music + SFX).
  Identical across every theme by product decision, so there's exactly one
  copy, used by all themes. Also holds the now-unused mute icon PNGs (see
  "Icons" below).
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
| `icon-sound-on.png` | 60×60 | **Unused** — replaced by `SpeakerOnIcon` (inline SVG, see below) |
| `icon-sound-off.png` | 60×60 | **Unused** — replaced by `SpeakerOffIcon` |

The mute toggle now uses inline SVG (`SpeakerOnIcon`/`SpeakerOffIcon` in
`PartyIcons.tsx`), same reasoning as the party-detail icons below — the old
flat, solid-colored PNGs also clashed with the mute button's frosted-glass
treatment (`AudioToggle.tsx`, `.glass-icon-btn` in `globals.css`), which a
plain white outline glyph sits inside cleanly. The PNG files above are
still on disk but no longer referenced from code; safe to delete next time
this directory gets cleaned up. Party-detail icons (calendar, location,
dress code, celebration) are inline SVG for a separate reason — a raster
`<img>` gets auto-inverted/washed out by OS-level "force dark mode" on some
devices, inline SVG via `currentColor` doesn't (see
`src/app/invite/[guest_link]/PartyIcons.tsx`). Don't add PNGs for icons in
either category, follow the SVG pattern instead.

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
  `src/lib/decorations.ts`. **Standardized canvas: every decoration asset
  is a 512×512 transparent-background PNG, content centered/scaled within
  the square regardless of its native aspect ratio.** No per-asset
  width/height in `theme-config.ts` — display size comes from the slot
  system below instead.

  **Named-slot master template.** Placement/sizing/frequency/tilt are NOT
  theme config at all — they're defined exactly once, theme-independently,
  in `DECORATION_SLOTS` (`decorations.ts`): 20 fixed named slots
  (`rocket`, `sun`, `planet-01`, … `ufo-02` — space's exact current 20
  items), each carrying its own `{ tier, sizeMin, sizeMax, countMin,
  countMax, tiltMaxDeg }`. **A theme (`theme-config.ts`) supplies only an
  image `src` per slot name** (`ThemeDecorationAssets = Record<SlotName,
  string>`) — never its own tier, size range, count, or tilt. This is what
  keeps "crowdiness" identical across themes: every theme runs through the
  exact same 20 slots with the exact same per-slot numbers, so the only
  thing that can differ between space and dino is which art renders, never
  how big, how often, or how tilted it is.

  **LOCKED, not per-guest.** `generateDecorations()` seeds its PRNG from
  `REFERENCE_SEED`, a fixed constant in `decorations.ts` — not the guest's
  own `guest_link` — so every single guest, in every theme, renders the
  exact same positions/sizes/tilts/float-timing; only the image per slot
  differs by theme. (The star field, `starfield.ts`, is unaffected and
  still varies per `guest_link` as before — this locking is decoration-only.)
  This was a deliberate reversal of the original "different invites look
  different" design, after specifically comparing two guest_links' output
  and preferring one arrangement. To re-tune the locked layout, edit the
  constants below and/or change `REFERENCE_SEED` to a different guest_link
  — the generation mechanics (pairing/overlap/hero-size/start-clearance)
  stay live code specifically so this doesn't require hand-editing a large
  array of numbers.
  - Rendered via `object-fit: contain` in a square container, so content
    scales proportionally with no distortion regardless of how much of the
    512×512 canvas it actually fills.
  - **Size** is randomized per instance (seeded from the locked reference,
    same for every guest) within its slot's `sizeMin`–`sizeMax`: the 5 large/landmark
    slots ≈150–220px, the 15 small slots ≈60–120px. A few instances (any
    slot, `HERO_SIZE_COUNT`) get an extra 1.3–1.8× size boost on top of
    that (capped at 280px) — no "does this species make sense at this
    size" logic, purely for visual variety (a couple of surprisingly big
    dinosaurs/planets among their normal-sized neighbors).
  - **Rotation** is a seeded, constrained tilt — a random ±15° per
    instance (every slot's `tiltMaxDeg` is currently 15°, since space
    itself is uniform on this — a future pass could diverge an individual
    slot without touching the others), always right-side up. Not a full
    0–360° spin (an earlier approach): most decoration art has a clear
    grounded orientation (standing dinosaurs, a specific facing direction),
    so a full spin read as broken rather than "everything floats" as
    originally intended.
  - **Placement** is a "somewhat symmetrical" left/right rhythm, not pure
    random scatter: most instances form loosely-mirrored pairs (shared row
    position + inset, each side jittered independently), with a smaller
    slice (~22%) breaking off as independent "extra" instances to disrupt
    that balance. A margin band (`MARGIN_MIN/MAX_INSET_PCT`) keeps most
    decorations clear of the character's center path; a couple of
    large-tier instances per invite (`OVERLAP_TARGET_COUNT`) are
    deliberately pushed past that band to cross into the path — the
    character renders behind decorations (see GameWorld.tsx's z-index —
    character z-[5], decorations z-[8]), so this reads as her briefly
    walking behind the object. Both the overlap and hero-size mechanics
    (and a final safety-net clamp) exclude/shrink instances within the
    first `START_CLEARANCE_PX` of the world, so nothing blocks the
    character right at the start, before she's even been seen clearly.
  - A soft `filter: drop-shadow` (`.decoration-float` in `globals.css`) is
    applied to every decoration, one flat value for every theme/slot, for a
    layered paper-craft depth consistent with the dialogue box's
    paper-cutout look.

  Both `space` and `dino` are on this system — space's own 20 items ARE
  the master template (see `DECORATION_SLOTS`), so its `theme-config.ts`
  entry is just each slot name mapped to its own existing asset. dino's 20
  assets are mapped onto space's 20 slot names via an explicit mapping
  table (not derived from a role/visual-weight heuristic) — see the
  dino-specific table further down, or `theme-config.ts`'s
  `themes.dino.decorations` for the live source of truth.

Also per-theme:
- **`particles`** — the ambient dot layer (`src/lib/starfield.ts`); space
  uses small white "stars", a theme can recolor/resize via
  `{ color, sizeMin, sizeMax, opacityMin, opacityMax }`.
- **`skyGradient`** — a CSS `background` value for the world behind
  everything else.
- **`missionLabel`** — e.g. "Space Mission" / "Dino Mission", shown on the
  title screen as "{childName}'s {missionLabel}" (`TitleScreen.tsx`).
- **`uiColors`** — `{ accent, accentLight, accentRgb, accentLightRgb,
  boxBg }` for the dialogue box and everything visually attached to it
  (footer buttons, the RSVP form, the in-game menu, the return-visit "You're
  in!" card). Read as CSS custom properties (`--ui-*`) set once on each of
  those components' own root (`DialogueBox.tsx`, `ReturnVisitScreen.tsx`,
  the menu panel in `GameClient.tsx`) via `themeUiStyle()` in
  `theme-config.ts`; everything else inherits via normal CSS cascade rather
  than needing the color threaded through as a prop — see the `.ui-*` /
  `.dialogue-btn-*` rules in `globals.css`. `*Rgb` fields are
  space-separated "R G B" triplets (not hex), so CSS can blend to any
  opacity via `rgb(var(--x) / N%)` without a variable per opacity level.

### `space` (live)

**`missionLabel`:** "Space Mission".

**Characters:** (`characterNames`: Astro Boy / Astro Girl)
| File | Native size | Displayed size |
|---|---|---|
| `astroboy-idle.png` | 300×450 (2:3) | 110×165 |
| `astroboy-yay.png` | 300×450 | 110×165 |
| `astrogirl-idle.png` | 300×450 | 110×165 |
| `astrogirl-yay.png` | 300×450 | 110×165 |

**Decorations — this theme IS the master slot template** (`DECORATION_SLOTS`
in `decorations.ts`); every slot name below is its own asset, unmodified:

Large/landmark slots (1–2 instances each, size randomized ~150–220px):
| Slot | File | Notes |
|---|---|---|
| rocket | `rocket.png` | |
| sun | `sun.png` | |
| planet-01 | `planet-01.png` | ringed, tan |
| planet-04 | `planet-04.png` | ringed, pink |
| planet-05 | `planet-05.png` | ringed, orange |

Small slots (2–4 instances each, size randomized ~60–120px):
| Slot | File | Notes |
|---|---|---|
| planet-02 | `planet-02.png` | cratered, mars-like, no ring |
| planet-03 | `planet-03.png` | teal striped, no ring |
| planet-06 | `planet-06.png` | green polka-dot, no ring |
| planet-07 | `planet-07.png` | teal wave, no ring |
| moon-01 | `moon-01.png` | |
| moon-crescent | `moon-crescent.png` | |
| star | `star.png` | |
| star-cluster | `star-cluster.png` | |
| comet | `comet.png` | |
| asteroid | `asteroid.png` | |
| alien-01, alien-02, alien-03 | `alien-0{1..3}.png` | 3 variants |
| ufo-01, ufo-02 | `ufo-01.png`, `ufo-02.png` | 2 variants |

Tiering call (baked into `DECORATION_SLOTS`, so it now applies to every
theme, not just space): the 3 ringed planets + sun + rocket read as the
"grand" centerpiece pieces; the 4 plainer round planets sit in the small
tier alongside the moons/stars, closer to them in visual weight.

**Particles:** white, size 1–3px, opacity 0.4–1.
**Sky:** `linear-gradient(to top, #0a0e27 0%, #1a1f4e 100%)` (deep navy).
**UI colors:** cyan/navy — `accent` #22d3ee (cyan-400), `accentLight`
#67e8f9 (cyan-300), `boxBg` #0f1442.

### `dino` (live)

**`missionLabel`:** "Dino Mission".

**Characters:** (`characterNames`: Dinoboy / Dinogirl)
| File | Native size | Displayed size |
|---|---|---|
| `dinoboy-idle.png` | 300×450 (2:3) | 110×165 |
| `dinoboy-yay.png` | 300×450 | 110×165 |
| `dinogirl-idle.png` | 300×450 | 110×165 |
| `dinogirl-yay.png` | 300×450 | 110×165 |

**Decorations — dino's 20 assets mapped onto space's 20 slots**, by an
explicit mapping table (not a role/visual-weight heuristic like an earlier
pass — see `theme-config.ts`'s `themes.dino.decorations` for the live
source of truth):

| Space slot | Dino asset | Space slot | Dino asset |
|---|---|---|---|
| alien-01 (small) | `baby-dino-01.png` | planet-01 (landmark) | `dino-01.png` |
| alien-02 (small) | `baby-dino-02.png` | planet-02 (small) | `dino-02.png` |
| alien-03 (small) | `baby-dino-03.png` | planet-03 (small) | `dino-03.png` |
| asteroid (small) | `rocks.png` | planet-04 (landmark) | `dino-04.png` |
| comet (small) | `bone.png` | planet-05 (landmark) | `dino-05.png` |
| moon-01 (small) | `egg.png` | planet-06 (small) | `dino-06.png` |
| moon-crescent (small) | `egg-cracked.png` | planet-07 (small) | `dino-07.png` |
| rocket (landmark) | `trees.png` | star-cluster (small) | `mushroom.png` |
| star (small) | `footprint.png` | ufo-01 (small) | `dino-fly-01.png` |
| sun (landmark) | `volcano.png` | ufo-02 (small) | `dino-fly-02.png` |

This table replaces an earlier mapping (which reused `baby-dino-04/05/06.png`,
`dino-00.png`, `leaf.png` for several slots) — those files were swapped out
for a fuller asset set (`dino-01` through `dino-07`, `dino-fly-01/02`,
`egg-cracked.png`) and the mapping was redone accordingly. The 5
large/landmark slots (`rocket`, `sun`, `planet-01`, `planet-04`, `planet-05`)
still get 1–2 instances each at ~150–220px regardless of which dino asset
fills them, per `DECORATION_SLOTS` — a slot's tier/size/frequency is fixed by
the slot itself, not by whichever asset currently occupies it.

**Particles:** warm "floating pollen", `#ffe9b3`, same size/opacity range as
space's stars (1–3px, 0.4–1 opacity) — just recolored.
**Sky:** `linear-gradient(to top, #5c3a1e 0%, #b3702e 55%, #f4c15f 100%)` —
warm brown at the ground through amber to golden-hour at the top. Softened
from an earlier version that went full dark jungle-green at the bottom
(read as a jarring day-to-night shift rather than one warm daylight scene)
— a stylistic call, open to further adjustment.
**UI colors:** warm amber/gold — `accent` #e8a33d, `accentLight` #f5d68a
(soft warm gold), `boxBg` #2b2410 (deep warm brown-olive).

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
2. Provide 4 character PNGs (2:3, matching space/dino's spec) and **exactly
   20 decoration PNGs** (512×512 transparent-canvas, content
   centered/scaled within the square, no cropping — don't specify
   width/height, the shared slot system handles sizing).
3. Add a `themes.<name>` entry to `THEME_CONFIG` in `src/lib/theme-config.ts`
   (`characterSprites`, `characterNames`, `missionLabel`, `decorations`,
   `particles`, `skyGradient`, `uiColors` — same shape as `dino`;
   TypeScript's `satisfies` check will flag anything missing).
   `backgroundMusicSrc`, `coinSprites`, and `rewardSprites` need no changes.
   - `decorations` is `Record<SlotName, string>` — one image path for each
     of the 20 fixed slot names from `DECORATION_SLOTS` in
     `decorations.ts` (`rocket`, `sun`, `planet-01`, `planet-04`,
     `planet-05`, `planet-02`, `planet-03`, `planet-06`, `planet-07`,
     `moon-01`, `moon-crescent`, `star`, `star-cluster`, `comet`,
     `asteroid`, `alien-01`, `alien-02`, `alien-03`, `ufo-01`, `ufo-02`).
     TypeScript will refuse to compile if any slot is missing. Assign your
     20 assets to these slots however makes sense for the new theme — dino's
     mapping (see its section below and `theme-config.ts`) wasn't done by a
     role/visual-weight rule, it was an explicit table, so there's no fixed
     assignment rule to follow, just make sure all 20 are covered. If you
     do want space's exact "biggest 5 pieces as landmarks" feel, put them in
     the 5 that were space's large/landmark items (rocket, sun, the 3 ringed
     planets) — that's a choice, not a requirement, since a slot's
     tier/size/frequency is fixed by the slot itself regardless of which
     asset fills it. No further config (size, frequency, tilt) is needed or
     wanted — that's the whole point of the slot system: it's inherited
     from `DECORATION_SLOTS`, identical for every theme.
4. Fill in that theme's section in this doc.
5. Follow "Making a theme selectable in `/create`" above to actually expose
   it as a customer-facing choice — `/invite/[guest_link]` will already
   render it correctly for any order whose `template` names it.
