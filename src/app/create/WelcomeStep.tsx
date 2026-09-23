"use client";

import { playSfx } from "@/lib/sfx";
import StarfieldBackground from "./StarfieldBackground";

export default function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <StarfieldBackground />

      <div>
        {/* Placeholder text wordmark until a real logo asset exists — still
            a known pending item, tracked in PROJECT_STATUS.md (the
            navy/cyan palette this comment used to also flag as pending is
            resolved now: wizard chrome is the fixed warm-neutral palette
            below). */}
        <h1 className="font-display text-wizard-text text-5xl font-bold tracking-wide drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]">
          <span className="text-wizard-accent">Kool</span>Kad
        </h1>
        <p className="font-display text-wizard-accent-light mt-4 max-w-xs text-lg font-bold">
          give your birthday invite main character energy
        </p>
        <p className="font-body text-wizard-text-muted mt-1.5 max-w-xs text-sm">
          Your invite, leveled up.
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
