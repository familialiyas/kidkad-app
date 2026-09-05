"use client";

import { FormEvent, useState } from "react";
import DialogueButton from "./DialogueButton";

export interface RsvpFormValues {
  guestName: string;
  guestPhone: string;
  paxCount: number;
}

export default function RsvpForm({
  initialValues,
  submitLabel = "Submit",
  submitting,
  error,
  onSubmit,
  onCancel,
  theme = "amber",
}: {
  initialValues?: Partial<RsvpFormValues>;
  submitLabel?: string;
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: RsvpFormValues) => void;
  onCancel?: () => void;
  /** "space" for the in-game (dark, cyan-bordered) dialogue; "amber" for the return-visit screen's own cream card. */
  theme?: "space" | "amber";
}) {
  const [guestName, setGuestName] = useState(initialValues?.guestName ?? "");
  const [guestPhone, setGuestPhone] = useState(initialValues?.guestPhone ?? "");
  const [paxText, setPaxText] = useState(String(initialValues?.paxCount ?? 1));

  const labelClass =
    theme === "space" ? "text-xs font-bold text-cyan-100" : "text-xs font-bold text-amber-900";
  const inputClass =
    theme === "space"
      ? "mt-1 w-full rounded-lg border-2 border-cyan-400/40 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400"
      : "mt-1 w-full rounded-lg border-2 border-amber-300 bg-white px-3 py-2 text-sm text-amber-950";
  const errorClass = theme === "space" ? "text-xs font-bold text-red-400" : "text-xs font-bold text-red-600";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const paxCount = parseInt(paxText, 10);
    if (!guestName.trim() || !guestPhone.trim() || !paxCount || paxCount < 1) return;
    onSubmit({ guestName: guestName.trim(), guestPhone: guestPhone.trim(), paxCount });
  }

  return (
    <form onSubmit={handleSubmit} className="font-body flex flex-col gap-2">
      <label className={labelClass}>
        Your name
        <input
          required
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className={inputClass}
          placeholder="e.g. Aisha"
        />
      </label>
      <label className={labelClass}>
        Phone number
        <input
          required
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          className={inputClass}
          placeholder="e.g. 60123456789"
          inputMode="tel"
        />
      </label>
      <label className={labelClass}>
        Number of guests
        <input
          required
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={paxText}
          onChange={(e) => setPaxText(e.target.value.replace(/\D/g, ""))}
          onBlur={() => {
            if (!paxText || parseInt(paxText, 10) < 1) setPaxText("1");
          }}
          onFocus={(e) => e.target.select()}
          className={inputClass}
        />
      </label>
      {error && <p className={errorClass}>{error}</p>}
      <div className="mt-1 flex flex-col gap-2">
        <DialogueButton type="submit" theme={theme} disabled={submitting}>
          {submitting ? "Submitting..." : submitLabel}
        </DialogueButton>
        {onCancel && (
          <DialogueButton
            type="button"
            variant="secondary"
            theme={theme}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </DialogueButton>
        )}
      </div>
    </form>
  );
}
