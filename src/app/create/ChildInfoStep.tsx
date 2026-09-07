"use client";

import { useState } from "react";
import StepShell, { darkInputClass, darkLabelClass, FieldError } from "./StepShell";

export default function ChildInfoStep({
  childName,
  childAge,
  onChange,
  onContinue,
}: {
  childName: string;
  childAge: string;
  onChange: (patch: { childName?: string; childAge?: string }) => void;
  onContinue: () => void;
}) {
  const [errors, setErrors] = useState<{ childName?: string; childAge?: string }>({});

  function handleContinue() {
    const newErrors: { childName?: string; childAge?: string } = {};
    if (!childName.trim()) newErrors.childName = "Enter the child's name";
    if (!childAge || Number(childAge) <= 0) newErrors.childAge = "Enter a valid age";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onContinue();
  }

  return (
    <StepShell
      stepLabel="Step 1 of 8"
      title="Meet Your Star"
      subtitle="We'll use this to personalize everything from here on."
      onContinue={handleContinue}
      starSeed="kidkad-create-form"
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className={darkLabelClass}>
            Child&apos;s name
            <input
              className={darkInputClass}
              value={childName}
              onChange={(e) => onChange({ childName: e.target.value })}
            />
          </label>
          <FieldError message={errors.childName} />
        </div>

        <div>
          <label className={darkLabelClass}>
            Age turning
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={darkInputClass}
              value={childAge}
              onChange={(e) => onChange({ childAge: e.target.value.replace(/\D/g, "") })}
            />
          </label>
          <FieldError message={errors.childAge} />
        </div>
      </div>
    </StepShell>
  );
}
