export type PaymentStatus = "draft" | "paid" | "failed";
export type Character = "boy" | "girl";

export interface Order {
  id: string;
  order_token: string;
  guest_link: string;
  admin_link: string;
  template: string | null;
  character: Character | null;
  payment_status: PaymentStatus;
  child_name: string | null;
  child_age: number | null;
  child_photo_url: string | null;
  personal_message: string | null;
  party_date: string | null;
  party_time: string | null;
  party_venue: string | null;
  maps_link: string | null;
  dress_code: string | null;
  rsvp_deadline: string | null;
  rsvp_phone_contact: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Rsvp {
  id: string;
  order_id: string;
  guest_name: string;
  guest_phone: string;
  pax_count: number;
  created_at: string;
  updated_at: string;
}

/** Fields of an Order that are safe to send to the guest-facing client. */
export type PublicOrder = Pick<
  Order,
  | "guest_link"
  | "template"
  | "character"
  | "child_name"
  | "child_age"
  | "child_photo_url"
  | "personal_message"
  | "party_date"
  | "party_time"
  | "party_venue"
  | "maps_link"
  | "dress_code"
  | "rsvp_deadline"
  | "rsvp_phone_contact"
>;
