import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { PublicOrder } from "@/lib/types";
import GameClient from "./GameClient";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ guest_link: string }>;
}) {
  const { guest_link } = await params;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "guest_link, template, character, child_name, child_age, child_photo_url, personal_message, party_date, party_time, party_venue, maps_link, dress_code, rsvp_deadline, rsvp_phone_contact"
    )
    .eq("guest_link", guest_link)
    .maybeSingle();

  if (!order) notFound();

  return <GameClient order={order as PublicOrder} />;
}
