import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
    <div className="font-body min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-gray-900">Draft order created</h1>
        <p className="mt-1 text-sm text-gray-500">
          This confirms the draft row in Supabase. Payment/preview comes next.
        </p>

        <div className="mt-4 rounded-xl border-2 border-gray-900 bg-white p-4">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Order token</p>
          <p className="mt-1 font-mono text-lg font-bold text-gray-900 break-all">
            {order.order_token}
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {rows.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5 border-b border-gray-100 px-4 py-3 last:border-0">
              <span className="text-xs font-bold text-gray-400">{key}</span>
              <span className="text-sm break-all text-gray-900">
                {value === null || value === "" ? (
                  <span className="text-red-600">— empty —</span>
                ) : (
                  String(value)
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
