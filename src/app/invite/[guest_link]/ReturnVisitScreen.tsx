"use client";

import { useState } from "react";
import type { PublicOrder, Rsvp } from "@/lib/types";
import { formatFriendlyDate, isPastDeadline } from "@/lib/date";
import { buildGoogleCalendarUrl, buildIcsContent, downloadIcs } from "@/lib/calendar";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { clearStoredRsvp, setStoredRsvp } from "@/lib/rsvp-storage";
import { playSfx } from "@/lib/sfx";
import RsvpForm, { RsvpFormValues } from "./RsvpForm";
import DialogueButton from "./DialogueButton";

export default function ReturnVisitScreen({
  order,
  rsvp,
  onPlayAgain,
}: {
  order: PublicOrder;
  rsvp: Rsvp;
  onPlayAgain: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirmCancel" | "cancelled">("view");
  const [currentRsvp, setCurrentRsvp] = useState(rsvp);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deadlinePassed = isPastDeadline(order.rsvp_deadline);
  const whatsappHostLink = buildWhatsAppLink(
    order.rsvp_phone_contact,
    `Hi! I'm ${currentRsvp.guest_name}, regarding ${order.child_name}'s party.`
  );

  async function handleEditSubmit(values: RsvpFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestLink: order.guest_link,
          guestName: values.guestName,
          guestPhone: values.guestPhone,
          paxCount: values.paxCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setCurrentRsvp(data.rsvp);
      setStoredRsvp(order.guest_link, {
        guestPhone: values.guestPhone,
        guestName: values.guestName,
        paxCount: values.paxCount,
      });
      playSfx("rsvpSuccess");
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestLink: order.guest_link, guestPhone: currentRsvp.guest_phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      clearStoredRsvp(order.guest_link);
      setMode("cancelled");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const childName = order.child_name ?? "me";

  const eventDetails = (
    <div className="space-y-4 text-sm text-slate-100">
      {(order.party_date || order.party_time) && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/theme/space/icons/icon-calendar.png"
              alt=""
              className="mt-0.5 h-6 w-6 shrink-0 object-contain"
              aria-hidden
            />
            <div className="space-y-1">
              {order.party_date && <p>{formatFriendlyDate(order.party_date)}</p>}
              {order.party_time && <p>{order.party_time}</p>}
            </div>
          </div>
          {order.party_date && (
            <div className="flex flex-col gap-2">
              <a
                href={buildGoogleCalendarUrl({
                  childName,
                  partyDate: order.party_date,
                  partyTime: order.party_time,
                  partyVenue: order.party_venue,
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DialogueButton type="button" theme="space" className="w-full">
                  Add to Google Calendar
                </DialogueButton>
              </a>
              <DialogueButton
                type="button"
                variant="secondary"
                theme="space"
                onClick={() =>
                  downloadIcs(
                    "party-invite.ics",
                    buildIcsContent({
                      childName,
                      partyDate: order.party_date!,
                      partyTime: order.party_time,
                      partyVenue: order.party_venue,
                    })
                  )
                }
              >
                Add to Calendar (.ics)
              </DialogueButton>
            </div>
          )}
        </div>
      )}

      {order.party_venue && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/theme/space/icons/icon-location.png"
              alt=""
              className="mt-0.5 h-6 w-6 shrink-0 object-contain"
              aria-hidden
            />
            <p>{order.party_venue}</p>
          </div>
          {order.maps_link && (
            <a href={order.maps_link} target="_blank" rel="noopener noreferrer">
              <DialogueButton type="button" theme="space" className="w-full">
                Open in Maps
              </DialogueButton>
            </a>
          )}
        </div>
      )}

      {order.dress_code && (
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/theme/space/icons/icon-dresscode.png"
            alt=""
            className="mt-0.5 h-6 w-6 shrink-0 object-contain"
            aria-hidden
          />
          <p>{order.dress_code}</p>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(to top, #0a0e27 0%, #1a1f4e 100%)" }}
    >
      <div className="dialogue-space-bg dialogue-space-glow w-full max-w-md rounded-2xl border-4 border-cyan-400/80 p-5">
        {mode === "cancelled" ? (
          <>
            <h1 className="font-display text-lg font-bold text-cyan-300">Aw, we&apos;ll miss you!</h1>
            <p className="mt-2 text-sm text-slate-100">Hope to celebrate with you next time.</p>
            <div className="mt-4">
              <DialogueButton theme="space" onClick={() => setMode("edit")}>
                Changed your mind? RSVP again
              </DialogueButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/theme/space/icons/icon-celebration.png"
                alt=""
                className="h-8 w-8 shrink-0 object-contain"
                aria-hidden
              />
              <h1 className="font-display text-lg font-bold text-cyan-300">
                You&apos;re in! See you at {order.child_name}&apos;s party!
              </h1>
            </div>
            <div className="mt-3">{eventDetails}</div>

            <a
              href="https://kidkad.my"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center text-[11px] text-cyan-300/50 underline decoration-cyan-300/30 underline-offset-2 hover:text-cyan-300/80"
            >
              Loved this? Make your own invitation at kidkad.my
            </a>

            {mode === "view" && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs text-slate-300">
                  RSVP for {currentRsvp.guest_name} · {currentRsvp.pax_count} guest
                  {currentRsvp.pax_count > 1 ? "s" : ""}
                </p>
                <a href={whatsappHostLink} target="_blank" rel="noopener noreferrer">
                  <DialogueButton type="button" variant="secondary" theme="space" className="w-full">
                    Message the host
                  </DialogueButton>
                </a>

                {deadlinePassed ? (
                  <div className="mt-2 rounded-lg bg-red-950/60 p-3 text-xs text-red-300">
                    <p className="font-semibold">RSVP is now closed.</p>
                    <p>Please contact the host directly.</p>
                    <a
                      href={buildWhatsAppLink(
                        order.rsvp_phone_contact,
                        `Hi! Regarding ${order.child_name}'s party...`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-bold underline"
                    >
                      WhatsApp the host
                    </a>
                  </div>
                ) : (
                  <>
                    <DialogueButton theme="space" onClick={() => setMode("edit")}>
                      Edit RSVP
                    </DialogueButton>
                    <button
                      type="button"
                      onClick={() => {
                        playSfx("buttonTap");
                        setMode("confirmCancel");
                      }}
                      className="mt-1 text-xs text-cyan-300/70 underline"
                    >
                      Can&apos;t make it anymore?
                    </button>
                  </>
                )}

                <DialogueButton
                  type="button"
                  variant="secondary"
                  theme="space"
                  className="mt-2 border-dashed"
                  onClick={onPlayAgain}
                >
                  Play Again
                </DialogueButton>
              </div>
            )}

            {mode === "confirmCancel" && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-sm font-semibold text-cyan-300">
                  Are you sure you want to cancel your RSVP?
                </p>
                {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
                <DialogueButton theme="space" onClick={handleCancelConfirm} disabled={submitting}>
                  {submitting ? "Cancelling..." : "Yes, cancel my RSVP"}
                </DialogueButton>
                <DialogueButton
                  variant="secondary"
                  theme="space"
                  onClick={() => setMode("view")}
                  disabled={submitting}
                >
                  Never mind
                </DialogueButton>
              </div>
            )}

            {mode === "edit" && (
              <div className="mt-4">
                <RsvpForm
                  theme="space"
                  initialValues={{
                    guestName: currentRsvp.guest_name,
                    guestPhone: currentRsvp.guest_phone,
                    paxCount: currentRsvp.pax_count,
                  }}
                  submitLabel="Save changes"
                  submitting={submitting}
                  error={error}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setMode("view")}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
