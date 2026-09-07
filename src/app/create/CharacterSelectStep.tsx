"use client";

import { THEME_CONFIG } from "@/lib/theme-config";
import type { Character } from "@/lib/types";
import { playSfx } from "@/lib/sfx";
import StepShell from "./StepShell";

export default function CharacterSelectStep({
  selected,
  onSelect,
  onBack,
  onContinue,
}: {
  selected: Character | null;
  onSelect: (character: Character) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const cards: { key: Character; label: string }[] = [
    { key: "boy", label: "Astro Boy" },
    { key: "girl", label: "Astro Girl" },
  ];

  return (
    <StepShell
      stepLabel="Step 2 of 8"
      title="Pick Your Character"
      onBack={onBack}
      onContinue={onContinue}
      continueDisabled={!selected}
      starSeed="kidkad-create-form"
    >
      <div className="flex flex-col gap-3">
        {cards.map((card) => {
          const isSelected = selected === card.key;
          const sprite = THEME_CONFIG.characterSprites[card.key].idle;
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
                  ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_24px_4px_rgba(34,211,238,0.35)]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {/* Headshot crop of the full-body sprite — scales better as a
                  list than the previous large full-body cards, especially
                  once more characters are added. */}
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sprite}
                  alt={card.label}
                  className="h-full w-full object-cover object-top"
                  draggable={false}
                />
              </span>
              <span className="font-display flex-1 text-base font-bold text-white">
                {card.label}
              </span>
              <span
                className={`font-display shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  isSelected
                    ? "bg-cyan-400 text-slate-900"
                    : "border-2 border-white/20 text-white/50"
                }`}
              >
                {isSelected ? "Selected" : "Select"}
              </span>
            </button>
          );
        })}

        <div className="flex items-center gap-4 rounded-2xl border-4 border-white/10 bg-white/5 p-4 opacity-60">
          <span className="h-16 w-16 shrink-0 rounded-full bg-white/10" aria-hidden />
          <span className="font-display flex-1 text-base font-bold text-white/70">
            More coming soon
          </span>
          <span className="font-display shrink-0 rounded-full border-2 border-white/20 px-3 py-1 text-xs font-bold text-white/50">
            Locked
          </span>
        </div>
      </div>
    </StepShell>
  );
}
