"use client";

import { useMemo } from "react";
import { generateStars } from "@/lib/starfield";

/**
 * A static (non-scrolling) version of the game's parallax star field, for
 * full-viewport steps in the customization form that have no guest_link yet
 * to seed against — a fixed seed is fine here since the pattern doesn't need
 * to vary per order the way the guest-facing game's does.
 */
export default function StarfieldBackground({ seed = "kidkad-create-form" }: { seed?: string }) {
  const stars = useMemo(() => generateStars(seed, 900), [seed]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "linear-gradient(to top, #0a0e27 0%, #1a1f4e 100%)" }}
      aria-hidden
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${(star.top / 900) * 100}%`,
            left: `${star.leftPct}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
}
