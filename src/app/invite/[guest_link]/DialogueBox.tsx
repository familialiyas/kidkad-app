"use client";

import { ReactNode, useLayoutEffect, useRef, useState } from "react";

const GAP = 20; // space between the character's head and the box (room for the tail)
const MARGIN = 12; // minimum distance from the viewport edges
const EXIT_DURATION_MS = 150;

export default function DialogueBox({
  photoUrl,
  name,
  children,
  footer,
  onTapDismiss,
  anchorY,
}: {
  photoUrl: string | null;
  name: string;
  children: ReactNode;
  /** Ignored when onTapDismiss is set — tap-anywhere dialogues show a hint instead of buttons. */
  footer?: ReactNode;
  /** For single-action "read this and continue" dialogues: the whole screen dismisses it, no button. */
  onTapDismiss?: () => void;
  /** Viewport-relative Y coordinate of the character's head — the box floats just above this, tail pointing down at it. */
  anchorY: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);

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
    if (!onTapDismiss || isExiting) return;
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
        <div
          ref={boxRef}
          className="dialogue-box dialogue-space-bg dialogue-space-glow relative rounded-2xl border-4 border-cyan-400/80 p-4"
        >
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
            <div className="mt-3 min-h-[3rem] text-sm leading-relaxed text-slate-100">
              {children}
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
