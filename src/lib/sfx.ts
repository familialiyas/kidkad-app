"use client";

// One-shot sound effects. Reads the same localStorage flag AudioToggle
// writes for the background music, so the single mute control silences
// both without any React wiring between them.
const AUDIO_MUTED_KEY = "kidkad_audio_muted";

export type SfxName =
  | "coinCollect"
  | "giftOpen"
  | "warp"
  | "dialogueOpen"
  | "dialogueClose"
  | "buttonTap"
  | "rsvpSuccess";

const SFX_SRC: Record<SfxName, string> = {
  coinCollect: "/assets/theme/space/audio/sfx-coin-collect.mp3",
  giftOpen: "/assets/theme/space/audio/sfx-gift-open.mp3",
  warp: "/assets/theme/space/audio/sfx-warp.mp3",
  dialogueOpen: "/assets/theme/space/audio/sfx-dialogue-open.mp3",
  dialogueClose: "/assets/theme/space/audio/sfx-dialogue-close.mp3",
  buttonTap: "/assets/theme/space/audio/sfx-button-tap.mp3",
  rsvpSuccess: "/assets/theme/space/audio/sfx-rsvp-success.mp3",
};

// Relative loudness pass: coin-collect and dialogue-open were recorded
// noticeably hotter than the rest. HTMLAudioElement volume tops out at 1
// (no headroom to boost the quieter ones), so the hot sounds are pulled
// down to bring the whole set to a comparable perceived level.
const SFX_VOLUME: Record<SfxName, number> = {
  coinCollect: 0.65,
  giftOpen: 0.85,
  warp: 0.7,
  dialogueOpen: 0.6,
  dialogueClose: 1,
  buttonTap: 1,
  rsvpSuccess: 0.85,
};

const cache: Partial<Record<SfxName, HTMLAudioElement>> = {};

function isMuted(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

export function playSfx(name: SfxName) {
  if (typeof window === "undefined" || isMuted()) return;
  let audio = cache[name];
  if (!audio) {
    audio = new Audio(SFX_SRC[name]);
    cache[name] = audio;
  }
  audio.volume = SFX_VOLUME[name];
  // Restart from the top even if a rapid double-tap re-triggers the same
  // sound mid-playback, rather than letting instances pile up.
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
