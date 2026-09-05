"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/types";
import type { DialogueTone } from "@/lib/dialogue-tones";
import CharacterSelectStep from "./CharacterSelectStep";
import ToneSelectStep from "./ToneSelectStep";
import DetailsFormStep, { DEFAULT_DETAILS_FIELDS, DetailsFields } from "./DetailsFormStep";

type Step = 1 | 2 | 3;

export default function CreateOrderClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [character, setCharacter] = useState<Character | null>(null);
  const [tone, setTone] = useState<DialogueTone | null>(null);
  const [fields, setFields] = useState<DetailsFields>(DEFAULT_DETAILS_FIELDS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleFieldsChange(patch: Partial<DetailsFields>) {
    setFields((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit() {
    if (!character || !tone) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character,
          dialogueTone: tone,
          childName: fields.childName.trim(),
          childAge: Number(fields.childAge),
          childPhotoUrl: fields.childPhotoUrl,
          personalMessage: fields.personalMessage.trim(),
          parentName: fields.parentName.trim(),
          parentEmail: fields.parentEmail.trim(),
          partyDate: fields.partyDate,
          partyTime: fields.partyTime,
          partyVenue: fields.partyVenue.trim(),
          dressCode: fields.dressCode.trim(),
          rsvpDeadline: fields.rsvpDeadline,
          rsvpPhoneContact: fields.rsvpPhoneContact.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/create/success/${data.order.order_token}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (step === 1) {
    return (
      <CharacterSelectStep
        selected={character}
        onSelect={setCharacter}
        onContinue={() => setStep(2)}
      />
    );
  }

  if (step === 2) {
    if (!character) {
      setStep(1);
      return null;
    }
    return (
      <ToneSelectStep
        character={character}
        selected={tone}
        onSelect={setTone}
        onBack={() => setStep(1)}
        onContinue={() => setStep(3)}
      />
    );
  }

  if (!tone) {
    setStep(2);
    return null;
  }

  return (
    <DetailsFormStep
      tone={tone}
      fields={fields}
      onChange={handleFieldsChange}
      onBack={() => setStep(2)}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitError={submitError}
    />
  );
}
