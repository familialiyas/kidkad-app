"use client";

import { ReactNode } from "react";
import { playSfx } from "@/lib/sfx";
import StarfieldBackground from "./StarfieldBackground";

export const darkInputClass =
  "mt-1 w-full rounded-lg border-2 border-cyan-400/30 bg-slate-900/60 px-3 py-2.5 text-base text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none";
export const darkLabelClass = "font-body block text-sm font-bold text-cyan-100";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-red-400">{message}</p>;
}

/** Shared full-screen shell (starfield + step label + heading + back/continue) for the plain form steps. */
export default function StepShell({
  stepLabel,
  title,
  subtitle,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  starSeed,
}: {
  stepLabel?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  starSeed?: string;
}) {
  return (
    <div className="relative min-h-screen px-4 py-8">
      <StarfieldBackground seed={starSeed} />
      <div className="mx-auto max-w-md">
        {stepLabel && (
          <p className="font-display text-center text-xs font-bold tracking-widest text-cyan-300/70 uppercase">
            {stepLabel}
          </p>
        )}
        <h1 className="font-display mt-1 text-center text-xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="font-body mt-1 text-center text-sm text-cyan-100/70">{subtitle}</p>
        )}

        <div className="mt-6">{children}</div>

        {(onBack || onContinue) && (
          <div className="mt-6 flex gap-2">
            {onBack && (
              <button
                type="button"
                onClick={() => {
                  playSfx("buttonTap");
                  onBack();
                }}
                className="font-display rounded-xl border-2 border-cyan-400/40 px-5 py-3 text-sm font-bold text-cyan-300"
              >
                Back
              </button>
            )}
            {onContinue && (
              <button
                type="button"
                disabled={continueDisabled}
                onClick={() => {
                  playSfx("buttonTap");
                  onContinue();
                }}
                className="font-display flex-1 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-900 shadow transition active:scale-95 disabled:opacity-30 disabled:active:scale-100"
              >
                {continueLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
