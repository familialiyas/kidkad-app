# KidKad — Project Status

Digital birthday invitation game. A parent customizes an invitation for their
child's party; guests open a link, play a short scroll-driven mini-game to
reveal party details, and RSVP. The parent gets a dashboard link to see
responses and edit the invitation. Reference doc for orienting a fresh Claude
session — last updated 2026-09-21.

## Stack

- Next.js (App Router) + TypeScript, Tailwind v4
- Supabase: Postgres (`orders`, `rsvps` tables, RLS locked to `service_role`)
  + Storage (`child-photos` bucket, public read)
- Fonts: Baloo 2 (`font-display`, playful/game UI) and Nunito (`font-body`,
  practical/form UI) via `next/font/google`
- `react-easy-crop` (npm) — the only external UI dependency beyond
  Next/React/Supabase; used for the round photo-crop step
- Testing discipline used throughout: `npx tsc --noEmit`, `npx eslint .`,
  `npm run build`, then a real Playwright browser session (Chromium,
  installed standalone in the session scratchpad, never a project
  dependency) driving the actual dev/prod server — never trusting code or a
  static screenshot alone
- GitHub: `https://github.com/familialiyas/kidkad-app` (private push access
  is under the `familialiyas` account — a different cached credential,
  `momenmuzik`, caused a 403 once; resolved by clearing the credential
  cache and re-authenticating). Pushes have occasionally hit a plain
  network timeout connecting to github.com — unrelated to auth, just retry.

## Routes

- `/` — scaffold default, not customized yet
- `/create` — the customization form (parent-facing, pre-payment). Nine
  steps: Welcome → Meet Your Star (name+age) → Pick Your Character → Pick A
  Voice (tone) → Pick A Theme → Add A Photo (with crop) → Share Your Party
  Details → Share Your Details (parent info) → Review/submit. Dark
  space-themed throughout, no plain-white steps.
- `/create/success/[order_token]` — post-submit landing page. Leads with
  copyable guest/admin links ("Your invitation is ready!"), full field dump
  collapsed below for verification. Payment isn't wired up, so this link is
  live immediately — framed honestly as such in the copy.
- `/invite/[guest_link]` — the guest-facing game (title → opening dialogue
  → 3 coin dialogues → mission-complete ceremony → reward gift → RSVP →
  "You're in!" return-visit screen). Space theme only; `template` column
  exists on `orders` but nothing switches on it yet.
- `/dashboard/[admin_link]` — RSVP list + CSV export, plus a collapsible
  "Edit invitation details" section covering every editable order field.
  Locked (UI + server-side) once today's date is past `party_date`.

## Database

`orders` columns: `id`, `order_token`, `guest_link`, `admin_link`,
`template`, `character` (`"boy"|"girl"`), `dialogue_tone`
(`"excited"|"sweet"|"silly"`), `payment_status`
(`"draft"|"paid"|"failed"`), `child_name`, `child_age`, `child_photo_url`,
`personal_message`, `parent_name`, `parent_email`, `party_date`,
`party_time`, `party_venue`, `maps_link`, `dress_code`, `rsvp_deadline`,
`rsvp_phone_contact`, `created_at`, `completed_at`.

`party_time` is stored as a friendly "H:MM AM/PM" string (e.g. "3:00 PM"),
not 24h — `src/lib/date.ts`'s `formatTimeForStorage()` converts a native
`<input type="time">` 24h value to this format at every write path
(`/create` submit, dashboard edit save). The dashboard edit form converts
the other direction on load (`parsePartyTime`) purely for display, since
native time inputs require 24h and silently blank anything else.

DB-side triggers confirmed by live testing (not visible in this repo — no
migration files, schema lives only in the Supabase project):
- `maps_link` auto-derives from `party_venue` (Google Maps search URL),
  always overwritten regardless of what's sent.
- `rsvp_deadline` auto-derives as `party_date - 3 days` **only when the
  insert omits it** — an explicit value is respected as-is.
- `dress_code` has a DB default of `"Casual, come comfy!"` when omitted.

