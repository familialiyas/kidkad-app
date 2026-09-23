"use client";

import { buildWhatsAppLink } from "@/lib/whatsapp";
import { playSfx } from "@/lib/sfx";

export default function ShareReminderBanner({
  guestUrl,
  adminUrl,
}: {
  guestUrl: string;
  adminUrl: string;
}) {
  const message = `Save these KidKad links so you don't lose them!\n\nGuest game link: ${guestUrl}\nMy dashboard link (see RSVPs): ${adminUrl}`;

  function handleShare() {
    playSfx("buttonTap");
    // navigator.share() opens the device's native share sheet (WhatsApp
    // included, among whatever else is installed) — preferred when
    // available. wa.me with no phone number is the fallback: it opens
    // WhatsApp's own contact picker instead of messaging a fixed number,
    // since this is a self-reminder, not a message to a specific contact.
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ text: message }).catch(() => {});
      return;
    }
    window.open(buildWhatsAppLink(null, message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="border-wizard-border bg-wizard-panel/50 mt-4 rounded-xl border-2 p-4 text-left">
      <p className="font-body text-wizard-text-muted text-sm">
        Save this page — send these links to yourself on WhatsApp so you don&apos;t lose them.
      </p>
      <button
        type="button"
        onClick={handleShare}
        className="font-display bg-wizard-accent text-wizard-bg mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-bold active:scale-95"
      >
        Share to WhatsApp
      </button>
    </div>
  );
}
