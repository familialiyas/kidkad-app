"use client";

import { useRef, useState } from "react";
import type { DialogueTone } from "@/lib/dialogue-tones";
import { PERSONAL_MESSAGE_SAMPLES } from "@/lib/dialogue-tones";
import { playSfx } from "@/lib/sfx";

export interface DetailsFields {
  childName: string;
  childAge: string;
  personalMessage: string;
  childPhotoUrl: string;
  parentName: string;
  parentEmail: string;
  partyDate: string;
  partyTime: string;
  partyVenue: string;
  dressCode: string;
  rsvpDeadline: string;
  rsvpDeadlineTouched: boolean;
  rsvpPhoneContact: string;
}

export const DEFAULT_DETAILS_FIELDS: DetailsFields = {
  childName: "",
  childAge: "",
  personalMessage: "",
  childPhotoUrl: "",
  parentName: "",
  parentEmail: "",
  partyDate: "",
  partyTime: "",
  partyVenue: "",
  dressCode: "",
  rsvpDeadline: "",
  rsvpDeadlineTouched: false,
  rsvpPhoneContact: "",
};

type FieldKey = keyof Omit<DetailsFields, "rsvpDeadlineTouched">;
type Errors = Partial<Record<FieldKey, string>>;

export function validateDetails(fields: DetailsFields): Errors {
  const errors: Errors = {};
  if (!fields.childName.trim()) errors.childName = "Enter the child's name";
  if (!fields.childAge || Number(fields.childAge) <= 0)
    errors.childAge = "Enter a valid age";
  if (!fields.personalMessage.trim()) errors.personalMessage = "Write a personal message";
  if (!fields.childPhotoUrl) errors.childPhotoUrl = "Upload a photo";
  if (!fields.parentName.trim()) errors.parentName = "Enter your name";
  if (!fields.parentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.parentEmail))
    errors.parentEmail = "Enter a valid email address";
  if (!fields.partyDate) errors.partyDate = "Pick the party date";
  if (!fields.partyTime) errors.partyTime = "Pick the party time";
  if (!fields.partyVenue.trim()) errors.partyVenue = "Enter the venue or address";
  if (!fields.dressCode.trim()) errors.dressCode = "Enter a dress code";
  if (!fields.rsvpDeadline) errors.rsvpDeadline = "Pick an RSVP deadline";
  if (!fields.rsvpPhoneContact.trim()) errors.rsvpPhoneContact = "Enter a WhatsApp number";
  return errors;
}

function computeDefaultDeadline(partyDate: string): string {
  if (!partyDate) return "";
  // Anchored to UTC throughout (Date.UTC in, getUTC.../toISOString out) so
  // this is pure calendar-date arithmetic — parsing "T00:00:00" as local
  // time and later converting to an ISO (UTC) string shifts the result by
  // a day in any timezone ahead of UTC.
  const [y, m, d] = partyDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - 3);
  return utc.toISOString().slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-red-600">{message}</p>;
}

const inputClass =
  "mt-1 w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:border-gray-900 focus:outline-none";
const labelClass = "block text-sm font-bold text-gray-800";

