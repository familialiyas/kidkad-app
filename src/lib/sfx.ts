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
// noticeably hotter than the rest. Linear gain tops out at 1 (no headroom
// to boost the quieter ones), so the hot sounds are pulled down to bring
// the whole set to a comparable perceived level.
const SFX_VOLUME: Record<SfxName, number> = {
  coinCollect: 0.65,
  giftOpen: 0.85,
  warp: 0.7,
  dialogueOpen: 0.6,
  dialogueClose: 1,
  buttonTap: 1,
  rsvpSuccess: 0.85,
};

// Web Audio API instead of <audio> elements: HTMLAudioElement fetches and
// decodes its source lazily on the first play() call, which is fast enough
// to go unnoticed on desktop but shows up as a 1s+ delay on mobile browsers.
// Decoding every SFX into an in-memory AudioBuffer up front (below) and
// triggering playback through AudioBufferSourceNode instead avoids that
// decode-on-play cost entirely — start() only has to schedule already-decoded
// PCM data.
let audioContext: AudioContext | null = null;
const bufferCache: Partial<Record<SfxName, AudioBuffer>> = {};
const loadPromises: Partial<Record<SfxName, Promise<AudioBuffer | null>>> = {};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function loadBuffer(name: SfxName): Promise<AudioBuffer | null> {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(null);
  if (bufferCache[name]) return Promise.resolve(bufferCache[name] ?? null);
  const existing = loadPromises[name];
  if (existing) return existing;

  const promise = fetch(SFX_SRC[name])
    .then((res) => res.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      bufferCache[name] = buffer;
      return buffer;
    })
    .catch(() => null);
  loadPromises[name] = promise;
  return promise;
}

// Kick off decoding every SFX as soon as this module loads on the client,
// so buffers are already sitting in memory well before the user's first
// tap — this pre-decode is what actually removes the mobile delay, not
// just moving where the decode happens.
if (typeof window !== "undefined") {
  (Object.keys(SFX_SRC) as SfxName[]).forEach((name) => loadBuffer(name));
}

function isMuted(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

function trigger(name: SfxName, buffer: AudioBuffer, ctx: AudioContext) {
  // Mobile browsers create (or keep) the AudioContext suspended until a
  // user gesture resumes it. Every playSfx call already happens inside a
  // tap handler, so calling resume() here — without awaiting it before
  // start() — is the standard unlock pattern: no separate first-interaction
  // setup needed elsewhere.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = SFX_VOLUME[name];
  source.connect(gain).connect(ctx.destination);
  source.start(0);
}

export function playSfx(name: SfxName) {
  if (typeof window === "undefined" || isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const buffer = bufferCache[name];
  if (buffer) {
    trigger(name, buffer, ctx);
    return;
  }
  // Not decoded yet — e.g. a sound triggered in the first instant of page
  // load, before its fetch+decode finished. Play it the moment it's ready
  // instead of silently dropping the cue (this should be rare in practice
  // since decoding starts at module load, not on first use).
  loadBuffer(name).then((b) => {
    if (b) trigger(name, b, ctx);
  });
}
