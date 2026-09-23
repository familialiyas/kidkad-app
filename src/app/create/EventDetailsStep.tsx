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

// Local-time (not UTC-anchored, unlike computeDefaultDeadline's math below)
// — this gates the native date picker's `min` and the past-date checks in
// validate(), both of which should match what the user sees as "today" on
// their own device's calendar widget, not a UTC instant that could still
// read as "yesterday" or "tomorrow" for them.
function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function computeDefaultDeadline(partyDate: string): string {
  if (!partyDate) return "";
  // UTC-anchored throughout — parsing/formatting through local time here
  // shifts the result by a day in any timezone ahead of UTC.
  const [y, m, d] = partyDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - 3);
  const computed = utc.toISOString().slice(0, 10);
  // A party date within the next 3 days would otherwise default to a
  // deadline already in the past — clamp to today instead of suggesting
  // something the user would immediately have to notice and fix.
  const today = todayDateString();
  return computed < today ? today : computed;
}

function validate(fields: EventDetailsFields): Errors {
  const errors: Errors = {};
  const today = todayDateString();
  if (!fields.partyDate) errors.partyDate = "Pick the party date";
  else if (fields.partyDate < today) errors.partyDate = "Party date can't be in the past";
  if (!fields.partyTime) errors.partyTime = "Pick the party time";
  if (!fields.partyVenue.trim()) errors.partyVenue = "Enter the venue location";
  if (!fields.dressCode.trim()) errors.dressCode = "Enter a dress code";
  if (!fields.rsvpDeadline) errors.rsvpDeadline = "Pick an RSVP deadline";
  else if (fields.rsvpDeadline < today) errors.rsvpDeadline = "RSVP deadline can't be in the past";
  else if (fields.partyDate && fields.rsvpDeadline > fields.partyDate)
    errors.rsvpDeadline = "RSVP deadline can't be after the party date";
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
      title="Share Your Party Details"
      onBack={onBack}
      onContinue={handleContinue}
      starSeed="koolkad-create-form-event"
    >
      <div className="flex flex-col gap-5">
        <div data-field="partyDate">
          <label className={darkLabelClass}>
            Party date
            <input
              type="date"
              className={darkInputClass}
              value={fields.partyDate}
              min={todayDateString()}
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
              min={todayDateString()}
              max={fields.partyDate || undefined}
              onChange={(e) => onChange({ rsvpDeadline: e.target.value, rsvpDeadlineTouched: true })}
            />
          </label>
          <p className="font-body text-wizard-text-muted mt-1 text-xs">
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
              className="font-display bg-wizard-accent text-wizard-bg rounded-full px-3 py-1 text-xs font-bold active:scale-95"
            >
              Shuffle suggestion
            </button>
          </div>
          <p className="font-body text-wizard-text-muted mt-1 text-xs">
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
