import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Rsvp } from "@/lib/types";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ admin_link: string }>;
}) {
  const { admin_link } = await params;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, child_name")
    .eq("admin_link", admin_link)
    .maybeSingle();

  if (!order) notFound();

  const { data: rsvps } = await supabaseAdmin
    .from("rsvps")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  return <DashboardClient childName={order.child_name} rsvps={(rsvps ?? []) as Rsvp[]} />;
}
