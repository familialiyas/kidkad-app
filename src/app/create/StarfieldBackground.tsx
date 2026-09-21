"use client";

import { useMemo } from "react";
import { generateStars } from "@/lib/starfield";
import { THEME_CONFIG } from "@/lib/theme-config";

/**
 * A static (non-scrolling) version of the game's parallax star field, for
 * full-viewport steps in the customization form that have no guest_link yet
 * to seed against — a fixed seed is fine here since the pattern doesn't need
 * to vary per order the way the guest-facing game's does.
 *
 * Hardcoded to the "space" theme, sourced from THEME_CONFIG rather than a
 * separate literal gradient/color — /create has no theme-picker UI yet, so
 * this has nothing else to read from.
 */
export default function StarfieldBackground({ seed = "kidkad-create-form" }: { seed?: string }) {
  const { particles, skyGradient } = THEME_CONFIG.themes.space;
  const stars = useMemo(() => generateStars(seed, 900, particles), [seed, particles]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: skyGradient }}
      aria-hidden
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full"
          style={{
            top: `${(star.top / 900) * 100}%`,
            left: `${star.leftPct}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            backgroundColor: particles.color,
          }}
        />
      ))}
    </div>
  );
}