`rsvps` columns: `id`, `order_id`, `guest_name`, `guest_phone`, `pax_count`,
`created_at`, `updated_at`.

No migration files exist in-repo (`supabase/` directory, CLI, and MCP were
all unavailable when the schema was first built — later sessions gained
Supabase MCP access, not yet used to retrofit migrations). Schema changes so
far were run ad hoc via the Supabase SQL editor by the user, on request.

## What's built and working

**Guest game** (`/invite/[guest_link]`): scroll-driven world with a seeded
parallax starfield (`src/lib/starfield.ts`, `src/lib/seeded-random.ts` —
deterministic per `guest_link`, still varies per guest) and decorations
(`src/lib/decorations.ts` — locked to one fixed arrangement for every
guest as of the slot-template rework, see below; no longer per-guest), 3
collectible coins revealing date/time, venue, and dress code via
`DialogueBox`. Opening dialogue is generated from
`DIALOGUE_TONES[order.dialogue_tone].opening` (name+age filled via
`fillTemplate`) — not from `personal_message`. Once all 3 coins are
collected: a ceremony dialogue plays the tone's `missionComplete` line: the
reward gift only spawns once that dialogue finishes typing (naturally or
via skip-tap) — not simultaneously with the dialogue. Tapping the gift
leads to the existing post-claim screen (same `missionComplete` line again
+ a separate "[child] says" box with `personal_message` verbatim, sitting
above the RSVP buttons — not merged into one box), then RSVP. Real art
assets throughout (space theme), no emoji anywhere, no raster PNG icons for
dialogue/party-detail icons either (see below).

