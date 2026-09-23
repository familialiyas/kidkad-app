"use client";

import { CSSProperties, MouseEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { playSfx } from "@/lib/sfx";
import { DialogueSegment, segmentsFullLength, sliceSegments } from "@/lib/typewriter";
import { themeUiStyle, type ThemeAssets } from "@/lib/theme-config";
import { frameInset, frameWidth } from "@/lib/game-constants";
import { ChevronDownIcon } from "./PartyIcons";

const GAP = 20; // space between the character's head and the box (room for the tail)
const BOTTOM_MARGIN = 12; // minimum distance from the bottom viewport edge
// Clears the fixed mute button (top-4 left-4, h-10 → its bottom edge sits at
// 56px) plus a buffer — the box's own photo/name header renders ~24px inside
// its own top edge, so anything smaller here lets that header collide with
// the mute button on short viewports (confirmed: it does, at MARGIN=12).
const TOP_MARGIN = 56;
const EXIT_DURATION_MS = 150;
const TYPE_SPEED_MS = 24;

export default function DialogueBox({
  photoUrl,
  name,
  theme,
  children,
  segments,
  icon,
  footer,
  onTapDismiss,
  onClose,
  onTalkingChange,
  anchorY,
  scrollHint = false,
}: {
  photoUrl: string | null;
  name: string;
  /** Resolved from the order's template (theme-config.ts's getTheme) — sets this box's colors, and everything rendered inside it (footer buttons, RsvpForm) via CSS inheritance. */
  theme: ThemeAssets;
  /** Rendered as-is, immediately, with no typewriter (e.g. the RSVP form). Ignored when `segments` is set. */
  children?: ReactNode;
  /** Typed conversational text, revealed character-by-character. Highlighted segments get the accent treatment + pop. */
  segments?: DialogueSegment[];
  /** Small icon shown beside the typed text (e.g. a calendar icon for the date/time dialogue). */
  icon?: ReactNode;
  /** Ignored when onTapDismiss is set — tap-anywhere dialogues show a hint instead of buttons. */
  footer?: ReactNode;
  /** For single-action "read this and continue" dialogues: the whole screen dismisses it, no button. */
  onTapDismiss?: () => void;
  /** Shows a visible "×" close button (top-right of the card) wired to
   * this when provided — an always-available, immediate way back to the
   * game screen, independent of onTapDismiss's typing-aware two-step
   * (first tap completes text, second dismisses). Clicking × always closes
   * right away, regardless of typing state. Every real in-game dialogue
   * passes this; omitted only by the static /create tone-preview usage,
   * which has no game state to close back to. */
  onClose?: () => void;
  /** Reports whether text is actively typing, so the character sprite can play a talking loop. */
  onTalkingChange?: (talking: boolean) => void;
  /** Viewport-relative Y coordinate of the character's head — the box floats just above this, tail pointing down at it. */
  anchorY: number;
  /** Adds a bouncing-chevron "scroll down to explore" cue below "Tap
   * anywhere to continue" — a one-time game-mechanic hint (confirmed
   * real-world confusion: a first-time player didn't realize scrolling,
   * not tapping, is how you move) for the opening dialogue only, not
   * theme-specific content. Ignored when onTapDismiss isn't set, since
   * there's no "tap anywhere to continue" line for it to sit under. */
  scrollHint?: boolean;
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
  const maxTop = Math.max(viewportHeight - measuredHeight - BOTTOM_MARGIN, TOP_MARGIN);
  const top = Math.min(Math.max(desiredTop, TOP_MARGIN), maxTop);

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

  function handleClose(e: MouseEvent) {
    e.stopPropagation(); // don't also trigger the backdrop's onTapDismiss handling
    if (!onClose || isExiting) return;
    playSfx("dialogueClose");
    setIsExiting(true);
    setTimeout(onClose, EXIT_DURATION_MS);
  }

  return (
    <div
      className={`fixed top-0 bottom-0 z-50 ${onTapDismiss ? "cursor-pointer" : ""}`}
      style={{ left: frameInset(0), width: frameWidth(), ...themeUiStyle(theme) } as CSSProperties}
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
            className="dialogue-space-bg ui-border-accent-80 absolute bottom-0 left-1/2 z-0 h-5 w-5 translate-x-[-50%] translate-y-1/2 rotate-45 border-r-4 border-b-4"
            aria-hidden
          />

          {/* Always-available close button — immediate, bypasses the typing-aware
              tap-to-dismiss flow entirely, so it works the same regardless of
              whether this dialogue also supports tap-anywhere or has footer buttons. */}
          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="ui-text-accent-light absolute top-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-lg leading-none active:scale-95"
            >
              ×
            </button>
          )}

          <div className="font-display relative z-10">
            <div className="flex items-center gap-3">
              <div className="ui-border-accent-70 relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 bg-slate-800">
                {photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="ui-text-accent-light font-bold">{name}</div>
            </div>
            <div className="mt-3 min-h-[3rem] text-[16.5px] leading-relaxed text-slate-100">
              {segments ? (
                <div className="flex items-start gap-2">
                  {icon && <span className="ui-text-accent mt-0.5 shrink-0">{icon}</span>}
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
              <>
                <p className="ui-text-accent-light-70 mt-4 animate-pulse text-center text-xs">
                  Tap anywhere to continue
                </p>
                {scrollHint && (
                  <div className="mt-2 flex justify-center">
                    {/* A visually lighter "tip" chip, not a second instruction
                        competing with "Tap anywhere to continue" above —
                        smaller text, muted color, and its own pill
                        background so the chevron+text read as one
                        supplementary hint rather than two loose pieces. */}
                    <div className="ui-bg-accent-12 inline-flex items-center gap-1 rounded-full px-2.5 py-1">
                      <ChevronDownIcon className="scroll-hint-bounce ui-text-accent-light-70 h-3 w-3 shrink-0" />
                      <p className="ui-text-accent-light-70 font-body text-center text-[10px] leading-none">
                        Scroll down to explore and collect coins!
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 flex flex-col gap-2">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
