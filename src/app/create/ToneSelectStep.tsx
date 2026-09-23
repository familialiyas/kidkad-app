"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { THEME_CONFIG, type ThemeName } from "@/lib/theme-config";
import type { Character } from "@/lib/types";
import { DIALOGUE_TONES, TONE_LABELS, fillTemplate, DialogueTone } from "@/lib/dialogue-tones";
import { playSfx } from "@/lib/sfx";
import DialogueBox from "../invite/[guest_link]/DialogueBox";
import StarfieldBackground from "./StarfieldBackground";

const DEFAULT_PREVIEW_ANCHOR_Y = 430;
// Breathing room between the preview bubble and the sheet below it.
const SHEET_GAP = 16;
// Never push the preview bubble so high it collides with the sprite/heading
// above it, even if the sheet somehow measures unexpectedly tall.
const MIN_ANCHOR_Y = 180;

const TONE_ORDER: DialogueTone[] = ["excited", "sweet", "silly"];

export default function ToneSelectStep({
  theme,
  character,
  childName,
  childAge,
  selected,
  onSelect,
  onBack,
  onContinue,
}: {
  /** The theme picked earlier in the flow — drives the preview's character
   * sprite and DialogueBox styling, matching CharacterSelectStep. */
  theme: ThemeName;
  character: Character;
  childName: string;
  childAge: string;
  selected: DialogueTone | null;
  onSelect: (tone: DialogueTone) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [anchorY, setAnchorY] = useState(DEFAULT_PREVIEW_ANCHOR_Y);

  // The preview bubble above and the tone-picker sheet below are both
  // independently fixed-positioned, so — unlike normal document flow —
  // nothing here pushes the other out of the way on its own. Measuring the
  // sheet's actual rendered height (it varies with content) lets the
  // preview move up to stay clear of it on short mobile viewports instead
  // of overlapping (confirmed: at anchorY fixed to 430, a 667px-tall
  // viewport already overlaps by ~90px).
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    function update() {
      const sheetHeight = el!.getBoundingClientRect().height;
      const available = window.innerHeight - sheetHeight - SHEET_GAP;
      setAnchorY(Math.max(Math.min(DEFAULT_PREVIEW_ANCHOR_Y, available), MIN_ANCHOR_Y));
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const themeAssets = THEME_CONFIG.themes[theme];
  const sprite = themeAssets.characterSprites[character].idle;
  const previewTone = selected ?? "excited";
  const previewLine = fillTemplate(DIALOGUE_TONES[previewTone].opening, {
    name: childName,
    age: childAge,
  });

  return (
    <div className="relative min-h-screen">
      <StarfieldBackground seed="koolkad-create-form-tone" />

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
        theme={themeAssets}
        anchorY={anchorY}
        segments={[{ text: previewLine }]}
      />

      <div
        ref={sheetRef}
        className="border-wizard-border bg-wizard-panel fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl border-t-4 px-4 pt-4 pb-6 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      >
        <p className="font-display text-wizard-accent/70 text-center text-xs font-bold tracking-widest uppercase">
          Step 4 of 8
        </p>
        <h2 className="font-display text-wizard-accent mt-1 text-center text-lg font-bold">
          Pick A Voice
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
                    ? "border-wizard-accent bg-wizard-accent/15 text-wizard-accent-light"
                    : "border-wizard-border text-wizard-text/80"
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
            className="font-display border-wizard-border text-wizard-accent-light rounded-xl border-2 px-5 py-3 text-sm font-bold"
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
            className="font-display bg-wizard-accent text-wizard-bg flex-1 rounded-xl px-6 py-3 text-sm font-bold shadow transition active:scale-95 disabled:opacity-30 disabled:active:scale-100"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
