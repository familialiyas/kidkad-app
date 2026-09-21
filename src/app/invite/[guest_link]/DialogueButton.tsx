"use client";

import { ButtonHTMLAttributes } from "react";
import { playSfx } from "@/lib/sfx";

export default function DialogueButton({
  variant = "primary",
  theme = "amber",
  className = "",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  /** "space" for buttons inside the in-game (dark) dialogue; "amber" for the return-visit screen's own cream card. */
  theme?: "space" | "amber";
}) {
  const base =
    "font-display w-full rounded-xl px-4 py-2.5 text-sm font-bold shadow transition active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const styles =
    theme === "space"
      ? variant === "primary"
        ? "dialogue-btn-primary"
        : "dialogue-btn-secondary border-2"
      : variant === "primary"
        ? "bg-amber-600 text-white hover:bg-amber-700"
        : "bg-white text-amber-800 border-2 border-amber-600 hover:bg-amber-100";
  return (
    <button
      className={`${base} ${styles} ${className}`}
      onClick={(e) => {
        playSfx("buttonTap");
        onClick?.(e);
      }}
      {...props}
    />
  );
}
