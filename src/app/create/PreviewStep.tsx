"use client";

import { THEME_CONFIG, type ThemeName } from "@/lib/theme-config";
import type { Character } from "@/lib/types";
import { TONE_LABELS, type DialogueTone } from "@/lib/dialogue-tones";
import { playSfx } from "@/lib/sfx";
import StepShell from "./StepShell";
import type { EventDetailsFields } from "./EventDetailsStep";
import type { ParentDetailsFields } from "./ParentDetailsStep";

export interface DraftOrder {
  order_token: string;
  guest_link: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-wizard-border flex flex-col gap-0.5 border-b py-2.5 last:border-0">
      <span className="font-body text-wizard-accent-light/60 text-xs font-bold">{label}</span>
      <span className="font-body text-wizard-text text-sm">{value}</span>
    </div>
  );
}

export default function PreviewStep({
  theme,
  character,
  tone,
  childName,
  childAge,
  childPhotoUrl,
  event,
  parent,
  onBack,
  order,
  creatingOrder,
  createError,
  onRetryCreate,
  onPreview,
  onPay,
  paying,
  payError,
}: {
  theme: ThemeName;
  character: Character;
  tone: DialogueTone;
  childName: string;
  childAge: string;
  childPhotoUrl: string;
  event: EventDetailsFields;
  parent: ParentDetailsFields;
  onBack: () => void;
  /** The draft order created as soon as this step is reached — null while it's still being created. */
  order: DraftOrder | null;
  creatingOrder: boolean;
  createError: string | null;
  onRetryCreate: () => void;
  onPreview: () => void;
  onPay: () => void;
  paying: boolean;
  payError: string | null;
}) {
  const themeAssets = THEME_CONFIG.themes[theme];
  const sprite = themeAssets.characterSprites[character].idle;

  return (
    <StepShell
      stepLabel="Step 8 of 8"
      title="Review your invitation"
      onBack={onBack}
      starSeed="koolkad-create-form-preview"
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
              className="border-wizard-border h-20 w-20 rounded-full border-2 object-cover"
            />
          )}
        </div>

        <div className="border-wizard-border bg-wizard-panel/50 w-full rounded-2xl border-2 px-4">
          <Row label="Child" value={`${childName}, turning ${childAge}`} />
          <Row label="Voice" value={TONE_LABELS[tone]} />
          <Row label="Theme" value={themeAssets.missionLabel} />
          <Row label="Party" value={`${event.partyDate} at ${event.partyTime}`} />
          <Row label="Venue" value={event.partyVenue} />
          <Row label="Dress code" value={event.dressCode} />
          <Row label="RSVP by" value={event.rsvpDeadline} />
          <Row label="Message to guests" value={event.personalMessage} />
          <Row label="Host" value={parent.parentName} />
          <Row label="Email" value={parent.parentEmail} />
          <Row label="WhatsApp" value={parent.rsvpPhoneContact} />
        </div>

        {creatingOrder && (
          <p className="font-body text-wizard-text-muted text-sm">Setting up your invitation…</p>
        )}

        {createError && (
          <div className="w-full rounded-lg bg-red-500/10 p-3 text-center">
            <p className="text-sm font-semibold text-red-400">{createError}</p>
            <button
              type="button"
              onClick={onRetryCreate}
              className="font-display text-wizard-accent-light mt-2 text-sm font-bold underline"
            >
              Try again
            </button>
          </div>
        )}

        {payError && (
          <p className="w-full rounded-lg bg-red-500/10 p-3 text-center text-sm font-semibold text-red-400">
            {payError}
          </p>
        )}

        {order && (
          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              disabled={paying}
              onClick={() => {
                playSfx("buttonTap");
                onPay();
              }}
              className="font-display bg-wizard-accent text-wizard-bg w-full rounded-xl px-6 py-3.5 text-base font-bold shadow transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {paying ? "Redirecting to payment…" : "Create e-card — RM19.90"}
            </button>
            <button
              type="button"
              disabled={paying}
              onClick={() => {
                playSfx("buttonTap");
                onPreview();
              }}
              className="font-display border-wizard-border text-wizard-accent-light w-full rounded-xl border-2 px-6 py-3 text-sm font-bold active:scale-95 disabled:opacity-50"
            >
              Preview e-card
            </button>
          </div>
        )}
      </div>
    </StepShell>
  );
}
