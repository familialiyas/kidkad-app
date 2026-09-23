import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import StarfieldBackground from "../../StarfieldBackground";
import CopyLinkRow from "../CopyLinkRow";
import PaymentPendingPanel from "../PaymentPendingPanel";
import ShareReminderBanner from "../ShareReminderBanner";

export default async function CreateSuccessPage({
  params,
}: {
  params: Promise<{ order_token: string }>;
}) {
  const { order_token } = await params;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "order_token, guest_link, admin_link, payment_status, character, dialogue_tone, child_name, child_age, child_photo_url, personal_message, parent_name, parent_email, party_date, party_time, party_venue, maps_link, dress_code, rsvp_deadline, rsvp_phone_contact"
    )
    .eq("order_token", order_token)
    .maybeSingle();

  if (!order) notFound();

  const isPaid = order.payment_status === "paid";

  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const origin = host ? `${protocol}://${host}` : "";
  const guestUrl = `${origin}/invite/${order.guest_link}`;
  const adminUrl = `${origin}/dashboard/${order.admin_link}`;

  const rows: [string, string | number | null][] = [
    ["order_token", order.order_token],
    ["guest_link", order.guest_link],
    ["admin_link", order.admin_link],
    ["payment_status", order.payment_status],
    ["character", order.character],
    ["dialogue_tone", order.dialogue_tone],
    ["child_name", order.child_name],
    ["child_age", order.child_age],
    ["child_photo_url", order.child_photo_url],
    ["personal_message", order.personal_message],
    ["parent_name", order.parent_name],
    ["parent_email", order.parent_email],
    ["party_date", order.party_date],
    ["party_time", order.party_time],
    ["party_venue", order.party_venue],
    ["maps_link", order.maps_link],
    ["dress_code", order.dress_code],
    ["rsvp_deadline", order.rsvp_deadline],
    ["rsvp_phone_contact", order.rsvp_phone_contact],
  ];

  return (
    <div className="relative min-h-screen px-4 py-10">
      <StarfieldBackground seed={`koolkad-success-${order.order_token}`} />
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-wizard-accent text-2xl font-bold drop-shadow-[0_0_14px_rgba(255,255,255,0.6)]">
          {isPaid ? "Your invitation is ready!" : "Almost there!"}
        </h1>
        <p className="font-body text-wizard-text-muted mt-2 text-sm">
          {isPaid
            ? "Share these links with your guests whenever you're ready."
            : "We're just waiting on payment confirmation before showing your links."}
        </p>

        {isPaid ? (
          <>
            <ShareReminderBanner guestUrl={guestUrl} adminUrl={adminUrl} />
            <div className="mt-6 flex flex-col gap-3">
              <CopyLinkRow label="Guest game link" url={guestUrl} />
              <CopyLinkRow label="Your dashboard link (see RSVPs)" url={adminUrl} />
            </div>

            <details className="font-body text-wizard-text-muted mt-8 text-left text-xs">
              <summary className="text-wizard-accent-light/70 cursor-pointer font-bold">
                Full order details (verification)
              </summary>
              <div className="border-wizard-border bg-wizard-panel/50 mt-3 overflow-hidden rounded-xl border">
                {rows.map(([key, value]) => (
                  <div
                    key={key}
                    className="border-wizard-border flex flex-col gap-0.5 border-b px-4 py-2.5 last:border-0"
                  >
                    <span className="text-wizard-accent-light/50 font-bold">{key}</span>
                    <span className="text-wizard-text/80 break-all">
                      {value === null || value === "" ? (
                        <span className="text-red-400">— empty —</span>
                      ) : (
                        String(value)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </>
        ) : (
          // Guests can land here via toyyibPay's return URL before the
          // callback has finished processing — poll rather than assume failure.
          <PaymentPendingPanel />
        )}
      </div>
    </div>
  );
}
