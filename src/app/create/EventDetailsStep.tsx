"use client";

import { useState } from "react";
import type { DialogueTone } from "@/lib/dialogue-tones";
import { PERSONAL_MESSAGE_SAMPLES } from "@/lib/dialogue-tones";
import { playSfx } from "@/lib/sfx";
import StepShell, { darkInputClass, darkLabelClass, FieldError } from "./StepShell";

export interface EventDetailsFields {
  partyDate: string;
  partyTime: string;
  partyVenue: string;
  dressCode: string;
  rsvpDeadline: string;
  rsvpDeadlineTouched: boolean;
  personalMessage: string;
}

type FieldKey = keyof Omit<EventDetailsFields, "rsvpDeadlineTouched">;
type Errors = Partial<Record<FieldKey, string>>;

function computeDefaultDeadline(partyDate: string): string {
  if (!partyDate) return "";
  // UTC-anchored throughout — parsing/formatting through local time here
  // shifts the result by a day in any timezone ahead of UTC.
  const [y, m, d] = partyDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - 3);
  return utc.toISOString().slice(0, 10);
}

function validate(fields: EventDetailsFields): Errors {
  const errors: Errors = {};
  if (!fields.partyDate) errors.partyDate = "Pick the party date";
  if (!fields.partyTime) errors.partyTime = "Pick the party time";
  if (!fields.partyVenue.trim()) errors.partyVenue = "Enter the venue location";
  if (!fields.dressCode.trim()) errors.dressCode = "Enter a dress code";
  if (!fields.rsvpDeadline) errors.rsvpDeadline = "Pick an RSVP deadline";
  if (!fields.personalMessage.trim()) errors.personalMessage = "Write a personal message";
  return errors;
}

export default function EventDetailsStep({
  tone,
  fields,
  onChange,
  onBack,
  onContinue,
}: {
  tone: DialogueTone;
  fields: EventDetailsFields;
  onChange: (patch: Partial<EventDetailsFields>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [sampleIndex, setSampleIndex] = useState(0);

  function handlePartyDateChange(value: string) {
    const patch: Partial<EventDetailsFields> = { partyDate: value };
    if (!fields.rsvpDeadlineTouched) {
      patch.rsvpDeadline = computeDefaultDeadline(value);
    }
    onChange(patch);
  }

  function handleShuffle() {
    playSfx("buttonTap");
    const samples = PERSONAL_MESSAGE_SAMPLES[tone];
    const next = (sampleIndex + 1) % samples.length;
    setSampleIndex(next);
    onChange({ personalMessage: samples[next] });
  }

  function handleContinue() {
    const newErrors = validate(fields);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-field="${firstKey}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    onContinue();
  }

  return (
    <StepShell
      stepLabel="Step 6 of 8"
      title="Party details"
      onBack={onBack}
      onContinue={handleContinue}
      starSeed="kidkad-create-form-event"
    >
      <div className="flex flex-col gap-5">
        <div data-field="partyDate">
          <label className={darkLabelClass}>
            Party date
            <input
              type="date"
              className={darkInputClass}
              value={fields.partyDate}
              onChange={(e) => handlePartyDateChange(e.target.value)}
            />
          </label>
          <FieldError message={errors.partyDate} />
        </div>

        <div data-field="partyTime">
          <label className={darkLabelClass}>
            Party time
            <input
              type="time"
              className={darkInputClass}
              value={fields.partyTime}
              onChange={(e) => onChange({ partyTime: e.target.value })}
            />
          </label>
          <FieldError message={errors.partyTime} />
        </div>

        <div data-field="partyVenue">
          <label className={darkLabelClass}>
            Venue location
            <input
              className={darkInputClass}
              value={fields.partyVenue}
              onChange={(e) => onChange({ partyVenue: e.target.value })}
              placeholder="e.g. Tropicana Golf Club, Petaling Jaya"
            />
          </label>
          <FieldError message={errors.partyVenue} />
        </div>

        <div data-field="dressCode">
          <label className={darkLabelClass}>
            Dress code
            <input
              className={darkInputClass}
              value={fields.dressCode}
              onChange={(e) => onChange({ dressCode: e.target.value })}
              placeholder="e.g. Casual, Black & White, Space"
            />
          </label>
          <FieldError message={errors.dressCode} />
        </div>

        <div data-field="rsvpDeadline">
          <label className={darkLabelClass}>
            RSVP deadline
            <input
              type="date"
              className={darkInputClass}
              value={fields.rsvpDeadline}
              onChange={(e) => onChange({ rsvpDeadline: e.target.value, rsvpDeadlineTouched: true })}
            />
          </label>
          <p className="font-body mt-1 text-xs text-cyan-100/60">
            Defaults to 3 days before the party — edit if you want a different buffer.
          </p>
          <FieldError message={errors.rsvpDeadline} />
        </div>

        <div data-field="personalMessage">
          <div className="flex items-center justify-between">
            <label className={darkLabelClass} htmlFor="personalMessage">
              What do you want to say to your guests
            </label>
            <button
              type="button"
              onClick={handleShuffle}
              className="font-display rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-900 active:scale-95"
            >
              Shuffle suggestion
            </button>
          </div>
          <p className="font-body mt-1 text-xs text-cyan-100/60">
            This shows up as a personal note in the game — write it like you&apos;re talking
            directly to whoever&apos;s coming.
          </p>
          <textarea
            id="personalMessage"
            className={`${darkInputClass} min-h-24 resize-none`}
            value={fields.personalMessage}
            onChange={(e) => onChange({ personalMessage: e.target.value })}
          />
          <FieldError message={errors.personalMessage} />
        </div>
      </div>
    </StepShell>
  );
}
