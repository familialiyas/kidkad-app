import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isPastDeadline } from "@/lib/date";

// Everything editable post-creation, per the host's own request — notably
// excludes parent_name/parent_email (account-identity fields) and anything
// system-managed (tokens/links/payment_status/maps_link/timestamps).
const EDITABLE_FIELDS = [
  "child_name",
  "child_age",
  "character",
  "dialogue_tone",
  "template",
  "child_photo_url",
  "personal_message",
  "party_date",
  "party_time",
  "party_venue",
  "dress_code",
  "rsvp_deadline",
  "rsvp_phone_contact",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ admin_link: string }> }
) {
  const { admin_link } = await params;
  const body = await req.json();

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("party_date")
    .eq("admin_link", admin_link)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // isPastDeadline is a generic "has this date fully passed" check — reused
  // here for the party date itself rather than the RSVP deadline.
  if (isPastDeadline(existing.party_date)) {
    return NextResponse.json({ error: "This party has already happened" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update(updates)
    .eq("admin_link", admin_link)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
