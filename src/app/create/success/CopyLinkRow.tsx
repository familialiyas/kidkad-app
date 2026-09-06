"use client";

import { useState } from "react";
import { playSfx } from "@/lib/sfx";

export default function CopyLinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    playSfx("buttonTap");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the link is still selectable/visible as text
    }
  }

  return (
    <div className="w-full rounded-xl border-2 border-cyan-400/30 bg-slate-900/50 p-4">
      <p className="font-body text-xs font-bold text-cyan-300/60">{label}</p>
      <p className="font-body mt-1 text-sm break-all text-white">{url}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="font-display mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-900 active:scale-95"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
