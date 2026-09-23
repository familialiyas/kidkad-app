"use client";

import { useEffect, useState } from "react";

// Every word here must read naturally in "Your Birthday Invite, {word}." —
// checked against all four before adding one.
const WORDS = ["Leveled Up", "Gamified", "More Fun", "Entertaining"];
const HOLD_MS = 2200;
const FADE_MS = 300;

export default function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, FADE_MS);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={`text-wizard-accent inline-block transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {WORDS[index]}
    </span>
  );
}
