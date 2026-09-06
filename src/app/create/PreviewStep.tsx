"use client";

import { THEME_CONFIG } from "@/lib/theme-config";
import type { Character } from "@/lib/types";
import { TONE_LABELS, type DialogueTone } from "@/lib/dialogue-tones";
import { playSfx } from "@/lib/sfx";
import StepShell from "./StepShell";
import type { EventDetailsFields } from "./EventDetailsStep";
import type { ParentDetailsFields } from "./ParentDetailsStep";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/10 py-2.5 last:border-0">
      <span className="font-body text-xs font-bold text-cyan-300/60">{label}</span>
      <span className="font-body text-sm text-white">{value}</span>
    </div>
  );
}

export default function PreviewStep({
  character,
  tone,
  childName,
  childAge,
  childPhotoUrl,
  event,
  parent,
  onBack,
  onSubmit,
  submitting,
  submitError,
}: {
  character: Character;
  tone: DialogueTone;
  childName: string;
  childAge: string;
  childPhotoUrl: string;
  event: EventDetailsFields;
  parent: ParentDetailsFields;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const sprite = THEME_CONFIG.characterSprites[character].idle;

  return (
    <StepShell
      stepLabel="Step 8 of 8"
      title="Review your invitation"
      onBack={onBack}
      starSeed="kidkad-create-form-preview"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sprite} alt="" className="h-20 w-auto object-contain" draggable={false} />
          {childPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={childPhotoUrl}
              alt=""
              className="h-20 w-20 rounded-full border-2 border-cyan-400/40 object-cover"
            />
          )}
        </div>

        <div className="w-full rounded-2xl border-2 border-cyan-400/30 bg-slate-900/50 px-4">
          <Row label="Child" value={`${childName}, turning ${childAge}`} />
          <Row label="Voice" value={TONE_LABELS[tone]} />
          <Row label="Theme" value="Space Mission" />
          <Row label="Party" value={`${event.partyDate} at ${event.partyTime}`} />
          <Row label="Venue" value={event.partyVenue} />
          <Row label="Dress code" value={event.dressCode} />
          <Row label="RSVP by" value={event.rsvpDeadline} />
          <Row label="Message to guests" value={event.personalMessage} />
          <Row label="Host" value={parent.parentName} />
          <Row label="Email" value={parent.parentEmail} />
          <Row label="WhatsApp" value={parent.rsvpPhoneContact} />
        </div>

        {submitError && (
          <p className="w-full rounded-lg bg-red-500/10 p-3 text-sm font-semibold text-red-400">
            {submitError}
          </p>
        )}

        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            playSfx("buttonTap");
            onSubmit();
          }}
          className="font-display w-full rounded-xl bg-cyan-400 px-6 py-3.5 text-base font-bold text-slate-900 shadow transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {submitting ? "Creating..." : "Create my invitation"}
        </button>
      </div>
    </StepShell>
  );
}
