import Link from "next/link";
import { THEME_CONFIG, type ThemeName } from "@/lib/theme-config";
import StarfieldBackground from "./create/StarfieldBackground";

const ctaButtonClass =
  "font-display bg-wizard-accent text-wizard-bg hover:bg-wizard-accent-light inline-block rounded-full px-10 py-4 text-lg font-bold shadow-lg transition active:scale-95";

// Same copy as ThemeSelectStep.tsx's theme-picker cards — kept in sync
// manually since this page and that step show the same 3 themes for
// different purposes (marketing preview vs. an actual selectable form
// control) and don't share a component.
const THEME_SHOWCASE: {
  key: ThemeName;
  label: string;
  subtitle: string;
  character: string;
  decorations: [string, string];
}[] = [
  {
    key: "space",
    label: "Space Mission",
    subtitle: "Astronauts, planets, and coins",
    character: "/assets/theme/space/characters/astrogirl-idle.png",
    decorations: [
      "/assets/theme/space/decorations/rocket.png",
      "/assets/theme/space/decorations/planet-01.png",
    ],
  },
  {
    key: "dino",
    label: "Dino Mission",
    subtitle: "Dinosaurs, volcanoes, and eggs",
    character: "/assets/theme/dino/characters/dinogirl-idle.png",
    decorations: [
      "/assets/theme/dino/decorations/volcano.png",
      "/assets/theme/dino/decorations/egg.png",
    ],
  },
  {
    key: "ocean",
    label: "Ocean Mission",
    subtitle: "Reefs, shipwrecks, and sea friends",
    character: "/assets/theme/ocean/characters/aquagirl-idle.png",
    decorations: [
      "/assets/theme/ocean/decorations/nemo.png",
      "/assets/theme/ocean/decorations/shipwreck.png",
    ],
  },
];

const HOW_IT_WORKS = [
  {
    title: "Pick your world",
    description: "Space, dino, or ocean — you choose the vibe.",
  },
  {
    title: "Make it yours",
    description: "Add the birthday deets, pick a voice, upload a pic. Done in minutes.",
  },
  {
    title: "Send the mission",
    description: "One link. Drop it in the group chat and let the countdown begin.",
  },
  {
    title: "Guests go on an adventure",
    description:
      "They scroll, collect coins, and unlock your party details like it's a mini game — not just another boring invite.",
  },
  {
    title: "Watch the RSVPs roll in",
    description: "Track who's coming, right from your own dashboard.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <StarfieldBackground seed="koolkad-landing" />

      {/* HERO */}
      <section className="relative mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
        <h1 className="font-display text-wizard-text text-5xl font-bold tracking-wide drop-shadow-[0_0_20px_rgba(249,115,22,0.6)] sm:text-7xl">
          <span className="text-wizard-accent">Kool</span>Kad
        </h1>
        <p className="font-display text-wizard-accent-light mt-4 text-xl font-bold sm:text-2xl">
          Your Birthday Invite, Leveled Up.
        </p>
        <Link href="/create" className={`${ctaButtonClass} mt-8`}>
          Create Yours
        </Link>
      </section>

      {/* THEME SHOWCASE */}
      <section className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <h2 className="font-display text-wizard-text text-center text-2xl font-bold sm:text-3xl">
          Pick Your World
        </h2>
        <p className="font-body text-wizard-text-muted mt-2 text-center text-sm sm:text-base">
          Every invitation is a mini adventure, themed your way.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {THEME_SHOWCASE.map((t) => (
            <div
              key={t.key}
              className="border-wizard-border bg-wizard-panel/40 flex flex-col rounded-2xl border-4 p-4"
            >
              <div
                className="relative flex h-40 items-end justify-center overflow-hidden rounded-xl"
                style={{ background: THEME_CONFIG.themes[t.key].skyGradient }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.decorations[0]}
                  alt=""
                  className="absolute top-3 left-3 h-10 w-10 object-contain opacity-90"
                  draggable={false}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.decorations[1]}
                  alt=""
                  className="absolute top-4 right-3 h-9 w-9 object-contain opacity-90"
                  draggable={false}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.character}
                  alt=""
                  className="relative h-32 w-32 object-contain object-bottom"
                  draggable={false}
                />
              </div>
              <p className="font-display text-wizard-text mt-3 text-base font-bold">{t.label}</p>
              <p className="font-body text-wizard-text-muted text-xs">{t.subtitle}</p>
            </div>
          ))}

          <div className="border-wizard-locked bg-wizard-locked/20 flex flex-col items-center justify-center gap-2 rounded-2xl border-4 p-4 text-center opacity-60">
            <span className="bg-wizard-locked h-16 w-16 shrink-0 rounded-full" aria-hidden />
            <p className="font-display text-wizard-text-muted text-base font-bold">
              More worlds coming soon
            </p>
            <span className="font-display border-wizard-locked text-wizard-text-muted rounded-full border-2 px-3 py-1 text-xs font-bold">
              Locked
            </span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <h2 className="font-display text-wizard-text text-center text-2xl font-bold sm:text-3xl">
          How It Works
        </h2>

        <ol className="mt-8 flex flex-col gap-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li
              key={step.title}
              className="border-wizard-border bg-wizard-panel/40 flex gap-4 rounded-2xl border-4 p-4"
            >
              <span className="font-display bg-wizard-accent text-wizard-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold">
                {i + 1}
              </span>
              <div>
                <p className="font-display text-wizard-text text-base font-bold">{step.title}</p>
                <p className="font-body text-wizard-text-muted mt-1 text-sm">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FINAL CTA */}
      <section className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <h2 className="font-display text-wizard-text text-2xl font-bold sm:text-3xl">
          Ready to level up your invite?
        </h2>
        <Link href="/create" className={`${ctaButtonClass} mt-6`}>
          Create Yours
        </Link>
      </section>
    </div>
  );
}
