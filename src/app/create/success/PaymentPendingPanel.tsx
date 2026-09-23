"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 3000;
// ~1 minute of automatic checking before falling back to a manual refresh —
// toyyibPay's callback is usually near-instant, but webhooks can lag.
const MAX_AUTO_POLLS = 20;

/**
 * Re-fetches this Server Component page on an interval by calling
 * router.refresh() — once the callback flips payment_status to "paid",
 * the parent page re-renders with the real content and this panel
 * unmounts on its own.
 */
export default function PaymentPendingPanel() {
  const router = useRouter();
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (pollCount >= MAX_AUTO_POLLS) return;
    const id = setTimeout(() => {
      setPollCount((c) => c + 1);
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [pollCount, router]);

  return (
    <div className="border-wizard-border bg-wizard-panel/50 mt-6 rounded-2xl border-2 p-6 text-center">
      <div
        className="border-wizard-border/30 border-t-wizard-accent mx-auto h-8 w-8 animate-spin rounded-full border-4"
        aria-hidden
      />
      <p className="font-display text-wizard-text mt-4 text-base font-bold">
        Confirming your payment…
      </p>
      <p className="font-body text-wizard-text-muted mt-2 text-sm">
        This usually takes just a few seconds — this page will update on its own once it&apos;s
        through.
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="font-display border-wizard-border text-wizard-accent-light mt-4 rounded-xl border-2 px-5 py-2.5 text-sm font-bold"
      >
        Refresh now
      </button>
    </div>
  );
}
