"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { playSfx } from "@/lib/sfx";
import { DialogueSegment, segmentsFullLength, sliceSegments } from "@/lib/typewriter";

const GAP = 20; // space between the character's head and the box (room for the tail)
const MARGIN = 12; // minimum distance from the viewport edges
const EXIT_DURATION_MS = 150;
const TYPE_SPEED_MS = 24;

export default function DialogueBox({
  photoUrl,
  name,
  children,
  segments,
  icon,
  footer,
  onTapDismiss,
  onTalkingChange,
  anchorY,
}: {
  photoUrl: string | null;
  name: string;
  /** Rendered as-is, immediately, with no typewriter (e.g. the RSVP form). Ignored when `segments` is set. */
  children?: ReactNode;
  /** Typed conversational text, revealed character-by-character. Highlighted segments get the accent treatment + pop. */
  segments?: DialogueSegment[];
  /** Small icon shown beside the typed text (e.g. a calendar icon for the date/time dialogue). */
  icon?: string;
  /** Ignored when onTapDismiss is set — tap-anywhere dialogues show a hint instead of buttons. */
  footer?: ReactNode;
  /** For single-action "read this and continue" dialogues: the whole screen dismisses it, no button. */
  onTapDismiss?: () => void;
  /** Reports whether text is actively typing, so the character sprite can play a talking loop. */
  onTalkingChange?: (talking: boolean) => void;
  /** Viewport-relative Y coordinate of the character's head — the box floats just above this, tail pointing down at it. */
  anchorY: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullLength = segments ? segmentsFullLength(segments) : 0;
  const isComplete = !segments || revealedCount >= fullLength;

  function finishTyping() {
    if (completedRef.current) return;
    completedRef.current = true;
    onTalkingChange?.(false);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  }

  useEffect(() => {
    playSfx("dialogueOpen");
  }, []);

  useEffect(() => {
    if (!segments || fullLength === 0) {
      finishTyping();
      return;
    }
    onTalkingChange?.(true);
    // Tracks the count in a plain local variable rather than a
    // setState(c => ...) functional updater — React can invoke that updater
    // during its own render/reducer evaluation (not only after the interval
    // tick), so a side effect nested inside it (finishTyping, which calls
    // back up to the parent's setState) could fire mid-render and trip
    // "setState while rendering a different component". Calling finishTyping
    // here instead, as a plain statement in the interval's callback, keeps
    // it a normal async event — genuinely outside any render pass.
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      setRevealedCount(count);
      if (count >= fullLength) {
        clearInterval(id);
        intervalRef.current = null;
        finishTyping();
      }
    }, TYPE_SPEED_MS);
    intervalRef.current = id;
    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
    // Mount-only: this dialogue's text never changes mid-instance (a new
    // screen mounts a whole new DialogueBox), so the typing loop should
    // start exactly once against the props it was given at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    // Read the element's own border-box height (not entries[0].contentRect,
    // which excludes padding/border — this box's p-4 + border-4 add 40px
    // that contentRect would silently drop from the position math below).
    const observer = new ResizeObserver(() => {
      setBoxHeight(el.getBoundingClientRect().height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const measuredHeight = boxHeight ?? 220;
  // Default: hug just above the character. If there isn't room above (character
  // near the top of the screen), slide down just enough to stay fully visible.
  const desiredTop = anchorY - GAP - measuredHeight;
  const maxTop = Math.max(viewportHeight - measuredHeight - MARGIN, MARGIN);
  const top = Math.min(Math.max(desiredTop, MARGIN), maxTop);

  function handleTapDismiss() {
    if (isExiting) return;
    if (!isComplete) {
      // First tap while typing: snap to the full sentence instead of
      // dismissing. The interval must be stopped here — otherwise its next
      // tick (running independently of this click) overwrites the jump
      // back down to its own smaller internal counter a moment later.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRevealedCount(fullLength);
      finishTyping();
      return;
    }
    if (!onTapDismiss) return;
    playSfx("dialogueClose");
    setIsExiting(true);
    setTimeout(onTapDismiss, EXIT_DURATION_MS);
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${onTapDismiss ? "cursor-pointer" : ""}`}
      onClick={onTapDismiss ? handleTapDismiss : undefined}
      role={onTapDismiss ? "button" : undefined}
      tabIndex={onTapDismiss ? 0 : undefined}
      onKeyDown={
        onTapDismiss
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleTapDismiss();
            }
          : undefined
      }
    >
      {/* Dim layer, separate from the box below so its own fade doesn't affect box opacity */}
      <div
        className={`absolute inset-0 bg-black/30 ${
          isExiting ? "dialogue-backdrop-exit" : "dialogue-backdrop-enter"
        }`}
        aria-hidden
      />

      <div
        className={`fixed left-1/2 w-full max-w-md px-3 ${
          isExiting ? "dialogue-box-exit" : "dialogue-box-enter"
        }`}
        style={{
          top,
          visibility: boxHeight === null ? "hidden" : "visible",
        }}
      >
        <div ref={boxRef} className="dialogue-box relative p-5">
          {/* Paper-cutout background pane: jagged torn-edge silhouette, grain
              texture, border and glow all live here (not on this element's
              parent) so the ragged edge never eats into the text padding. */}
          <div className="dialogue-paper-bg" aria-hidden />

          {/* Speech-bubble tail, pointing down toward the character below */}
          <div
            className="dialogue-space-bg absolute bottom-0 left-1/2 z-0 h-5 w-5 translate-x-[-50%] translate-y-1/2 rotate-45 border-r-4 border-b-4 border-cyan-400/80"
            aria-hidden
          />
          <div className="font-display relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-cyan-400/70 bg-slate-800">
                {photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="font-bold text-cyan-300">{name}</div>
            </div>
            <div className="mt-3 min-h-[3rem] text-[16.5px] leading-relaxed text-slate-100">
              {segments ? (
                <div className="flex items-start gap-2">
                  {icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={icon}
                      alt=""
                      className="mt-0.5 h-6 w-6 shrink-0 object-contain"
                      aria-hidden
                    />
                  )}
                  <p>
                    {sliceSegments(segments, revealedCount).map((seg, i) =>
                      seg.highlight ? (
                        <span
                          key={i}
                          className={`dialogue-highlight ${isComplete ? "dialogue-highlight-pop" : ""}`}
                        >
                          {seg.text}
                        </span>
                      ) : (
                        <span key={i}>{seg.text}</span>
                      )
                    )}
                  </p>
                </div>
              ) : (
                children
              )}
            </div>
            {onTapDismiss ? (
              <p className="mt-4 animate-pulse text-center text-xs text-cyan-300/70">
                Tap anywhere to continue
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
