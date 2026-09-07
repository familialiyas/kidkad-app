"use client";

import StepShell from "./StepShell";

export default function ThemeSelectStep({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <StepShell
      stepLabel="Step 4 of 8"
      title="Pick A Theme"
      subtitle="More themes are on the way — space is ready to go now."
      onBack={onBack}
      onContinue={onContinue}
      starSeed="kidkad-create-form-theme"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 rounded-2xl border-4 border-cyan-400 bg-cyan-400/10 p-4 shadow-[0_0_24px_4px_rgba(34,211,238,0.35)]">
          <div
            className="h-16 w-16 shrink-0 rounded-xl"
            style={{ background: "linear-gradient(to top, #0a0e27 0%, #1a1f4e 100%)" }}
            aria-hidden
          />
          <div className="flex-1 text-left">
            <p className="font-display text-base font-bold text-white">Space Mission</p>
            <p className="font-body text-xs text-cyan-100/70">Astronauts, planets, and coins</p>
          </div>
          <span className="font-display rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-900">
            Selected
          </span>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border-4 border-white/10 bg-white/5 p-4 opacity-60">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-white/10" aria-hidden />
          <div className="flex-1 text-left">
            <p className="font-display text-base font-bold text-white/70">More coming soon</p>
            <p className="font-body text-xs text-cyan-100/50">A new theme is on its way</p>
          </div>
          <span className="font-display rounded-full border-2 border-white/20 px-3 py-1 text-xs font-bold text-white/50">
            Locked
          </span>
        </div>
      </div>
    </StepShell>
  );
}
