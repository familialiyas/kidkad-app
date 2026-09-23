"use client";

import { useEffect, useState } from "react";

// Real screenshots captured from the live app across space/dino/ocean —
// title screen, a mid-game coin dialogue, the gift-open moment, the RSVP
// form, and the host dashboard. See public/assets/landing/hero/.
const SCREENSHOTS = [
  "/assets/landing/hero/screenshot-1.png",
  "/assets/landing/hero/screenshot-2.png",
  "/assets/landing/hero/screenshot-3.png",
  "/assets/landing/hero/screenshot-4.png",
  "/assets/landing/hero/screenshot-5.png",
];
const INTERVAL_MS = 2600;

export default function PhoneMockupCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SCREENSHOTS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto aspect-[9/19.5] h-[38vh] max-h-80 min-h-56 drop-shadow-[0_0_45px_rgba(249,115,22,0.4)]">
      {/* Phone frame */}
      <div className="border-wizard-text/25 bg-wizard-bg absolute inset-0 overflow-hidden rounded-[2rem] border-[6px] shadow-2xl">
        {SCREENSHOTS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            draggable={false}
          />
        ))}
      </div>
      {/* Notch */}
      <div
        className="bg-wizard-bg absolute top-2 left-1/2 h-4 w-20 -translate-x-1/2 rounded-full"
        aria-hidden
      />
    </div>
  );
}
