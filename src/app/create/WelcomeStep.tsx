"use client";

import { playSfx } from "@/lib/sfx";
import StarfieldBackground from "./StarfieldBackground";

export default function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <StarfieldBackground />

      <div>
        {/* Placeholder text wordmark until a real logo asset exists. The
            navy/cyan palette isn't finalized either — both are known
            pending items, tracked in PROJECT_STATUS.md. */}
        <h1 className="font-display text-5xl font-bold tracking-wide text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
          Kid<span className="text-cyan-400">Kad</span>
        </h1>
        <p className="font-display mt-4 max-w-xs text-lg font-bold text-cyan-300">
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
