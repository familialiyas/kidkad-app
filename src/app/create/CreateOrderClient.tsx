"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/types";
import type { DialogueTone } from "@/lib/dialogue-tones";
import type { ThemeName } from "@/lib/theme-config";
import { formatTimeForStorage } from "@/lib/date";
import WelcomeStep from "./WelcomeStep";
import ChildInfoStep from "./ChildInfoStep";
import CharacterSelectStep from "./CharacterSelectStep";
import ToneSelectStep from "./ToneSelectStep";
import ThemeSelectStep from "./ThemeSelectStep";
import PhotoUploadStep from "./PhotoUploadStep";
import EventDetailsStep, { EventDetailsFields } from "./EventDetailsStep";
import ParentDetailsStep, { ParentDetailsFields } from "./ParentDetailsStep";
import PreviewStep from "./PreviewStep";
import { getCreateDraft, setCreateDraft, clearCreateDraft } from "@/lib/create-draft-storage";

type Step =
  | "welcome"
  | "childInfo"
  | "theme"
  | "character"
  | "tone"
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

interface DraftOrder {
  order_token: string;
  guest_link: string;
}

export default function CreateOrderClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [theme, setTheme] = useState<ThemeName | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [tone, setTone] = useState<DialogueTone | null>(null);
  const [childPhotoUrl, setChildPhotoUrl] = useState("");
  const [event, setEvent] = useState<EventDetailsFields>(DEFAULT_EVENT);
  const [parent, setParent] = useState<ParentDetailsFields>(DEFAULT_PARENT);

  // The draft order is created as soon as the review step is reached (not
  // on an explicit submit click anymore) — both "Preview e-card" and
  // "Create e-card" act on this same order, one without touching payment.
  const [order, setOrder] = useState<DraftOrder | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const orderRequestedRef = useRef(false);
  // Fully derived from the state above rather than its own piece of state —
  // true from the moment the review step is reached until the draft order
  // (or an error) lands.
  const creatingOrder = step === "preview" && !order && !createError;

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Restores an in-progress draft from localStorage on first mount — only
  // relevant here, since the draft is cleared the moment a draft order is
  // successfully created below. A brief flash of the "welcome" step before
  // this lands is an accepted tradeoff, same as the mute-preference restore
  // in AudioToggle elsewhere in this app.
  useEffect(() => {
    // Deferred via a microtask (not a bare synchronous call), matching the
    // same localStorage-restore pattern AudioToggle uses elsewhere in this app.
    Promise.resolve().then(() => {
      const draft = getCreateDraft();
      if (!draft) return;
      setChildName(draft.childName);
      setChildAge(draft.childAge);
      setChildPhotoUrl(draft.childPhotoUrl);
      setEvent(draft.event);
      setParent(draft.parent);
      if (!draft.theme) {
        // A draft saved before the theme step existed (i.e. every draft
        // saved before this change) — its `character`/`step` were captured
        // under the old character-before-theme ordering and can't be
        // trusted now (e.g. a character chosen with no theme concept
        // behind it yet). Simplest safe fix: resume fresh from the theme
        // step rather than guessing a theme to pair with the old choice.
        setStep("theme");
        return;
      }
      setTheme(draft.theme);
      setCharacter(draft.character);
      setTone(draft.tone);
      setStep(draft.step as Step);
    });
  }, []);

  // Debounced draft auto-save — stops once a real order exists (the draft
  // is explicitly cleared then, so there's nothing left to keep saving).
  useEffect(() => {
    if (order) return;
    const id = setTimeout(() => {
      setCreateDraft({
        step,
        childName,
        childAge,
        theme,
        character,
        tone,
        childPhotoUrl,
        event,
        parent,
      });
    }, 500);
    return () => clearTimeout(id);
  }, [step, childName, childAge, theme, character, tone, childPhotoUrl, event, parent, order]);

  useEffect(() => {
    if (step !== "preview" || order || createError) return;
    if (orderRequestedRef.current) return;
    if (!theme || !character || !tone) return;
    orderRequestedRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            theme,
            character,
            dialogueTone: tone,
            childName: childName.trim(),
            childAge: Number(childAge),
            childPhotoUrl,
            personalMessage: event.personalMessage.trim(),
            parentName: parent.parentName.trim(),
            parentEmail: parent.parentEmail.trim(),
            partyDate: event.partyDate,
            partyTime: formatTimeForStorage(event.partyTime),
            partyVenue: event.partyVenue.trim(),
            dressCode: event.dressCode.trim(),
            rsvpDeadline: event.rsvpDeadline,
            rsvpPhoneContact: parent.rsvpPhoneContact.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        setOrder({ order_token: data.order.order_token, guest_link: data.order.guest_link });
        clearCreateDraft();
      } catch (err) {
        orderRequestedRef.current = false;
        setCreateError(err instanceof Error ? err.message : "Something went wrong");
      }
    })();
    // Fires once on entering the review step; `order` staying set is what
    // prevents re-creating a second draft on Back/Continue round-trips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, order, createError]);

  async function handlePay() {
    if (!order) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_token: order.order_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = `https://toyyibpay.com/${data.billCode}`;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Something went wrong");
      setPaying(false);
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
          onContinue={() => setStep("theme")}
        />
      );

    case "theme":
      return (
        <ThemeSelectStep
          selected={theme}
          onSelect={setTheme}
          onBack={() => setStep("childInfo")}
          onContinue={() => setStep("character")}
        />
      );

    case "character":
      if (!theme) {
        setStep("theme");
        return null;
      }
      return (
        <CharacterSelectStep
          theme={theme}
          selected={character}
          onSelect={setCharacter}
          onBack={() => setStep("theme")}
          onContinue={() => setStep("tone")}
        />
      );

    case "tone":
      if (!theme) {
        setStep("theme");
        return null;
      }
      if (!character) {
        setStep("character");
        return null;
      }
      return (
        <ToneSelectStep
          theme={theme}
          character={character}
          childName={childName}
          childAge={childAge}
          selected={tone}
          onSelect={setTone}
          onBack={() => setStep("character")}
          onContinue={() => setStep("photo")}
        />
      );

    case "photo":
      return (
        <PhotoUploadStep
          childPhotoUrl={childPhotoUrl}
          onChange={setChildPhotoUrl}
          onBack={() => setStep("tone")}
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
      if (!theme) {
        setStep("theme");
        return null;
      }
      if (!character) {
        setStep("character");
        return null;
      }
      if (!tone) {
        setStep("tone");
        return null;
      }
      return (
        <PreviewStep
          theme={theme}
          character={character}
          tone={tone}
          childName={childName}
          childAge={childAge}
          childPhotoUrl={childPhotoUrl}
          event={event}
          parent={parent}
          onBack={() => setStep("parentDetails")}
          order={order}
          creatingOrder={creatingOrder}
          createError={createError}
          onRetryCreate={() => {
            orderRequestedRef.current = false;
            setCreateError(null);
          }}
          onPreview={() => order && router.push(`/invite/${order.guest_link}`)}
          onPay={handlePay}
          paying={paying}
          payError={payError}
        />
      );
  }
}
