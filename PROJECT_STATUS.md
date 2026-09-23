# KoolKad — Project Status

Digital birthday invitation game. A parent customizes an invitation for their
child's party; guests open a link, play a short scroll-driven mini-game to
reveal party details, and RSVP. The parent gets a dashboard link to see
responses and edit the invitation. Reference doc for orienting a fresh Claude
session — last updated 2026-09-23.

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

- `/` — the real marketing landing page (v2, dark charcoal + orange wizard
  chrome). Hero fits one viewport with no scroll: wordmark, a headline word
  that rotates through Leveled Up/Gamified/More Fun/Entertaining on a fade
  (`landing/RotatingWord.tsx`), and a phone-mockup frame crossfading through
  5 real screenshots captured from the live app
  (`landing/PhoneMockupCarousel.tsx`, assets in `public/assets/landing/hero/`
  — title screen, a coin dialogue, the gift-open moment, the RSVP form, the
  dashboard), plus a single glowing "Create Yours Now" CTA. Below the fold:
  a theme-showcase grid (space/dino/ocean cards tinted with each theme's own
  `uiColors.accentRgb` so they visually pop against the charcoal, plus a
  desaturated locked "more worlds coming soon" 4th card) and a 5-step "How
  It Works" list with icon badges (`landing/LandingIcons.tsx`, same inline-
  SVG language as the game's `PartyIcons.tsx`). See "Wizard chrome palette"
  below for the color system this and `/create` share.
- `/create` — the customization form (parent-facing, pre-payment). Nine
  steps: Welcome (KoolKad wordmark — "Kool" in accent orange, "Kad" in
  white — plus a secondary tagline) → Meet Your Star (name+age) → Pick A
  Theme → Pick Your Character → Pick A Voice (tone) → Add A Photo (with
  crop) → Share Your Party Details → Share Your Details (parent info) →
  Review/submit. Theme selection now happens right after name/age, before
  character/tone (see "Multi-theme support" below for why). Dark
  wizard-chrome throughout, no plain-white steps. Party date and RSVP
  deadline inputs both reject past dates (`min` set to today's local date,
  plus matching validation on submit).
- `/create/success/[order_token]` — post-submit landing page. Leads with
  copyable guest/admin links ("Your invitation is ready!"), each with both
  an "Open link" and a "Copy link" button, full field dump collapsed below
  for verification. Payment is fully wired up (see "Payment integration"
  below) — this page shows the links once `payment_status` is `"paid"`, and
  a polling "waiting on payment" panel otherwise.
