"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/types";
import type { DialogueTone } from "@/lib/dialogue-tones";
import WelcomeStep from "./WelcomeStep";
import ChildInfoStep from "./ChildInfoStep";
import CharacterSelectStep from "./CharacterSelectStep";
import ToneSelectStep from "./ToneSelectStep";
import ThemeSelectStep from "./ThemeSelectStep";
import PhotoUploadStep from "./PhotoUploadStep";
import EventDetailsStep, { EventDetailsFields } from "./EventDetailsStep";
import ParentDetailsStep, { ParentDetailsFields } from "./ParentDetailsStep";
import PreviewStep from "./PreviewStep";

type Step =
  | "welcome"
  | "childInfo"
  | "character"
  | "tone"
  | "theme"
  | "photo"
  | "eventDetails"
  | "parentDetails"
  | "preview";

const DEFAULT_EVENT: EventDetailsFields = {
  partyDate: "",
  partyTime: "",
  partyVenue: "",
  dressCode: "",
  rsvpDeadline: "",
  rsvpDeadlineTouched: false,
  personalMessage: "",
};

const DEFAULT_PARENT: ParentDetailsFields = {
  parentName: "",
  parentEmail: "",
  rsvpPhoneContact: "",
};

export default function CreateOrderClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [character, setCharacter] = useState<Character | null>(null);
  const [tone, setTone] = useState<DialogueTone | null>(null);
  const [childPhotoUrl, setChildPhotoUrl] = useState("");
  const [event, setEvent] = useState<EventDetailsFields>(DEFAULT_EVENT);
  const [parent, setParent] = useState<ParentDetailsFields>(DEFAULT_PARENT);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
          childName: childName.trim(),
          childAge: Number(childAge),
          childPhotoUrl,
          personalMessage: event.personalMessage.trim(),
          parentName: parent.parentName.trim(),
          parentEmail: parent.parentEmail.trim(),
          partyDate: event.partyDate,
          partyTime: event.partyTime,
          partyVenue: event.partyVenue.trim(),
          dressCode: event.dressCode.trim(),
          rsvpDeadline: event.rsvpDeadline,
          rsvpPhoneContact: parent.rsvpPhoneContact.trim(),
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

  switch (step) {
    case "welcome":
      return <WelcomeStep onStart={() => setStep("childInfo")} />;

    case "childInfo":
      return (
        <ChildInfoStep
          childName={childName}
          childAge={childAge}
          onChange={(patch) => {
            if (patch.childName !== undefined) setChildName(patch.childName);
            if (patch.childAge !== undefined) setChildAge(patch.childAge);
          }}
          onContinue={() => setStep("character")}
        />
      );

    case "character":
      return (
        <CharacterSelectStep
          selected={character}
          onSelect={setCharacter}
          onBack={() => setStep("childInfo")}
          onContinue={() => setStep("tone")}
        />
      );

    case "tone":
      if (!character) {
        setStep("character");
        return null;
      }
      return (
        <ToneSelectStep
          character={character}
          childName={childName}
          childAge={childAge}
          selected={tone}
          onSelect={setTone}
          onBack={() => setStep("character")}
          onContinue={() => setStep("theme")}
        />
      );

    case "theme":
      return (
        <ThemeSelectStep onBack={() => setStep("tone")} onContinue={() => setStep("photo")} />
      );

    case "photo":
      return (
        <PhotoUploadStep
          childPhotoUrl={childPhotoUrl}
          onChange={setChildPhotoUrl}
          onBack={() => setStep("theme")}
          onContinue={() => setStep("eventDetails")}
        />
      );

    case "eventDetails":
      if (!tone) {
        setStep("tone");
        return null;
      }
      return (
        <EventDetailsStep
          tone={tone}
          fields={event}
          onChange={(patch) => setEvent((prev) => ({ ...prev, ...patch }))}
          onBack={() => setStep("photo")}
          onContinue={() => setStep("parentDetails")}
        />
      );

    case "parentDetails":
      return (
        <ParentDetailsStep
          fields={parent}
          onChange={(patch) => setParent((prev) => ({ ...prev, ...patch }))}
          onBack={() => setStep("eventDetails")}
          onContinue={() => setStep("preview")}
        />
      );

    case "preview":
      if (!character || !tone) {
        setStep("character");
        return null;
      }
      return (
        <PreviewStep
          character={character}
          tone={tone}
          childName={childName}
          childAge={childAge}
          childPhotoUrl={childPhotoUrl}
          event={event}
          parent={parent}
          onBack={() => setStep("parentDetails")}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
        />
      );
  }
}
