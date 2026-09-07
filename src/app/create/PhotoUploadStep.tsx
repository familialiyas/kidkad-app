"use client";

import { useRef, useState } from "react";
import StepShell, { FieldError } from "./StepShell";
import PhotoCropModal from "./PhotoCropModal";

export default function PhotoUploadStep({
  childPhotoUrl,
  onChange,
  onBack,
  onContinue,
}: {
  childPhotoUrl: string;
  onChange: (url: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(childPhotoUrl || null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setContinueError(null);
    setRawImageSrc(URL.createObjectURL(file));
    // Allow re-selecting the same file later without the browser treating it as unchanged.
    e.target.value = "";
  }

  function closeCropModal() {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  }

  async function handleCropConfirm(croppedBlob: Blob) {
    closeCropModal();
    setPhotoPreview(URL.createObjectURL(croppedBlob));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "photo.png");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      onChange("");
    } finally {
      setUploading(false);
    }
  }

  function handleContinue() {
    if (!childPhotoUrl) {
      setContinueError("Upload a photo to continue");
      return;
    }
    onContinue();
  }

  return (
    <StepShell
      stepLabel="Step 5 of 8"
      title="Add A Photo"
      onBack={onBack}
      onContinue={handleContinue}
      continueDisabled={uploading}
      starSeed="kidkad-create-form-photo"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-cyan-400/40 bg-slate-900/60">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-body text-xs text-cyan-100/50">No photo yet</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="font-display rounded-xl border-2 border-cyan-400/40 bg-white/5 px-5 py-2.5 text-sm font-bold text-cyan-300 active:scale-95"
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

        <p className="font-body max-w-xs text-center text-xs text-cyan-100/60">
          Only people with your invite link can see this photo — it&apos;s never indexed or
          searchable.
        </p>

        {uploadError && <p className="text-xs font-semibold text-red-400">{uploadError}</p>}
        <FieldError message={continueError ?? undefined} />
      </div>

      {rawImageSrc && (
        <PhotoCropModal
          imageSrc={rawImageSrc}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
    </StepShell>
  );
}
