import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isPastDeadline } from "@/lib/date";
import type { Order, Rsvp } from "@/lib/types";
import DashboardClient from "./DashboardClient";
import EditInvitationSection from "./EditInvitationSection";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ admin_link: string }>;
}) {
  const { admin_link } = await params;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("admin_link", admin_link)
    .maybeSingle();

  if (!order) notFound();

  const { data: rsvps } = await supabaseAdmin
    .from("rsvps")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  // isPastDeadline is a generic "has this date fully passed" check — reused
  // here for the party date itself rather than the RSVP deadline.
  const isPastParty = isPastDeadline(order.party_date);

  return (
    <DashboardClient childName={order.child_name} rsvps={(rsvps ?? []) as Rsvp[]}>
      <EditInvitationSection
        adminLink={admin_link}
        order={order as Order}
        isPastParty={isPastParty}
      />
    </DashboardClient>
  );
}
