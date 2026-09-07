"use client";

import { useRef, useState } from "react";
import type { Order } from "@/lib/types";
import { parsePartyTime, formatTimeForStorage } from "@/lib/date";
import PhotoCropModal from "../../create/PhotoCropModal";

// Older orders (seeded before /create existed) store party_time as a
// free-text "3:00 PM" string; native <input type="time"> requires 24h
// "HH:MM" and silently blanks anything else. Normalize on load so the
// field displays correctly regardless of which format the row has.
function to24HourTime(partyTime: string | null): string {
  if (!partyTime) return "";
  if (/^\d{2}:\d{2}$/.test(partyTime)) return partyTime;
  const { hours, minutes } = parsePartyTime(partyTime);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const inputClass =
  "mt-1 w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none";
const labelClass = "block text-sm font-bold text-gray-800";
const selectClass = inputClass;

interface EditableFields {
  child_name: string;
  child_age: string;
  character: "boy" | "girl";
  dialogue_tone: "excited" | "sweet" | "silly";
  child_photo_url: string;
  personal_message: string;
  party_date: string;
  party_time: string;
  party_venue: string;
  dress_code: string;
  rsvp_deadline: string;
  rsvp_phone_contact: string;
}

export default function EditInvitationSection({
  adminLink,
  order,
  isPastParty,
}: {
  adminLink: string;
  order: Order;
  isPastParty: boolean;
}) {
  const [fields, setFields] = useState<EditableFields>({
    child_name: order.child_name ?? "",
    child_age: order.child_age != null ? String(order.child_age) : "",
    character: order.character ?? "boy",
    dialogue_tone: order.dialogue_tone ?? "excited",
    child_photo_url: order.child_photo_url ?? "",
    personal_message: order.personal_message ?? "",
    party_date: order.party_date ?? "",
    party_time: to24HourTime(order.party_time),
    party_venue: order.party_venue ?? "",
    dress_code: order.dress_code ?? "",
    rsvp_deadline: order.rsvp_deadline ?? "",
    rsvp_phone_contact: order.rsvp_phone_contact ?? "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(order.child_photo_url);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(patch: Partial<EditableFields>) {
    setFields((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  if (isPastParty) {
    return (
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-gray-600">This party has already happened.</p>
        <p className="mt-1 text-xs text-gray-400">
          Editing is locked once the party date has passed.
        </p>
      </div>
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawImageSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  function closeCropModal() {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  }

  async function handleCropConfirm(blob: Blob) {
    closeCropModal();
    setPhotoPreview(URL.createObjectURL(blob));
    setUploading(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, "photo.png");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      set({ child_photo_url: data.url });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/orders/${adminLink}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          child_age: Number(fields.child_age),
          party_time: formatTimeForStorage(fields.party_time),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <details>
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-gray-900 sm:px-6">
          Edit invitation details
        </summary>
        <form onSubmit={handleSave} className="flex flex-col gap-4 border-t border-gray-100 p-4 sm:p-6">
          <p className="text-xs text-gray-500">
            Changes apply immediately — guests who open the link (or reopen it) will see the
            updated details. Existing RSVPs are not notified automatically.
          </p>

          <div className="flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100">
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800"
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <label className={labelClass}>
            Child&apos;s name
            <input
              className={inputClass}
              value={fields.child_name}
              onChange={(e) => set({ child_name: e.target.value })}
            />
          </label>

          <label className={labelClass}>
            Age turning
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={inputClass}
              value={fields.child_age}
              onChange={(e) => set({ child_age: e.target.value.replace(/\D/g, "") })}
            />
          </label>

          <label className={labelClass}>
            Character
            <select
              className={selectClass}
              value={fields.character}
              onChange={(e) => set({ character: e.target.value as "boy" | "girl" })}
            >
              <option value="boy">Astro Boy</option>
              <option value="girl">Astro Girl</option>
            </select>
          </label>

          <label className={labelClass}>
            Dialogue voice
            <select
              className={selectClass}
              value={fields.dialogue_tone}
              onChange={(e) =>
                set({ dialogue_tone: e.target.value as "excited" | "sweet" | "silly" })
              }
            >
              <option value="excited">Excited &amp; Bubbly</option>
              <option value="sweet">Sweet &amp; Gentle</option>
              <option value="silly">Silly &amp; Funny</option>
            </select>
          </label>

          <label className={labelClass}>
            Personal message
            <textarea
              className={`${inputClass} min-h-20 resize-none`}
              value={fields.personal_message}
              onChange={(e) => set({ personal_message: e.target.value })}
            />
          </label>

          <label className={labelClass}>
            Party date
            <input
              type="date"
              className={inputClass}
              value={fields.party_date}
              onChange={(e) => set({ party_date: e.target.value })}
            />
          </label>

          <label className={labelClass}>
            Party time
            <input
              type="time"
              className={inputClass}
              value={fields.party_time}
              onChange={(e) => set({ party_time: e.target.value })}
            />
          </label>

          <label className={labelClass}>
            Venue location
            <input
              className={inputClass}
              value={fields.party_venue}
              onChange={(e) => set({ party_venue: e.target.value })}
            />
          </label>

          <label className={labelClass}>
            Dress code
            <input
              className={inputClass}
              value={fields.dress_code}
              onChange={(e) => set({ dress_code: e.target.value })}
            />
          </label>

          <label className={labelClass}>
            RSVP deadline
            <input
              type="date"
              className={inputClass}
              max={fields.party_date || undefined}
              value={fields.rsvp_deadline}
              onChange={(e) => set({ rsvp_deadline: e.target.value })}
            />
          </label>

          <label className={labelClass}>
            Host&apos;s WhatsApp number
            <input
              className={inputClass}
              value={fields.rsvp_phone_contact}
              onChange={(e) => set({ rsvp_phone_contact: e.target.value })}
              inputMode="tel"
            />
          </label>

          {saveError && <p className="text-sm font-semibold text-red-600">{saveError}</p>}
          {saved && <p className="text-sm font-semibold text-green-600">Saved.</p>}

          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </details>

      {rawImageSrc && (
        <PhotoCropModal
          imageSrc={rawImageSrc}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
