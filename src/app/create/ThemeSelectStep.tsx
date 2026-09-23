"use client";

import { THEME_CONFIG, type ThemeName } from "@/lib/theme-config";
import { playSfx } from "@/lib/sfx";
import StepShell from "./StepShell";

// A single iconic, instantly-recognizable asset per theme (not derived from
// DECORATION_SLOTS — that mapping is chosen for in-game role/visual weight,
// not for "reads clearly as this theme at 64px", which is what this card
// needs) — swapped in as the actual preview art instead of a flat color
// swatch.
const THEME_CARDS: { key: ThemeName; label: string; subtitle: string; previewSrc: string }[] = [
  {
    key: "space",
    label: "Space Mission",
    subtitle: "Astronauts, planets, and coins",
    previewSrc: "/assets/theme/space/decorations/rocket.png",
  },
  {
    key: "dino",
    label: "Dino Mission",
    subtitle: "Dinosaurs, volcanoes, and eggs",
    previewSrc: "/assets/theme/dino/decorations/dino-01.png",
  },
  {
    key: "ocean",
    label: "Ocean Mission",
    subtitle: "Reefs, shipwrecks, and sea friends",
    previewSrc: "/assets/theme/ocean/decorations/nemo.png",
  },
];

export default function ThemeSelectStep({
  selected,
  onSelect,
  onBack,
  onContinue,
}: {
  selected: ThemeName | null;
  onSelect: (theme: ThemeName) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <StepShell
      stepLabel="Step 2 of 8"
      title="Pick A Theme"
      subtitle="Choose the world your invitation lives in."
      onBack={onBack}
      onContinue={onContinue}
      continueDisabled={!selected}
      starSeed="kidkad-create-form-theme"
    >
      <div className="flex flex-col gap-3">
        {THEME_CARDS.map((card) => {
          const isSelected = selected === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                playSfx("buttonTap");
                onSelect(card.key);
              }}
              className={`flex items-center gap-4 rounded-2xl border-4 p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-wizard-accent bg-wizard-accent/10 shadow-[0_0_24px_4px_rgba(224,168,62,0.35)]"
                  : "border-wizard-border bg-wizard-panel/40"
              }`}
            >
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl p-1.5"
                style={{ background: THEME_CONFIG.themes[card.key].skyGradient }}
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.previewSrc}
                  alt=""
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="font-display text-wizard-text text-base font-bold">{card.label}</p>
                <p className="font-body text-wizard-text-muted text-xs">{card.subtitle}</p>
              </div>
              <span
                className={`font-display shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  isSelected
                    ? "bg-wizard-accent text-wizard-bg"
                    : "border-wizard-border text-wizard-text-muted border-2"
                }`}
              >
                {isSelected ? "Selected" : "Select"}
              </span>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
