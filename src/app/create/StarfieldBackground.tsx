"use client";

import { useMemo } from "react";
import { generateStars, type ParticleConfig } from "@/lib/starfield";

// Wizard-chrome page background — fixed, not theme-derived (see the
// "wizard chrome" palette block in globals.css). Previously this hardcoded
// THEME_CONFIG.themes.space's sky gradient and particle color, back when
// /create had no theme-picker UI and space was the only real option; now
// that theme selection is a real step in the flow, tying the wizard's own
// background to one specific theme no longer makes sense.
const WIZARD_BG = "#1a1614";
const NEUTRAL_PARTICLES: ParticleConfig = {
  color: "#a89a8c",
  sizeMin: 1,
  sizeMax: 3,
  opacityMin: 0.2,
  opacityMax: 0.5,
};

/**
 * A static (non-scrolling) ambient dot field for full-viewport steps in the
 * customization form that have no guest_link yet to seed against — a fixed
 * seed is fine here since the pattern doesn't need to vary per order the
 * way the guest-facing game's does.
 */
export default function StarfieldBackground({ seed = "koolkad-create-form" }: { seed?: string }) {
  const stars = useMemo(() => generateStars(seed, 900, NEUTRAL_PARTICLES), [seed]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: WIZARD_BG }}
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
            backgroundColor: NEUTRAL_PARTICLES.color,
          }}
        />
      ))}
    </div>
  );
}
