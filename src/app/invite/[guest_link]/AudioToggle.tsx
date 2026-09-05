"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const STORAGE_KEY = "kidkad_audio_muted";

export interface AudioToggleHandle {
  /** Attempts playback from a real user gesture (e.g. the "Start Mission"
   * tap) — mobile browsers block unmuted autoplay on page load, so this is
   * the reliable point to actually start the music if unmuted. */
  tryPlay: () => void;
}

const AudioToggle = forwardRef<AudioToggleHandle, { src: string }>(function AudioToggle(
  { src },
  ref
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Defaults to unmuted (SSR-safe — no localStorage access during render);
  // corrected from the stored preference right after mount.
  const [muted, setMuted] = useState(false);

  useImperativeHandle(ref, () => ({
    tryPlay: () => {
      const audio = audioRef.current;
      if (!audio || muted) return;
      audio.play().catch(() => {});
    },
  }));

  useEffect(() => {
    // Deferred via a microtask (not a bare synchronous call) since this
    // effect's only job is reconciling with the external localStorage system.
    Promise.resolve().then(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored !== null) setMuted(stored === "true");
      } catch {
        // localStorage unavailable — just keep the default
      }
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    if (!muted) audio.play().catch(() => {}); // browsers may still block until a user gesture
  }, [muted]);

  function toggle() {
    setMuted((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore — toggle still works for this session
      }
      return next;
    });
  }

  return (
    <>
      <audio ref={audioRef} src={src} loop autoPlay muted={muted} />
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? "Unmute music" : "Mute music"}
        className="font-display fixed top-4 left-4 z-[60] flex h-9 items-center justify-center rounded-full bg-black/60 px-3 text-xs font-bold text-white shadow-lg"
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </>
  );
});

export default AudioToggle;
