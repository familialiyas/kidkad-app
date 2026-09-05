"use client";

import { useState } from "react";

const COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#ec4899", "#eab308"];

export default function Confetti({ count = 40 }: { count?: number }) {
  // Randomized once via lazy initializer — the sanctioned place for one-time
  // impure setup, since useMemo re-runs on re-render and isn't guaranteed once.
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2 + Math.random() * 1.5,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
    }))
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
