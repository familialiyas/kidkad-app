"use client";

import { THEME_CONFIG } from "@/lib/theme-config";
import type { Character } from "@/lib/types";
import { DIALOGUE_TONES, TONE_LABELS, fillTemplate, DialogueTone } from "@/lib/dialogue-tones";
import { playSfx } from "@/lib/sfx";
import DialogueBox from "../invite/[guest_link]/DialogueBox";
import StarfieldBackground from "./StarfieldBackground";

const PREVIEW_ANCHOR_Y = 430;

const TONE_ORDER: DialogueTone[] = ["excited", "sweet", "silly"];

export default function ToneSelectStep({
  character,
  childName,
  childAge,
  selected,
  onSelect,
  onBack,
  onContinue,
}: {
  character: Character;
  childName: string;
  childAge: string;
  selected: DialogueTone | null;
  onSelect: (tone: DialogueTone) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const sprite = THEME_CONFIG.characterSprites[character].idle;
  const previewTone = selected ?? "excited";
  const previewLine = fillTemplate(DIALOGUE_TONES[previewTone].opening, {
    name: childName,
    age: childAge,
  });

  return (
    <div className="relative min-h-screen">
      <StarfieldBackground seed="kidkad-create-form-tone" />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sprite}
        alt=""
        className="fixed left-1/2 z-10 h-32 w-auto -translate-x-1/2 object-contain"
        style={{ top: 140 }}
        aria-hidden
      />

      <DialogueBox
        key={previewTone}
        photoUrl={null}
        name={childName}
        anchorY={PREVIEW_ANCHOR_Y}
        segments={[{ text: previewLine }]}
      />

      <div className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl border-t-4 border-cyan-400/40 bg-[#0a0e27] px-4 pt-4 pb-6 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        <p className="font-display text-center text-xs font-bold tracking-widest text-cyan-300/70 uppercase">
          Step 3 of 8
        </p>
        <h2 className="font-display mt-1 text-center text-lg font-bold text-white">
          Pick a voice for {childName}
        </h2>

        <div className="mt-4 flex flex-col gap-2">
          {TONE_ORDER.map((tone) => {
            const isSelected = selected === tone;
            return (
              <button
                key={tone}
                type="button"
                onClick={() => {
                  playSfx("buttonTap");
                  onSelect(tone);
                }}
                className={`font-display rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold transition ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-400/15 text-cyan-300"
                    : "border-cyan-400/25 text-white/80"
                }`}
              >
                {TONE_LABELS[tone]}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              playSfx("buttonTap");
              onBack();
            }}
            className="font-display rounded-xl border-2 border-cyan-400/40 px-5 py-3 text-sm font-bold text-cyan-300"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              playSfx("buttonTap");
              onContinue();
            }}
            className="font-display flex-1 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-900 shadow transition active:scale-95 disabled:opacity-30 disabled:active:scale-100"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
