# KidKad — Project Status

Digital birthday invitation game. A parent customizes an invitation for their
child's party; guests open a link, play a short scroll-driven mini-game to
reveal party details, and RSVP. The parent gets a dashboard link to see
responses. Reference doc for orienting a fresh Claude session — last updated
2026-09-06.

## Stack

- Next.js (App Router) + TypeScript, Tailwind v4
- Supabase: Postgres (`orders`, `rsvps` tables, RLS locked to `service_role`)
  + Storage (`child-photos` bucket, public read)
- Fonts: Baloo 2 (`font-display`, playful/game UI) and Nunito (`font-body`,
  practical/form UI) via `next/font/google`
- Testing discipline used throughout: `npx tsc --noEmit`, `npx eslint .`,
  `npm run build`, then a real Playwright browser session (Chromium,
  installed standalone in the session scratchpad, never a project
  dependency) driving the actual dev/prod server — never trusting code or a
  static screenshot alone
- GitHub: `https://github.com/familialiyas/kidkad-app` (private push access
  is under the `familialiyas` account — a different cached credential,
  `momenmuzik`, caused a 403 once; resolved by clearing the credential
  cache and re-authenticating)

## Routes built so far

- `/` — scaffold default, not customized yet
- `/create` — the customization form (parent-facing, pre-payment). Three
  steps today: character select → tone select (live preview) → details
  form. **App A below specifies a full rewrite of this flow's order and
  fields — see Pending work.**
- `/create/success/[order_token]` — internal verification page, dumps every
  column of the just-created draft order. Not guest-facing; built purely to
  confirm draft rows land correctly in Supabase before building
  payment/preview.
- `/invite/[guest_link]` — the guest-facing game (title → opening dialogue →
  3 coin dialogues → reward → mission complete → RSVP → "You're in!"
  return-visit screen). Space theme only; `template` column exists on
  `orders` but nothing switches on it yet.
- `/dashboard/[admin_link]` — plain RSVP list + CSV export for the host.

## Database

`orders` columns (current): `id`, `order_token`, `guest_link`, `admin_link`,
`template`, `character` (`"boy"|"girl"`), `dialogue_tone`
(`"excited"|"sweet"|"silly"`), `payment_status`
(`"draft"|"paid"|"failed"`), `child_name`, `child_age`, `child_photo_url`,
`personal_message`, `parent_name`, `parent_email`, `party_date`,
`party_time`, `party_venue`, `maps_link`, `dress_code`, `rsvp_deadline`,
`rsvp_phone_contact`, `created_at`, `completed_at`.

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
parallax starfield and decorations (`src/lib/starfield.ts`,
`src/lib/decorations.ts`, `src/lib/seeded-random.ts` — deterministic per
`guest_link`), 3 collectible coins revealing date/time, venue, and dress
code via `DialogueBox`, a reward gift leading to mission-complete, then
RSVP. Real art assets throughout (space theme), no emoji anywhere (an
earlier pass stripped all of them in favor of typography/icons).

**Dialogue system** (`DialogueBox.tsx` + `src/lib/typewriter.ts`):
character-by-character typewriter reveal (~24ms/char), tap-to-skip then
tap-to-dismiss, highlighted data values (cyan, bold, delayed pop
animation once a line finishes), a "paper-cutout" jagged-edge box style
(CSS `clip-path` + grain texture) matching the felt/paper-craft art
style, custom icons (calendar/location/dresscode/celebration/sound
on-off) at `public/assets/theme/space/icons/`. Character sprite plays a
"talking" wiggle while text is typing.

**Sound effects** (`src/lib/sfx.ts`): 7 SFX (coin collect, gift open, warp,
dialogue open/close, button tap, RSVP success) plus background music, all
respecting one shared mute toggle persisted to `localStorage`
(`kidkad_audio_muted`). Per-sound volume multipliers applied after a
relative-loudness pass.

**Dialogue tone system** (`src/lib/dialogue-tones.ts`): three tone template
sets (Excited & Bubbly / Sweet & Gentle / Silly & Funny) with `{token}`
placeholders (`{name}`, `{age}`, `{date}`, `{time}`, `{venue}`,
`{dresscode}`) for opening/dateTime/location/dressCode/missionComplete
lines, plus 3 sample personal-message strings per tone. **Currently wired
into `/create`'s tone-select live preview only — not yet wired into the
actual guest game.** See App B in Pending work below: the opening dialogue
in `GameClient.tsx` currently renders `personal_message` verbatim instead
of the tone templates, which is being corrected.

**Customization form** (`/create`, current 3-step version): character
select (large tappable sprites, glow/dim selection state) → tone select
(live `DialogueBox` preview, replays typewriter per tone) → details form
(photo upload to Supabase Storage, shuffle-suggestion button cycling
tone-matched sample messages, full inline validation — every field
required, errors shown per-field, not just a disabled submit button).
Submits to `/api/orders`, which generates `order_token`/`guest_link`/
`admin_link` (`src/lib/tokens.ts`, crypto-random, no external package) and
inserts the draft row. Photo upload goes through `/api/upload` to the
`child-photos` Storage bucket. End-to-end verified against live Supabase —
every field confirmed to land correctly, including trigger-derived
`maps_link` and the (fixed) UTC-anchored default `rsvp_deadline`
calculation.

