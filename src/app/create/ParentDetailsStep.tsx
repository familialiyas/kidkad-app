"use client";

import { useState } from "react";
import StepShell, { darkInputClass, darkLabelClass, FieldError } from "./StepShell";

export interface ParentDetailsFields {
  parentName: string;
  parentEmail: string;
  rsvpPhoneContact: string;
}

type Errors = Partial<Record<keyof ParentDetailsFields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields: ParentDetailsFields): Errors {
  const errors: Errors = {};
  if (!fields.parentName.trim()) errors.parentName = "Enter your name";
  if (!fields.parentEmail.trim()) errors.parentEmail = "Enter your email";
  else if (!EMAIL_RE.test(fields.parentEmail)) errors.parentEmail = "Enter a valid email address";
  if (!fields.rsvpPhoneContact.trim()) errors.rsvpPhoneContact = "Enter a WhatsApp number";
  return errors;
}

export default function ParentDetailsStep({
  fields,
  onChange,
  onBack,
  onContinue,
}: {
  fields: ParentDetailsFields;
  onChange: (patch: Partial<ParentDetailsFields>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [errors, setErrors] = useState<Errors>({});

  function handleEmailBlur() {
    if (!fields.parentEmail.trim()) return; // required-ness only enforced on Continue, not every blur
    setErrors((prev) => ({
      ...prev,
      parentEmail: EMAIL_RE.test(fields.parentEmail) ? undefined : "Enter a valid email address",
    }));
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
      stepLabel="Step 7 of 8"
      title="Your details"
      subtitle="This is how guests can reach you, and how we'll send your links."
      onBack={onBack}
      onContinue={handleContinue}
      starSeed="kidkad-create-form-parent"
    >
      <div className="flex flex-col gap-5">
        <div data-field="parentName">
          <label className={darkLabelClass}>
            Your name
            <input
              className={darkInputClass}
              value={fields.parentName}
              onChange={(e) => onChange({ parentName: e.target.value })}
            />
          </label>
          <FieldError message={errors.parentName} />
        </div>

        <div data-field="parentEmail">
          <label className={darkLabelClass}>
            Your email
            <input
              type="email"
              className={darkInputClass}
              value={fields.parentEmail}
              onChange={(e) => onChange({ parentEmail: e.target.value })}
              onBlur={handleEmailBlur}
            />
          </label>
          <p className="font-body mt-1 text-xs text-cyan-100/60">
            We&apos;ll send your guest link and admin link here.
          </p>
          <FieldError message={errors.parentEmail} />
        </div>

        <div data-field="rsvpPhoneContact">
          <label className={darkLabelClass}>
            Host&apos;s WhatsApp number
            <input
              className={darkInputClass}
              value={fields.rsvpPhoneContact}
              onChange={(e) => onChange({ rsvpPhoneContact: e.target.value })}
              placeholder="e.g. 0123456789"
              inputMode="tel"
            />
          </label>
          <p className="font-body mt-1 text-xs text-cyan-100/60">
            Shown to guests so they can reach you directly — not used for any automated
            notifications.
          </p>
          <FieldError message={errors.rsvpPhoneContact} />
        </div>
      </div>
    </StepShell>
  );
}
