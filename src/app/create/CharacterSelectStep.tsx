"use client";

import { THEME_CONFIG, type ThemeName } from "@/lib/theme-config";
import type { Character } from "@/lib/types";
import { playSfx } from "@/lib/sfx";
import StepShell from "./StepShell";

export default function CharacterSelectStep({
  theme,
  selected,
  onSelect,
  onBack,
  onContinue,
}: {
  /** The theme picked in the previous step — drives which sprite pair
   * (and character names) render here, e.g. Astroboy/Astrogirl for space,
   * Dinoboy/Dinogirl for dino. */
  theme: ThemeName;
  selected: Character | null;
  onSelect: (character: Character) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const themeAssets = THEME_CONFIG.themes[theme];
  const cards: { key: Character; label: string }[] = [
    { key: "boy", label: themeAssets.characterNames.boy },
    { key: "girl", label: themeAssets.characterNames.girl },
  ];

  return (
    <StepShell
      stepLabel="Step 3 of 8"
      title="Pick Your Character"
      onBack={onBack}
      onContinue={onContinue}
      continueDisabled={!selected}
      starSeed="kidkad-create-form"
    >
      <div className="flex flex-col gap-3">
        {cards.map((card) => {
          const isSelected = selected === card.key;
          const sprite = themeAssets.characterSprites[card.key].idle;
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
              {/* Headshot crop of the full-body sprite — scales better as a
                  list than the previous large full-body cards, especially
                  once more characters are added. */}
              <span className="bg-wizard-panel-deep h-16 w-16 shrink-0 overflow-hidden rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sprite}
                  alt={card.label}
                  className="h-full w-full object-cover object-top"
                  draggable={false}
                />
              </span>
              <span className="font-display text-wizard-text flex-1 text-base font-bold">
                {card.label}
              </span>
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

        <div className="border-wizard-locked bg-wizard-locked/20 flex items-center gap-4 rounded-2xl border-4 p-4 opacity-60">
          <span className="bg-wizard-locked h-16 w-16 shrink-0 rounded-full" aria-hidden />
          <span className="font-display text-wizard-text-muted flex-1 text-base font-bold">
            More coming soon
          </span>
          <span className="font-display border-wizard-locked text-wizard-text-muted rounded-full border-2 px-3 py-1 text-xs font-bold">
            Locked
          </span>
        </div>
      </div>
    </StepShell>
  );
}
