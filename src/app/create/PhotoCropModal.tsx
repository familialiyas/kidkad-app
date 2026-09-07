"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { playSfx } from "@/lib/sfx";
import { getCroppedImageBlob } from "@/lib/cropImage";

export default function PhotoCropModal({
  imageSrc,
  onCancel,
  onConfirm,
}: {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    playSfx("buttonTap");
    setProcessing(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      setError("Couldn't crop that photo — try again.");
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0a0e27]">
      <p className="font-body px-4 pt-4 pb-2 text-center text-xs text-cyan-100/70">
        Drag to reposition, pinch or use the slider to zoom — this is exactly how it&apos;ll look
        in the game.
      </p>

      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      <div className="flex flex-col gap-3 px-4 pt-4 pb-6">
        <label className="font-body flex items-center gap-3 text-xs text-cyan-100/70">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-cyan-400"
          />
        </label>

        {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              playSfx("buttonTap");
              onCancel();
            }}
            className="font-display rounded-xl border-2 border-cyan-400/40 px-5 py-3 text-sm font-bold text-cyan-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processing || !croppedAreaPixels}
            onClick={handleConfirm}
            className="font-display flex-1 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-900 shadow transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {processing ? "Saving..." : "Use this photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
