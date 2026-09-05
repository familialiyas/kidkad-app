import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isPastDeadline } from "@/lib/date";

const PARENT_NOTIFICATION_EMAIL = "parent-placeholder@kidkad.app";

async function getOrderByGuestLink(guestLink: string) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, child_name, rsvp_deadline")
    .eq("guest_link", guestLink)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(req: NextRequest) {
  const guestLink = req.nextUrl.searchParams.get("guestLink");
  const guestPhone = req.nextUrl.searchParams.get("guestPhone");
  if (!guestLink || !guestPhone) {
    return NextResponse.json({ error: "Missing guestLink or guestPhone" }, { status: 400 });
  }

  const order = await getOrderByGuestLink(guestLink);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const { data: rsvp, error } = await supabaseAdmin
    .from("rsvps")
    .select("*")
    .eq("order_id", order.id)
    .eq("guest_phone", guestPhone)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rsvp });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { guestLink, guestName, guestPhone, paxCount } = body as {
    guestLink?: string;
    guestName?: string;
    guestPhone?: string;
    paxCount?: number;
  };

  if (!guestLink || !guestName || !guestPhone || !paxCount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const order = await getOrderByGuestLink(guestLink);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (isPastDeadline(order.rsvp_deadline)) {
    return NextResponse.json({ error: "RSVP deadline has passed" }, { status: 403 });
  }

  const { data: rsvp, error } = await supabaseAdmin
    .from("rsvps")
    .upsert(
      {
        order_id: order.id,
        guest_name: guestName,
        guest_phone: guestPhone,
        pax_count: paxCount,
      },
      { onConflict: "order_id,guest_phone" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  console.log("[KidKad] RSVP notification email (placeholder, Resend not yet wired up):", {
    to: PARENT_NOTIFICATION_EMAIL,
    subject: `New RSVP for ${order.child_name}'s party`,
    guestName,
    guestPhone,
    paxCount,
  });

  return NextResponse.json({ rsvp });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { guestLink, guestPhone } = body as { guestLink?: string; guestPhone?: string };
  if (!guestLink || !guestPhone) {
    return NextResponse.json({ error: "Missing guestLink or guestPhone" }, { status: 400 });
  }

  const order = await getOrderByGuestLink(guestLink);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (isPastDeadline(order.rsvp_deadline)) {
    return NextResponse.json({ error: "RSVP deadline has passed" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("rsvps")
    .delete()
    .eq("order_id", order.id)
    .eq("guest_phone", guestPhone);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