export default function DetailsFormStep({
  tone,
  fields,
  onChange,
  onBack,
  onSubmit,
  submitting,
  submitError,
}: {
  tone: DialogueTone;
  fields: DetailsFields;
  onChange: (patch: Partial<DetailsFields>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [sampleIndex, setSampleIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(patch: Partial<DetailsFields>) {
    onChange(patch);
  }

  function handlePartyDateChange(value: string) {
    const patch: Partial<DetailsFields> = { partyDate: value };
    if (!fields.rsvpDeadlineTouched) {
      patch.rsvpDeadline = computeDefaultDeadline(value);
    }
    set(patch);
  }

  function handleShuffle() {
    playSfx("buttonTap");
    const samples = PERSONAL_MESSAGE_SAMPLES[tone];
    const next = (sampleIndex + 1) % samples.length;
    setSampleIndex(next);
    set({ personalMessage: samples[next] });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      set({ childPhotoUrl: data.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      set({ childPhotoUrl: "" });
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validateDetails(fields);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      playSfx("buttonTap");
      const firstKey = Object.keys(newErrors)[0];
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-field="${firstKey}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    onSubmit();
  }

  return (
    <div className="font-body min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Step 3 of 3</p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Party details</h1>
        <p className="mt-1 text-sm text-gray-500">
          Everything here is required — we&apos;ll use it to build the invitation.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
          <div data-field="childName">
            <label className={labelClass}>
              Child&apos;s name
              <input
                className={inputClass}
                value={fields.childName}
                onChange={(e) => set({ childName: e.target.value })}
                placeholder="e.g. Ziyad"
              />
            </label>
            <FieldError message={errors.childName} />
          </div>

          <div data-field="childAge">
            <label className={labelClass}>
              Age turning
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={inputClass}
                value={fields.childAge}
                onChange={(e) => set({ childAge: e.target.value.replace(/\D/g, "") })}
                placeholder="e.g. 5"
              />
            </label>
            <FieldError message={errors.childAge} />
          </div>

          <div data-field="personalMessage">
            <div className="flex items-center justify-between">
              <label className={labelClass} htmlFor="personalMessage">
                Personal message
              </label>
              <button
                type="button"
                onClick={handleShuffle}
                className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white active:scale-95"
              >
                Shuffle suggestion
              </button>
            </div>
            <textarea
              id="personalMessage"
              className={`${inputClass} min-h-24 resize-none`}
              value={fields.personalMessage}
              onChange={(e) => set({ personalMessage: e.target.value })}
              placeholder="Write something from the birthday child to their guests..."
            />
            <FieldError message={errors.personalMessage} />
          </div>

          <div data-field="childPhotoUrl">
            <label className={labelClass}>Child&apos;s photo</label>
            <div className="mt-1 flex items-center gap-3">
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full border-2 border-gray-300 object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 active:scale-95"
              >
                {uploading ? "Uploading..." : photoPreview ? "Change photo" : "Choose photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            {uploadError && <p className="mt-1 text-xs font-semibold text-red-600">{uploadError}</p>}
            <FieldError message={errors.childPhotoUrl} />
          </div>

          <div data-field="parentName">
            <label className={labelClass}>
              Your name (parent/host)
              <input
                className={inputClass}
                value={fields.parentName}
                onChange={(e) => set({ parentName: e.target.value })}
                placeholder="e.g. Aliya"
              />
            </label>
            <FieldError message={errors.parentName} />
          </div>

          <div data-field="parentEmail">
            <label className={labelClass}>
              Your email
              <input
                type="email"
                className={inputClass}
                value={fields.parentEmail}
                onChange={(e) => set({ parentEmail: e.target.value })}
                placeholder="you@example.com"
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              We&apos;ll send your guest link and admin link here.
            </p>
            <FieldError message={errors.parentEmail} />
          </div>

          <div data-field="partyDate">
            <label className={labelClass}>
              Party date
              <input
                type="date"
                className={inputClass}
                value={fields.partyDate}
                onChange={(e) => handlePartyDateChange(e.target.value)}
              />
            </label>
            <FieldError message={errors.partyDate} />
          </div>

          <div data-field="partyTime">
            <label className={labelClass}>
              Party time
              <input
                type="time"
                className={inputClass}
                value={fields.partyTime}
                onChange={(e) => set({ partyTime: e.target.value })}
              />
            </label>
            <FieldError message={errors.partyTime} />
          </div>

          <div data-field="partyVenue">
            <label className={labelClass}>
              Party venue / address
              <input
                className={inputClass}
                value={fields.partyVenue}
                onChange={(e) => set({ partyVenue: e.target.value })}
                placeholder="e.g. Forest Camp Resort, Janda Baik"
              />
            </label>
            <FieldError message={errors.partyVenue} />
          </div>

          <div data-field="dressCode">
            <label className={labelClass}>
              Dress code
              <input
                className={inputClass}
                value={fields.dressCode}
                onChange={(e) => set({ dressCode: e.target.value })}
                placeholder="Casual, come comfy!"
              />
            </label>
            <FieldError message={errors.dressCode} />
          </div>

          <div data-field="rsvpDeadline">
            <label className={labelClass}>
              RSVP deadline
              <input
                type="date"
                className={inputClass}
                value={fields.rsvpDeadline}
                onChange={(e) => set({ rsvpDeadline: e.target.value, rsvpDeadlineTouched: true })}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">Defaults to 3 days before the party.</p>
            <FieldError message={errors.rsvpDeadline} />
          </div>

          <div data-field="rsvpPhoneContact">
            <label className={labelClass}>
              Host&apos;s WhatsApp number
              <input
                className={inputClass}
                value={fields.rsvpPhoneContact}
                onChange={(e) => set({ rsvpPhoneContact: e.target.value })}
                placeholder="e.g. 60123456789"
                inputMode="tel"
              />
            </label>
            <FieldError message={errors.rsvpPhoneContact} />
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
              {submitError}
            </p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border-2 border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 active:scale-95"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {submitting ? "Creating..." : "Create invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
