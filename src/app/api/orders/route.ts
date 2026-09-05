import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateOrderToken, generateGuestLink, generateAdminLink } from "@/lib/tokens";
import type { Character, DialogueTone } from "@/lib/types";

interface CreateOrderBody {
  character?: Character;
  dialogueTone?: DialogueTone;
  childName?: string;
  childAge?: number;
  childPhotoUrl?: string;
  personalMessage?: string;
  parentName?: string;
  parentEmail?: string;
  partyDate?: string;
  partyTime?: string;
  partyVenue?: string;
  dressCode?: string;
  rsvpDeadline?: string;
  rsvpPhoneContact?: string;
}

const REQUIRED_FIELDS: (keyof CreateOrderBody)[] = [
  "character",
  "dialogueTone",
  "childName",
  "childAge",
  "childPhotoUrl",
  "personalMessage",
  "parentName",
  "parentEmail",
  "partyDate",
  "partyTime",
  "partyVenue",
  "dressCode",
  "rsvpDeadline",
  "rsvpPhoneContact",
];

// Token collisions are astronomically unlikely (crypto-random, 20-26 chars),
// but they're used as the primary lookup keys for the whole app, so a
// couple of retries on a unique-constraint violation costs nothing.
const MAX_INSERT_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateOrderBody;

  const missing = REQUIRED_FIELDS.filter((key) => {
    const value = body[key];
    return value === undefined || value === null || value === "";
  });
  if (missing.length > 0) {
    return NextResponse.json({ error: "Missing required fields", missing }, { status: 400 });
  }

  for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_token: generateOrderToken(),
        guest_link: generateGuestLink(),
        admin_link: generateAdminLink(),
        template: "space",
        payment_status: "draft",
        character: body.character,
        dialogue_tone: body.dialogueTone,
        child_name: body.childName,
        child_age: body.childAge,
        child_photo_url: body.childPhotoUrl,
        personal_message: body.personalMessage,
        parent_name: body.parentName,
        parent_email: body.parentEmail,
        party_date: body.partyDate,
        party_time: body.partyTime,
        party_venue: body.partyVenue,
        dress_code: body.dressCode,
        rsvp_deadline: body.rsvpDeadline,
        rsvp_phone_contact: body.rsvpPhoneContact,
      })
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ order: data });
    }
    if (error.code !== "23505" || attempt === MAX_INSERT_ATTEMPTS - 1) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
}
