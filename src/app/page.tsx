import Link from "next/link";
import { THEME_CONFIG, type ThemeName } from "@/lib/theme-config";
import StarfieldBackground from "./create/StarfieldBackground";
import RotatingWord from "./landing/RotatingWord";
import PhoneMockupCarousel from "./landing/PhoneMockupCarousel";
import { GlobeIcon, EditIcon, SendIcon, CompassIcon, ChartIcon } from "./landing/LandingIcons";

const heroCtaClass =
  "font-display bg-wizard-accent text-wizard-bg hover:bg-wizard-accent-light inline-block rounded-full px-10 py-4 text-lg font-bold shadow-[0_0_45px_rgba(249,115,22,0.65)] transition active:scale-95 sm:px-12 sm:py-5 sm:text-xl";
const ctaClass =
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
    Icon: GlobeIcon,
    title: "Pick your world",
    description: "Space, dino, or ocean — you choose the vibe.",
  },
  {
    Icon: EditIcon,
    title: "Make it yours",
    description: "Add the birthday deets, pick a voice, upload a pic. Done in minutes.",
  },
  {
    Icon: SendIcon,
    title: "Send the mission",
    description: "One link. Drop it in the group chat and let the countdown begin.",
  },
  {
    Icon: CompassIcon,
    title: "Guests go on an adventure",
    description:
      "They scroll, collect coins, and unlock your party details like it's a mini game — not just another boring invite.",
  },
  {
    Icon: ChartIcon,
    title: "Watch the RSVPs roll in",
    description: "Track who's coming, right from your own dashboard.",
  },
];

export default function Home() {
  return (
    <div className="relative">
      <StarfieldBackground seed="koolkad-landing" />

      {/* HERO — fits one viewport, no scroll needed */}
      <section className="relative flex h-screen flex-col items-center justify-center gap-3 overflow-hidden px-4 text-center sm:gap-5">
        <h1 className="font-display text-wizard-text text-3xl font-bold tracking-wide drop-shadow-[0_0_16px_rgba(249,115,22,0.5)] sm:text-5xl">
          <span className="text-wizard-accent">Kool</span>Kad
        </h1>
        <h2 className="font-display text-wizard-text max-w-xs text-xl font-bold sm:max-w-xl sm:text-3xl">
          Your Birthday Invite, <RotatingWord />.
        </h2>

        <PhoneMockupCarousel />

        <Link href="/create" className={heroCtaClass}>
          Create Yours Now
        </Link>
      </section>

      {/* THEME SHOWCASE */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="font-display text-wizard-text text-center text-2xl font-bold sm:text-3xl">
          Pick Your World
        </h2>
        <p className="font-body text-wizard-text-muted mt-2 text-center text-sm sm:text-base">
          Every invitation is a mini adventure, themed your way.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {THEME_SHOWCASE.map((t) => {
            const rgb = THEME_CONFIG.themes[t.key].uiColors.accentRgb;
            return (
              <div
                key={t.key}
                className="relative flex flex-col overflow-hidden rounded-3xl border-2 p-5"
                style={{
                  borderColor: `rgb(${rgb} / 0.35)`,
                  background: `linear-gradient(160deg, rgb(${rgb} / 0.18), var(--color-wizard-panel) 65%)`,
                  boxShadow: `0 16px 44px -18px rgb(${rgb} / 0.6)`,
                }}
              >
                <div
                  className="relative flex h-44 items-end justify-center overflow-hidden rounded-2xl"
                  style={{ background: THEME_CONFIG.themes[t.key].skyGradient }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.decorations[0]}
                    alt=""
                    className="absolute top-3 left-3 h-11 w-11 object-contain opacity-90"
                    draggable={false}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.decorations[1]}
                    alt=""
                    className="absolute top-4 right-3 h-10 w-10 object-contain opacity-90"
                    draggable={false}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.character}
                    alt=""
                    className="relative h-36 w-36 object-contain object-bottom"
                    draggable={false}
                  />
                </div>
                <p className="font-display text-wizard-text mt-4 text-lg font-bold">{t.label}</p>
                <p className="font-body text-wizard-text-muted text-sm">{t.subtitle}</p>
              </div>
            );
          })}

          <div className="border-wizard-locked bg-wizard-locked/20 flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-5 text-center opacity-60 grayscale">
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
      <section className="relative mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <h2 className="font-display text-wizard-text text-center text-2xl font-bold sm:text-3xl">
          How It Works
        </h2>

        <ol className="mt-10 flex flex-col gap-5">
          {HOW_IT_WORKS.map((step) => (
            <li
              key={step.title}
              className="border-wizard-border bg-wizard-panel/60 flex items-start gap-4 rounded-3xl border-2 p-6 shadow-[0_10px_35px_-15px_rgba(0,0,0,0.7)]"
            >
              <span className="bg-wizard-accent/15 text-wizard-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                <step.Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-wizard-text text-lg font-bold">{step.title}</p>
                <p className="font-body text-wizard-text-muted mt-1 text-sm leading-relaxed">
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
        <Link href="/create" className={`${ctaClass} mt-6`}>
          Create Yours Now
        </Link>
      </section>
    </div>
  );
}
