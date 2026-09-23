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
    <div className="border-wizard-border bg-wizard-panel/50 w-full rounded-xl border-2 p-4">
      <p className="font-body text-wizard-accent-light/60 text-xs font-bold">{label}</p>
      <p className="font-body text-wizard-text mt-1 text-sm break-all">{url}</p>
      <div className="mt-3 flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playSfx("buttonTap")}
          className="font-display border-wizard-border text-wizard-accent-light flex-1 rounded-lg border-2 px-4 py-2 text-center text-xs font-bold active:scale-95"
        >
          Open link
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="font-display bg-wizard-accent text-wizard-bg flex-1 rounded-lg px-4 py-2 text-xs font-bold active:scale-95"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
