"use client";

import { THEME_CONFIG } from "@/lib/theme-config";
import { playSfx } from "@/lib/sfx";
import StarfieldBackground from "./StarfieldBackground";

export default function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <StarfieldBackground />

      <div className="flex items-end justify-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={THEME_CONFIG.characterSprites.girl.idle}
          alt=""
          className="h-32 w-auto object-contain sm:h-40"
          draggable={false}
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={THEME_CONFIG.characterSprites.boy.idle}
          alt=""
          className="h-32 w-auto object-contain sm:h-40"
          draggable={false}
          aria-hidden
        />
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-white drop-shadow-[0_0_14px_rgba(147,197,253,0.6)]">
          KidKad
        </h1>
        <p className="font-display mt-3 max-w-xs text-lg font-bold text-cyan-300">
          give your birthday invite main character energy
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          playSfx("buttonTap");
          onStart();
        }}
        className="start-mission-btn font-display w-full max-w-sm rounded-full border-2 border-blue-200/70 bg-white/10 px-8 py-3.5 text-lg font-bold text-white backdrop-blur-sm active:scale-95"
      >
        let&apos;s get started
      </button>
    </div>
  );
}
