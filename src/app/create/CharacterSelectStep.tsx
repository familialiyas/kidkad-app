"use client";

import { THEME_CONFIG } from "@/lib/theme-config";
import type { Character } from "@/lib/types";
import { playSfx } from "@/lib/sfx";
import StarfieldBackground from "./StarfieldBackground";

export default function CharacterSelectStep({
  selected,
  onSelect,
  onContinue,
}: {
  selected: Character | null;
  onSelect: (character: Character) => void;
  onContinue: () => void;
}) {
  const cards: { key: Character; label: string }[] = [
    { key: "boy", label: "Astro Boy" },
    { key: "girl", label: "Astro Girl" },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <StarfieldBackground />

      <div>
        <p className="font-display text-xs font-bold tracking-widest text-cyan-300/70 uppercase">
          Step 1 of 3
        </p>
        <h1 className="font-display mt-2 text-2xl font-bold text-white drop-shadow-[0_0_14px_rgba(147,197,253,0.6)]">
          Who&apos;s celebrating?
        </h1>
      </div>

      <div className="flex w-full max-w-md items-stretch justify-center gap-4">
        {cards.map((card) => {
          const isSelected = selected === card.key;
          const isDimmed = selected !== null && !isSelected;
          const sprite = THEME_CONFIG.characterSprites[card.key].idle;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                playSfx("buttonTap");
                onSelect(card.key);
              }}
              className={`flex flex-1 flex-col items-center gap-3 rounded-2xl border-4 p-4 transition-all duration-200 ${
                isSelected
                  ? "scale-105 border-cyan-400 bg-cyan-400/10 shadow-[0_0_28px_6px_rgba(34,211,238,0.5)]"
                  : "border-cyan-400/20 bg-white/5"
              } ${isDimmed ? "opacity-40" : "opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sprite}
                alt={card.label}
                className="h-36 w-full object-contain sm:h-44"
                draggable={false}
              />
              <span className="font-display text-sm font-bold text-white">{card.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selected}
        onClick={() => {
          playSfx("buttonTap");
          onContinue();
        }}
        className="font-display w-full max-w-md rounded-xl bg-cyan-400 px-6 py-3.5 text-base font-bold text-slate-900 shadow transition active:scale-95 disabled:opacity-30 disabled:active:scale-100"
      >
        Continue
      </button>
    </div>
  );
}
