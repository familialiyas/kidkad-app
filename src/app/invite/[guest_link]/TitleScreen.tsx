"use client";

import { useState } from "react";
import { CHARACTER_WIDTH, CHARACTER_HEIGHT } from "@/lib/game-constants";
import { THEME_CONFIG } from "@/lib/theme-config";
import type { Character } from "@/lib/types";

export default function TitleScreen({
  childName,
  character,
  onStart,
}: {
  childName: string;
  character: Character | null;
  onStart: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const idleSprite =
    character === "girl"
      ? THEME_CONFIG.characterSprites.girl.idle
      : THEME_CONFIG.characterSprites.boy.idle;

  function handleStart() {
    if (starting) return;
    setStarting(true);
    setTimeout(onStart, 200);
  }

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-10 px-6 text-center transition-opacity duration-200 ${
        starting ? "opacity-0" : "opacity-100"
      }`}
    >
      <h1 className="font-display text-3xl font-bold tracking-wide text-white drop-shadow-[0_0_14px_rgba(147,197,253,0.85)]">
        {childName}&apos;s Space Mission
      </h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={idleSprite}
        alt=""
        className="title-character select-none"
        style={{ width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT }}
        aria-hidden
      />

      <button
        type="button"
        onClick={handleStart}
        className="start-mission-btn font-display rounded-full border-2 border-blue-200/70 bg-white/10 px-8 py-3 text-lg font-bold text-white backdrop-blur-sm active:scale-95"
      >
        Start Mission
      </button>
    </div>
  );
}
