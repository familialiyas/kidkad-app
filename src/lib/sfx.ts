"use client";

// One-shot sound effects. Reads the same localStorage flag AudioToggle
// writes for the background music, so the single mute control silences
// both without any React wiring between them.
const AUDIO_MUTED_KEY = "koolkad_audio_muted";

export type SfxName =
  | "coinCollect"
  | "giftOpen"
  | "warp"
  | "dialogueOpen"
  | "dialogueClose"
  | "buttonTap"
  | "rsvpSuccess";

// Most SFX are short enough that real-time synthesis (below) gives cleaner,
// more exactly-timed results than a recorded file ever could — no fiddling
// with a waveform editor to get a click or blip feeling right, and no
// decode-on-play cost at all (synthesis is pure code, nothing to fetch or
// decode). `giftOpen` is the one holdout: a convincing rustling/unwrapping
// sound isn't a good synthesis candidate, so it stays a real recorded file,
// decoded into an AudioBuffer up front for the same reason this whole file
// moved off <audio> elements originally — HTMLAudioElement decodes lazily on
// first play(), which shows up as a 1s+ delay on mobile.
const FILE_SFX_SRC = {
  giftOpen: "/assets/shared/audio/sfx-gift-open.mp3",
} as const;
type FileSfxName = keyof typeof FILE_SFX_SRC;

// Relative loudness pass, unchanged by the move to synthesis — still the
// single source of truth for each sound's final playback level, applied as
// the last gain stage regardless of whether the sound underneath is a
// decoded file or a live oscillator graph.
const SFX_VOLUME: Record<SfxName, number> = {
  coinCollect: 0.65,
  giftOpen: 0.85,
  warp: 0.7,
  dialogueOpen: 0.6,
  dialogueClose: 1,
  buttonTap: 1,
  rsvpSuccess: 0.85,
};

let audioContext: AudioContext | null = null;
const bufferCache: Partial<Record<FileSfxName, AudioBuffer>> = {};
const loadPromises: Partial<Record<FileSfxName, Promise<AudioBuffer | null>>> = {};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function loadBuffer(name: FileSfxName): Promise<AudioBuffer | null> {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(null);
  if (bufferCache[name]) return Promise.resolve(bufferCache[name] ?? null);
  const existing = loadPromises[name];
  if (existing) return existing;

  const promise = fetch(FILE_SFX_SRC[name])
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

// Kick off decoding the one file-backed SFX as soon as this module loads on
// the client, so it's already sitting in memory well before the user's
// first tap — same reasoning as before, just scoped to one sound now.
if (typeof window !== "undefined") {
  (Object.keys(FILE_SFX_SRC) as FileSfxName[]).forEach((name) => loadBuffer(name));
}

function isMuted(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

// --- Synthesis primitives -------------------------------------------------

interface ToneSpec {
  type?: OscillatorType;
  /** Starting frequency (Hz). */
  freqStart: number;
  /** Ending frequency — omit for a flat (non-swept) tone. */
  freqEnd?: number;
  /** Seconds from now before this tone starts — for sequencing multiple notes. */
  delay?: number;
  /** Total tone length in seconds, envelope included. */
  duration: number;
  /** Peak envelope gain, 0-1. */
  peakGain?: number;
  /** Seconds to ramp up to peakGain — 0 would click, so this always has a small floor. */
  attack?: number;
}

/** Schedules one oscillator with a linear attack + exponential decay
 * envelope — the shared building block every synthesized SFX below is made
 * of, whether that's a single tone (button-tap) or several in sequence
 * (coin-collect, rsvp-success). */
function scheduleTone(ctx: AudioContext, dest: AudioNode, spec: ToneSpec) {
  const {
    type = "sine",
    freqStart,
    freqEnd = freqStart,
    delay = 0,
    duration,
    peakGain = 0.8,
    attack = 0.005,
  } = spec;
  const startAt = ctx.currentTime + delay;
  const endAt = startAt + duration;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, startAt);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, endAt);
  }

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, startAt);
  envelope.gain.linearRampToValueAtTime(peakGain, startAt + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endAt);

  osc.connect(envelope).connect(dest);
  osc.start(startAt);
  osc.stop(endAt + 0.02);
}

/** A short bell-like note — a sine fundamental plus a quiet octave-up
 * overtone for sparkle. Shared by coin-collect and rsvp-success so both
 * "chime" cues share one consistent voice. */
function scheduleChimeNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  delay: number,
  duration: number,
  peakGain: number
) {
  scheduleTone(ctx, dest, { type: "sine", freqStart: freq, duration, delay, peakGain, attack: 0.004 });
  scheduleTone(ctx, dest, {
    type: "sine",
    freqStart: freq * 2,
    duration: duration * 0.7,
    delay,
    peakGain: peakGain * 0.3,
    attack: 0.004,
  });
}