The whole game renders inside a fixed-width, centered "phone frame"
(`GAME_FRAME_MAX_WIDTH` = 448px, `src/lib/game-constants.ts` — matches
`max-w-md`, already used for dialogue/form width elsewhere) at every screen
size, not just on narrow devices: on screens wider than the frame, the game
stays mobile-width and centered, with the surrounding space filled by a
solid `theme.uiColors.boxBg` letterbox instead of stretching to fill the
browser. Decoration/star/coin placement is percentage-based against the
game world's own (now consistently-capped) rendered width, so density
already looks the same on mobile and desktop with no changes to that math —
only the frame's ancestor chain needed capping. The handful of
`position: fixed` overlays that must stay pinned to the screen during the
tall scroll (mute/menu buttons, coin HUD, dialogue/menu backdrops,
confetti) keep true viewport-relative `fixed` positioning (not a
transform-scoped containing block, which would've broken scroll-pinning)
and instead resolve their edge-anchored offsets against the frame's edges
via the `frameInset()`/`frameWidth()` helpers in `game-constants.ts`.
Scoped to `/invite/[guest_link]` only — `/create` and `/dashboard` are
unaffected (their own existing `max-w-md`-capped content, not this frame
system). Decoration rotation (`decorations.ts`) is a seeded, constrained
±15° tilt (`TILT_MAX_DEG`), not the full 0-360° spin used previously — most
decoration art (standing dinosaurs, a specific facing direction) has a
clear "right way up" that a full spin broke.

Decoration **placement** (`decorations.ts`) is a "somewhat symmetrical"
left/right pairing system, not pure random scatter: most instances form
loosely-mirrored pairs (shared row + inset, each side jittered
independently), with a smaller slice breaking off as independent "extras"
to disrupt that balance. A margin band keeps most decorations clear of the
character's center path (more room to move); a couple of large-tier
instances per invite are deliberately pushed past that band to cross into
the path instead. The character now renders *behind* decorations
(`GameWorld.tsx` z-index — character `z-[5]`, decorations `z-[8]`), so
those deliberate crossings read as her briefly walking behind the object,
not a layout bug — a final safety-net clamp keeps this from happening
right at the world's start, before she's even been seen clearly. A few
instances (any tier) also get an oversized "hero" boost, purely for visual
variety (no per-species size logic). **Every decoration also gets a subtle
`filter: drop-shadow`** (one flat value, all themes/tiers) for a
layered-paper-craft depth consistent with the dialogue box's paper-cutout
look.

**Decoration placement is a fixed named-slot master template, not
per-theme tier config.** `DECORATION_SLOTS` in `decorations.ts` defines 20
fixed slot names (`rocket`, `sun`, `planet-01`, … `ufo-02` — space's exact
current 20 items), each carrying its own `{tier, sizeMin, sizeMax,
countMin, countMax, tiltMaxDeg}`. A theme (`ThemeAssets.decorations` in
`theme-config.ts`) now supplies only `Record<SlotName, string>` — one
image path per slot, nothing else; size/frequency/tilt are inherited from
`DECORATION_SLOTS` and are identical across every theme by construction,
which is what keeps "crowdiness" consistent (dino previously looked more
cluttered than space purely from differing per-theme density tuning — that
class of bug is now structurally impossible). dino's 20 assets are mapped
onto space's 20 slot names by role/visual weight (see the mapping comment
on dino's `decorations` entry in `theme-config.ts`), not arbitrary order.
Adding a future theme means supplying 20 assets and slotting them into
these exact 20 names — TypeScript's `Record<SlotName, string>` refuses to
compile if any slot is missing — no decorations.ts changes, ever.

**Decoration positioning is now LOCKED — one fixed arrangement for every
guest, in every theme**, not seeded per-guest like the star field still is.
`generateDecorations(worldHeight, theme)` no longer takes a `seed`
parameter; internally it always seeds from `REFERENCE_SEED` (a fixed
constant in `decorations.ts`, currently the guest_link of the specific
layout this was locked from), so every order — regardless of its own
guest_link — renders the exact same positions/sizes/tilts/float timing,
with only the art differing by theme (via the slot mapping above). This
was a deliberate reversal of the original "different invites look
different" design, requested after comparing two different guest_links'
layouts and preferring one specific arrangement over per-guest variety.
The full pairing/overlap/hero-size/start-clearance generation logic is
still live code (not a frozen data table) specifically so the locked
layout can be re-tuned later by editing constants and/or `REFERENCE_SEED`,
rather than hand-editing a ~45-entry array of numbers.

**Dialogue system** (`DialogueBox.tsx` + `src/lib/typewriter.ts`):
character-by-character typewriter reveal (~24ms/char), tap-to-skip then
tap-to-dismiss, highlighted data values (cyan, bold, delayed pop animation
once a line finishes), a "paper-cutout" jagged-edge box style (CSS
`clip-path` + grain texture) matching the felt/paper-craft art style.
Icons (calendar/location/dress-code/celebration) are inline SVG components
in `src/app/invite/[guest_link]/PartyIcons.tsx`, colored via `currentColor`
— deliberately not raster `<img>` PNGs, since those get auto-inverted/washed
out by OS-level "force dark mode" on some devices; `DialogueBox`'s `icon`
prop takes a `ReactNode`, not an image src. Character sprite plays a
"talking" wiggle while text is typing.

**Sound effects** (`src/lib/sfx.ts`): 7 SFX (coin collect, gift open, warp,
dialogue open/close, button tap, RSVP success) plus background music, all
respecting one shared mute toggle persisted to `localStorage`
(`kidkad_audio_muted`). Per-sound volume multipliers applied after a
relative-loudness pass. The mute toggle button (`AudioToggle.tsx`) uses a
semi-transparent "glass" treatment matching the title screen's Start
Mission button (`bg-white/10` + `backdrop-blur-sm` + the shared
`.glass-icon-btn` glow class in `globals.css`) rather than a solid dark
badge, with `SpeakerOnIcon`/`SpeakerOffIcon` (inline SVG in
`PartyIcons.tsx`, plain white) replacing the old flat-colored
`icon-sound-on/off.png` assets, which are now unused on disk.

**Dialogue tone system** (`src/lib/dialogue-tones.ts`): three tone template
sets (Excited & Bubbly / Sweet & Gentle / Silly & Funny) with `{token}`
placeholders (`{name}`, `{age}`, `{date}`, `{time}`, `{venue}`,
`{dresscode}`) for opening/dateTime/location/dressCode/missionComplete
lines — fully wired into the guest game for opening + mission-complete
(the coin dialogues themselves still use their own hardcoded phrasing, not
these per-tone templates — a known inconsistency, not yet asked to be
changed), plus 3 sample personal-message strings per tone used by the
`/create` form's shuffle-suggestion button.

**Customization form** (`/create`, 9-step version): Welcome (placeholder
text wordmark — see Known gaps) → child name/age → character select
(stacked rows with headshot crops of the sprites + a locked "more coming
soon" slot) → tone select (live `DialogueBox` preview using the real
child's name/age) → theme picker (stacked cards, space live + 1 locked) →
photo upload (round crop via `react-easy-crop` before upload — the cropped
square is what actually gets stored, matching the circular frame used
throughout the game) → event details (venue/date/time/dress-code/RSVP
deadline/personal message, full inline validation) → parent details
(name/email with on-blur validation/WhatsApp) → review/submit. Submits to
`/api/orders`, which generates `order_token`/`guest_link`/`admin_link`
(`src/lib/tokens.ts`, crypto-random, no external package) and inserts the
draft row. Photo upload goes through `/api/upload` to the `child-photos`
Storage bucket.

**Dashboard** (`/dashboard/[admin_link]`): RSVP table + CSV export (plain,
practical styling — Nunito, light background, intentionally not
space-themed), plus a collapsible edit section
(`EditInvitationSection.tsx`) covering every order field except
`parent_name`/`parent_email` (host-identity fields, deliberately excluded
per spec) and system-managed fields (tokens/links/payment_status/
maps_link/timestamps). Backed by `PATCH /api/orders/[admin_link]`, which
whitelists editable fields and rejects the write (403) once the party date
has passed — checked server-side, not just hidden in the UI. No
notify-guests-on-edit system exists or was requested; the host handles
that manually if needed.

## Known gaps / not yet built

- Payment flow (Toyyibpay integration) — `payment_status` column exists,
  nothing sets it to `"paid"` yet. The `/create/success` page's copy is
  written to be honest about this (no false promise of a payment step).
- Any email sending (Resend was mentioned as a placeholder in
  `src/app/api/rsvp/route.ts`'s RSVP-notification `console.log` — not
  wired up for real). Spec for the eventual post-payment email: guest link
  + "your dashboard link is ready — check back anytime to see who's
  RSVP'd", explicitly no receipt mention (Toyyibpay's separate concern) and
  no digest/cron system — single automatic send on payment confirmation.
- Multi-theme support, partially wired — `/invite/[guest_link]` now reads
  an order's `template` column and renders the matching theme
  (`getTheme()` in `src/lib/theme-config.ts`, defaulting to "space" for
  null/unrecognized values): character sprites, decorations, the ambient
  particle layer, and sky gradient are all theme-driven. A second theme,
  `dino`, is fully built and confirmed rendering correctly this way. What's
  still missing is any customer-facing way to *choose* a theme — `/create`'s
  steps (character/tone/preview previews, `ThemeSelectStep.tsx`) and
  dashboard edit's character/tone selects all still hardcode "space", so a
  dino invite today only happens by setting an existing order's `template`
  directly (e.g. via Supabase). Asset inventory, the standardized-canvas
  decoration system, and what's left to build theme-selection UI are
  documented in `public/assets/theme/README - Theme.md`.
- Migration/schema-as-code — no `supabase/` directory or migration files;
  all schema changes so far were manual SQL run by the user on request.
- Brand identity not finalized — the "KidKad" text on the `/create` welcome
  screen is a placeholder wordmark (no logo asset yet), and the navy/cyan
  palette used throughout is not confirmed as final brand colors.
- Coin dialogues (date/time, venue, dress code) still use their own
  hardcoded phrasing rather than the `DIALOGUE_TONES` per-tone templates —
  only the opening and mission-complete lines are tone-driven so far.
- Custom date/time picker — the `/create` and dashboard-edit date/time
  fields use plain native `<input type="date"/"time">`. A request to add
  an in-popup "OK" confirm button was scoped down to the minimum fallback
  (native pickers already auto-close on selection) since a real custom
  picker component was out of scope for that pass.
