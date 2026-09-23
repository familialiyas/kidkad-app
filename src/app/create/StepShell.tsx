"use client";

import { ReactNode } from "react";
import { playSfx } from "@/lib/sfx";
import StarfieldBackground from "./StarfieldBackground";

// [color-scheme:dark] tells the browser to render native form-control
// chrome — specifically the date/time inputs' calendar/clock picker icon —
// in a light color to match this dark UI. Without it the icon defaults to
// a dark glyph that's nearly invisible against bg-wizard-panel-deep. No
// effect on plain text/email/tel inputs, so it's safe on the shared class.
export const darkInputClass =
  "border-wizard-border bg-wizard-panel-deep text-wizard-text placeholder-wizard-text-muted focus:border-wizard-accent mt-1 w-full rounded-lg border-2 px-3 py-2.5 text-base [color-scheme:dark] focus:outline-none";
export const darkLabelClass = "font-body text-wizard-text block text-sm font-bold";

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
          <p className="font-display text-wizard-accent/70 text-center text-xs font-bold tracking-widest uppercase">
            {stepLabel}
          </p>
        )}
        <h1 className="font-display text-wizard-accent mt-1 text-center text-xl font-bold">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-wizard-text-muted mt-1 text-center text-sm">{subtitle}</p>
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
                className="font-display border-wizard-border text-wizard-accent-light rounded-xl border-2 px-5 py-3 text-sm font-bold"
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
                className="font-display bg-wizard-accent text-wizard-bg flex-1 rounded-xl px-6 py-3 text-sm font-bold shadow transition active:scale-95 disabled:opacity-30 disabled:active:scale-100"
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
