import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import StarfieldBackground from "../../StarfieldBackground";
import CopyLinkRow from "../CopyLinkRow";

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
      <StarfieldBackground seed={`kidkad-success-${order.order_token}`} />
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-white drop-shadow-[0_0_14px_rgba(147,197,253,0.6)]">
          Your invitation is ready!
        </h1>
        <p className="font-body mt-2 text-sm text-cyan-100/70">
          Payment isn&apos;t wired up yet, so this link is live right away — share it with your
          guests whenever you&apos;re ready.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <CopyLinkRow label="Guest game link" url={guestUrl} />
          <CopyLinkRow label="Your dashboard link (see RSVPs)" url={adminUrl} />
        </div>

        <details className="font-body mt-8 text-left text-xs text-cyan-100/60">
          <summary className="cursor-pointer font-bold text-cyan-300/70">
            Full order details (verification)
          </summary>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-900/50">
            {rows.map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col gap-0.5 border-b border-white/10 px-4 py-2.5 last:border-0"
              >
                <span className="font-bold text-cyan-300/50">{key}</span>
                <span className="text-white/80 break-all">
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
      </div>
    </div>
  );
}