**Dashboard** (`/dashboard/[admin_link]`): plain table of RSVPs + CSV
export. Nunito throughout, no space theme (intentionally practical/admin,
not game UI) — **App A #3 below asks for this to change on the form steps,
not explicitly the dashboard.**

## Pending work (specified, not yet implemented)

Two bundled requests came in together and implementation was interrupted
before starting. Both are fully specified and ready to build — recorded
here verbatim-in-spirit so nothing is lost.

### App B — one wiring fix (guest game)

Current (wrong) behavior: `personal_message` renders as the *entire opening
dialogue*, right after "Start Mission," before any coins are collected.

Correct behavior:
1. Opening dialogue reverts to being fully auto-generated from the existing
   tone templates (`src/lib/dialogue-tones.ts`), using the child's name and
   age — no `personal_message` involved. This was the original design;
   needs re-wiring `GameClient.tsx`'s opening-dialogue `segments` back onto
   `DIALOGUE_TONES[order.dialogue_tone].opening` (filled via
   `fillTemplate`) instead of `order.personal_message`.
2. `personal_message` moves to the mission-complete screen, after all coins
   are collected, as a separate labeled dialogue box — not styled like the
   structured coin dialogues (plain text, no data injection/highlighting).
   - Label above the box: "[child's name] says"
   - Content: `personal_message`, verbatim, no highlighting/icons
   - Sits above the RSVP button
3. Confirm once done: opening dialogue should read like the original
   hardcoded example ("Hi! I'm Ziyad and I'm turning 5! Help me collect all
   my mission coins!"), and `personal_message` should no longer appear
   anywhere before mission complete.

### App A — flow and copy revisions (`/create` form)

1. **Flow order (fun-first)** — full sequence becomes: Welcome → child's
   name & age (quick hook) → pick character → pick tone → pick theme →
   upload photo → event details → parent details → preview → payment →
   live link delivered. This is a bigger restructure than the current
   3-step form — splits what's currently "Step 3" into several smaller
   steps and reorders photo upload.
2. **Welcome page** (new) — tagline: "give your birthday invite main
   character energy"; CTA button: "let's get started".
3. **Visual consistency** — all screens, including the plain-form steps
   (currently white/default browser styling in `DetailsFormStep.tsx`),
   need to match the dark space theme already used in character/tone
   selection: same background, input styling, button style, fonts. No jump
   to a generic white form mid-flow.
4. **Theme picker** (new step) — stacked card layout, not a swipe
   carousel (revisit once 3+ themes exist). Only 2 slots: space theme
   (live) + one "coming soon" locked card, clearly not selectable yet.
5. **Photo upload** — moves to the last step within the "fun" section
   (after theme, before event details), not first. Add a short privacy
   explainer next to the upload button (e.g. only people with the link can
   see this photo, not indexed/searchable).
6. **Venue field** — simplify from separate name/address into one
   freeform "venue location" text field. Placeholder: "e.g. Tropicana Golf
   Club, Petaling Jaya".
7. **Dress code field** — placeholder: "e.g. Casual, Black & White,
   Space".
8. **WhatsApp number field** — placeholder: "60123456789". Purpose is
   guest-facing only (so guests can contact the host) — explicitly NOT
   used for any host notification/ping system.
9. **Personal message field** — label: "what do you want to say to your
   guests"; helper text: "this shows up as a personal note in the game —
   write it like you're talking directly to whoever's coming". (This
   labeling should make the App B destination — the mission-complete
   screen — make sense to the parent filling it in.)
10. **Email field** — add inline validation (invalid format → visible
    error), on blur or submit. `DetailsFormStep.tsx` already has a regex
    check on submit; needs an on-blur check too per this spec.
11. **RSVP deadline field** — keep current behavior (auto-populate at
    party date minus 3 days, editable). Already correct — the UTC-anchored
    fix from the prior session is the one to keep.
12. **No placeholder prefill needed** for: child's name, age, personal
    message, parent name — fine as-is.
13. **Post-payment email copy** — contains the guest game link + "your
    dashboard link is ready — check back anytime to see who's RSVP'd". Must
    NOT mention payment receipt (Toyyibpay handles that separately, to a
    possibly different email — cannot control or promise it).
14. **Notifications** — no digest, no scheduled/cron system. A single
    automatic email on payment confirmation only (#13). Zero recurring
    jobs.

Neither payment (Toyyibpay) nor the post-payment email system exists yet —
both are referenced by App A #13/#14 as future/adjacent work, not
implemented in this codebase yet.

## Known gaps / not yet built

- Payment flow (Toyyibpay integration) — `payment_status` column exists,
  nothing sets it to `"paid"` yet.
- Any email sending (Resend was mentioned as a placeholder in
  `src/app/api/rsvp/route.ts`'s RSVP-notification `console.log` — not
  wired up for real).
- Multi-theme support — `template` column exists, only "space" assets
  exist, nothing branches on the value yet.
- Migration/schema-as-code — no `supabase/` directory or migration files;
  all schema changes so far were manual SQL run by the user on request.
- Brand identity not finalized — the "KidKad" text on the `/create` welcome
  screen is a placeholder wordmark (no logo asset yet), and the navy/cyan
  palette used throughout is not confirmed as final brand colors.