- `/invite/[guest_link]` — the guest-facing game (title → opening dialogue
  → 3 coin dialogues → mission-complete ceremony → reward gift → RSVP →
  "You're in!" return-visit screen). Renders whichever of the three themes
  (space/dino/ocean) the order's `template` column names — see "Multi-theme
  support" below. The opening dialogue shows a one-time "scroll down to
  explore and collect coins!" hint (a muted pill badge with a bouncing
  chevron, visually subordinate to the primary "Tap anywhere to continue"
  line) so first-time players know scrolling, not tapping, moves the world.
  Each theme plays its own background music track (`ThemeAssets.
  backgroundMusicSrc`, `public/assets/theme/<name>/audio/<name>-bgm.mp3`),
  not one shared track.
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
assets throughout (theme-driven — space/dino/ocean, see "Multi-theme
support" below), no emoji anywhere, no raster PNG icons for dialogue/party-
detail icons either (see below).

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
onto space's 20 slot names per an explicit table the user provided directly
(see `themes.dino.decorations` in `theme-config.ts` and the matching table
in the theme README), not a role/visual-weight heuristic. Adding a future
theme means supplying 20 assets and slotting them into these exact 20
names (`rocket`, `sun`, `planet-01`…`planet-07`, `moon-01`,
`moon-crescent`, `star`, `star-cluster`, `comet`, `asteroid`,
`alien-01`…`alien-03`, `ufo-01`, `ufo-02` — note `ufo-01`, not `ufo`, to
match the actual asset filename) — TypeScript's `Record<SlotName, string>`
refuses to compile if any slot is missing — no decorations.ts changes,
ever.

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
"talking" wiggle while text is typing. Every real in-game dialogue also
renders an always-available "×" close button (top-right of the card,
`onClose` prop) that immediately returns to the free-roam game screen,
bypassing the typing-aware tap-to-dismiss flow entirely — the one exception
is `/create`'s `ToneSelectStep.tsx` live tone-preview box, which has no game
state to close back to and omits the prop.

**Sound effects** (`src/lib/sfx.ts`): 7 SFX (coin collect, gift open, warp,
dialogue open/close, button tap, RSVP success) plus background music, all
respecting one shared mute toggle persisted to `localStorage`
(`koolkad_audio_muted`). Per-sound volume multipliers applied after a
relative-loudness pass. The mute toggle button (`AudioToggle.tsx`) uses a
semi-transparent "glass" treatment matching the title screen's Start
Mission button (`bg-white/10` + `backdrop-blur-sm` + the shared
`.glass-icon-btn` glow class in `globals.css`) rather than a solid dark
badge, with `SpeakerOnIcon`/`SpeakerOffIcon` (inline SVG in
`PartyIcons.tsx`, plain white) replacing the old flat-colored
`icon-sound-on/off.png` assets, which are now unused on disk.

**Top HUD row** (`GameWorld.tsx` + `GameClient.tsx`, gameplay screens only):
mute toggle (left), coin-count pill (centered — `left-1/2` +
`-translate-x-1/2`, which needs no frame-aware offset math since the game
frame is itself viewport-centered), and the menu burger button (right), all
pinned `top-4` in one row via `position: fixed`. The edge-anchored buttons
still resolve their offsets against the frame's edges via
`frameInset()`/`frameWidth()` (`game-constants.ts`); the centered coin pill
doesn't need those helpers.

**Dialogue tone system** (`src/lib/dialogue-tones.ts`): three tone template
sets (Excited & Bubbly / Sweet & Gentle / Silly & Funny) with `{token}`
placeholders (`{name}`, `{age}`, `{date}`, `{time}`, `{venue}`,
`{dresscode}`) for opening/dateTime/location/dressCode/missionComplete
lines — fully wired into the guest game for opening + mission-complete
(the coin dialogues themselves still use their own hardcoded phrasing, not
these per-tone templates — a known inconsistency, not yet asked to be
changed), plus 3 sample personal-message strings per tone used by the
`/create` form's shuffle-suggestion button — written in a genuine young
child's voice (e.g. "I can't wait to see you at my party, it's going to be
SO fun!!"), not the adult wry/meme-style phrasing an earlier pass used.

**Customization form** (`/create`, 9-step version): Welcome (styled text
wordmark — see Known gaps) → child name/age → theme picker (stacked cards,
all three of space/dino/ocean live and selectable, no locked entries) →
character select (stacked rows with headshot crops of the selected theme's
sprites + a locked "more coming soon" slot) → tone select (live
`DialogueBox` preview using the real child's name/age, themed to the
selected theme) → photo upload (round crop via `react-easy-crop` before
upload — the cropped square is what actually gets stored, matching the
circular frame used throughout the game) → event details (venue/date/
time/dress-code/RSVP deadline/personal message, full inline validation,
backdating blocked) → parent details (name/email with on-blur
validation/WhatsApp) → review/submit. Submits to `/api/orders`, which
generates `order_token`/`guest_link`/`admin_link` (`src/lib/tokens.ts`,
crypto-random, no external package) and inserts the draft row. Photo
upload goes through `/api/upload` to the `child-photos` Storage bucket.

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

**Payment integration** (ToyyibPay, `src/app/api/create-payment/route.ts` +
`src/app/api/toyyibpay-callback/route.ts`): fully wired up and confirmed
working end-to-end with a real payment. `POST /api/create-payment` (called
from `/create`'s review step, and from the in-game menu for an
already-created-but-unpaid order) creates a bill via ToyyibPay's API and
returns a `billCode`; the client redirects to `https://toyyibpay.com/
{billCode}`. `billReturnUrl` (where the payer lands after paying) and
`billCallbackUrl` (the server-to-server webhook that actually flips
`payment_status`) are both built from a single hardcoded `SITE_URL`
constant — pinned to the deployed production URL, not derived from the
request host, since ToyyibPay can't reach localhost. The callback route
verifies ToyyibPay's MD5 hash before trusting the payload, writes
`payment_status` to `"paid"`/`"failed"` accordingly (a `"2"` pending status
gets no write — the order stays `"draft"` until a final callback arrives),
and always returns 200 so ToyyibPay doesn't retry forever against an
already-broken write. `billName` is `"KoolKad Invitation"`.

**Domain**: production is `https://birthday.koolkad.com` (Vercel domain,
DNS delegated to Cloudflare for `koolkad.com`). `koolkad.vercel.app` and
`kidkad.vercel.app` remain active as secondary domains at the Vercel
dashboard level (the latter 307-redirects to the former) so old links keep
working — `SITE_URL` above only ever points at the one primary domain,
never a secondary one, since ToyyibPay's callback needs a single stable
target.

**Rebrand**: the product is "KoolKad", not "KidKad" — renamed everywhere
that matters: user-visible copy (wordmark, watermark, WhatsApp share text,
ToyyibPay bill name), `package.json`'s name, localStorage keys (audio mute,
create-draft, RSVP cache), ICS calendar branding, server log prefixes, and
docs. The GitHub repo itself is still `familialiyas/kidkad-app` (not
renamed) and `koolkad.vercel.app`/`kidkad.vercel.app` secondary-domain
references were deliberately left alone since those are real, still-active
infrastructure, not stale branding text.

