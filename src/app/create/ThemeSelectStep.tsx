"use client";

import { THEME_CONFIG, type ThemeName } from "@/lib/theme-config";
import { playSfx } from "@/lib/sfx";
import StepShell from "./StepShell";

const THEME_CARDS: { key: ThemeName; label: string; subtitle: string }[] = [
  { key: "space", label: "Space Mission", subtitle: "Astronauts, planets, and coins" },
  { key: "dino", label: "Dino Mission", subtitle: "Dinosaurs, volcanoes, and eggs" },
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
                  ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_24px_4px_rgba(34,211,238,0.35)]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div
                className="h-16 w-16 shrink-0 rounded-xl"
                style={{ background: THEME_CONFIG.themes[card.key].skyGradient }}
                aria-hidden
              />
              <div className="flex-1 text-left">
                <p className="font-display text-base font-bold text-white">{card.label}</p>
                <p className="font-body text-xs text-cyan-100/70">{card.subtitle}</p>
              </div>
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
          <div className="h-16 w-16 shrink-0 rounded-xl bg-white/10" aria-hidden />
          <div className="flex-1 text-left">
            <p className="font-display text-base font-bold text-white/70">More coming soon</p>
            <p className="font-body text-xs text-cyan-100/50">Ocean is on its way</p>
          </div>
          <span className="font-display rounded-full border-2 border-white/20 px-3 py-1 text-xs font-bold text-white/50">
            Locked
          </span>
        </div>
      </div>
    </StepShell>
  );
}