// --- Synthesized SFX --------------------------------------------------

function synthButtonTap(ctx: AudioContext, dest: AudioNode) {
  // Quick sine pitch-drop — reads as a soft, clean "pop" rather than a
  // harsh mechanical click.
  scheduleTone(ctx, dest, {
    type: "sine",
    freqStart: 900,
    freqEnd: 300,
    duration: 0.055,
    attack: 0.002,
    peakGain: 0.7,
  });
}

function synthDialogueOpen(ctx: AudioContext, dest: AudioNode) {
  // Soft upward blip.
  scheduleTone(ctx, dest, {
    type: "sine",
    freqStart: 500,
    freqEnd: 950,
    duration: 0.16,
    attack: 0.015,
    peakGain: 0.55,
  });
}

function synthDialogueClose(ctx: AudioContext, dest: AudioNode) {
  // Mirror of dialogueOpen — same shape, swept downward instead.
  scheduleTone(ctx, dest, {
    type: "sine",
    freqStart: 950,
    freqEnd: 480,
    duration: 0.14,
    attack: 0.01,
    peakGain: 0.55,
  });
}

function synthCoinCollect(ctx: AudioContext, dest: AudioNode) {
  // Classic two-note "ding-ding", a bright ascending interval (B5 -> E6).
  scheduleChimeNote(ctx, dest, 987.77, 0, 0.22, 0.9);
  scheduleChimeNote(ctx, dest, 1318.51, 0.07, 0.22, 0.9);
}

function synthRsvpSuccess(ctx: AudioContext, dest: AudioNode) {
  // Ascending major-triad arpeggio (C5-E5-G5) for a celebratory close —
  // same chime voice as coin-collect for a consistent "reward" sound
  // language across the app.
  scheduleChimeNote(ctx, dest, 523.25, 0, 0.3, 0.8);
  scheduleChimeNote(ctx, dest, 659.25, 0.1, 0.3, 0.8);
  scheduleChimeNote(ctx, dest, 783.99, 0.2, 0.35, 0.8);
}

function synthWarp(ctx: AudioContext, dest: AudioNode) {
  // Rising pitch-sweep riser for the mission-complete warp transition —
  // sawtooth for a sci-fi edge, routed through a lowpass filter that opens
  // up in sync with the pitch rise so it brightens instead of staying
  // harsh throughout. Evaluated against keeping the original recorded
  // warp SFX; this synthesized sweep reads clearly as "powering up" and
  // fits the moment, so it replaces the file rather than sitting alongside it.
  const duration = 0.8;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(6000, ctx.currentTime + duration);
  filter.connect(dest);
  scheduleTone(ctx, filter, {
    type: "sawtooth",
    freqStart: 110,
    freqEnd: 1500,
    duration,
    attack: 0.05,
    peakGain: 0.5,
  });
}

const SYNTH_SFX: Partial<Record<SfxName, (ctx: AudioContext, dest: AudioNode) => void>> = {
  buttonTap: synthButtonTap,
  dialogueOpen: synthDialogueOpen,
  dialogueClose: synthDialogueClose,
  coinCollect: synthCoinCollect,
  rsvpSuccess: synthRsvpSuccess,
  warp: synthWarp,
};

// --- Playback ---------------------------------------------------------

function playBuffer(ctx: AudioContext, buffer: AudioBuffer, dest: AudioNode) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(dest);
  source.start(0);
}

export function playSfx(name: SfxName) {
  if (typeof window === "undefined" || isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Mobile browsers create (or keep) the AudioContext suspended until a
  // user gesture resumes it. Every playSfx call already happens inside a
  // tap handler, so calling resume() here — without awaiting it before the
  // sound starts — is the standard unlock pattern: no separate
  // first-interaction setup needed elsewhere.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  // One shared gain stage per play, applying this sound's volume
  // multiplier — whichever path below feeds it (synthesis or a decoded
  // file), the final level comes out the same way.
  const masterGain = ctx.createGain();
  masterGain.gain.value = SFX_VOLUME[name];
  masterGain.connect(ctx.destination);

  const synth = SYNTH_SFX[name];
  if (synth) {
    synth(ctx, masterGain);
    return;
  }

  const fileName = name as FileSfxName;
  const buffer = bufferCache[fileName];
  if (buffer) {
    playBuffer(ctx, buffer, masterGain);
    return;
  }
  // Not decoded yet — e.g. triggered in the first instant of page load,
  // before its fetch+decode finished. Play it the moment it's ready
  // instead of silently dropping the cue (should be rare in practice
  // since decoding starts at module load, not on first use).
  loadBuffer(fileName).then((b) => {
    if (b) playBuffer(ctx, b, masterGain);
  });
}