**Wizard chrome palette** (`globals.css`'s `--color-wizard-*` tokens,
`@theme` block): a fixed neutral-charcoal base (`#18181b` bg, `#232326`
panel) that both `/create` and `/` share, independent of any order's own
theme colors. The accent color has been revised several times — cyan/navy
→ warm amber (dropped for sitting too close to the dino theme's own
palette) → violet-magenta → purple → monochrome white → **orange
(`#f97316`/`#fdba74`/`#ffedd5`)**, the current and (for now) final choice.
Applies to buttons, selected-state borders, headings, and the active step
label across every `/create` step and `/`.

## Known gaps / not yet built

- Any email sending (Resend was mentioned as a placeholder in
  `src/app/api/rsvp/route.ts`'s RSVP-notification `console.log` — not
  wired up for real). Spec for the eventual post-payment email: guest link
  + "your dashboard link is ready — check back anytime to see who's
  RSVP'd", explicitly no receipt mention (Toyyibpay's separate concern) and
  no digest/cron system — single automatic send on payment confirmation.
- Multi-theme support — fully wired for new orders, three real themes.
  `/invite/[guest_link]` reads an order's `template` column and renders the
  matching theme (`getTheme()` in `src/lib/theme-config.ts`, defaulting to
  "space" for null/unrecognized values): character sprites, decorations,
  the ambient particle layer, and sky gradient are all theme-driven.
  `space`, `dino`, and `ocean` are all fully built and confirmed rendering
  correctly (dino's 20-slot decoration mapping and sky gradient were each
  revised once after initial build; ocean was added complete in one pass
  using the same 20-slot mapping convention — see
  `public/assets/theme/README - Theme.md` for each theme's asset table).
  `/create`'s `ThemeSelectStep.tsx` is now step 2 of the flow (before
  character/tone) and offers all three as real, selectable cards — a
  customer picks their theme up front, and `CharacterSelectStep.tsx`,
  `ToneSelectStep.tsx`, and `PreviewStep.tsx` all read that selection
  instead of hardcoding "space". What's still missing: dashboard edit
  (`EditInvitationSection.tsx`) has no theme field at all — an
  already-created order's `template` can only be changed directly via
  Supabase, not from the dashboard UI. Asset inventory, the
  standardized-canvas decoration system, and how to add a future theme are
  documented in `public/assets/theme/README - Theme.md`.
- Migration/schema-as-code — no `supabase/` directory or migration files;
  all schema changes so far were manual SQL run by the user on request.
- No real logo asset — the wordmark on `/create`'s welcome screen and on
  `/` is still styled text ("Kool" in accent orange + "Kad" in white), not
  an image/SVG logo.
- Coin dialogues (date/time, venue, dress code) still use their own
  hardcoded phrasing rather than the `DIALOGUE_TONES` per-tone templates —
  only the opening and mission-complete lines are tone-driven so far.
- Custom date/time picker — the `/create` and dashboard-edit date/time
  fields use plain native `<input type="date"/"time">` (`min` now set to
  today's date to block backdating, see "Routes" above). A request to add
  an in-popup "OK" confirm button was scoped down to the minimum fallback
  (native pickers already auto-close on selection) since a real custom
  picker component was out of scope for that pass.
- `/`'s hero phone-mockup screenshots (`public/assets/landing/hero/
  screenshot-{1..5}.png`) are static images captured once from a live dev
  session, not live-rendered — if the game's UI, wizard-chrome palette, or
  wordmark changes again, these will silently go stale and need re-
  capturing manually (see the landing-page-v2 commit for the capture
  script and the guest_link/admin_link test orders used). Two of the three
  sample orders used were draft/unpaid test orders; capturing them without
  the "KoolKad Preview" watermark required temporarily hardcoding
  `GameClient.tsx`'s `showWatermark`/`isPreview` to `false` for that one
  local session, then fully reverting before committing — worth knowing if
  a future re-capture needs the same trick.
