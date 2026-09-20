import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const CREATE_BILL_URL = "https://toyyibpay.com/index.php/api/createBill";
// toyyibPay callbacks/returns can't reach localhost, so this is pinned to
// the deployed production URL rather than derived from the request host.
const SITE_URL = "https://kidkad.vercel.app";
const BILL_AMOUNT_CENTS = 1990; // RM19.90

// billName/billDescription are restricted to alphanumeric, space and
// underscore only by toyyibPay's API.
function sanitizeForBill(value: string, maxLength: number): string {
  return value
    .replace(/[^a-zA-Z0-9 _]/g, "")
    .trim()
    .slice(0, maxLength);
}

export async function POST(req: NextRequest) {
  const { order_token } = (await req.json()) as { order_token?: string };
  if (!order_token) {
    return NextResponse.json({ error: "Missing order_token" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("order_token, child_name, parent_name, parent_email, rsvp_phone_contact, payment_status")
    .eq("order_token", order_token)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "This order has already been paid for" }, { status: 400 });
  }

  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  if (!secretKey || !categoryCode) {
    return NextResponse.json({ error: "Payment is not configured" }, { status: 500 });
  }

  const billName = sanitizeForBill("KidKad Invitation", 30) || "KidKad Invitation";
  const billDescription =
    sanitizeForBill(`Digital birthday invitation for ${order.child_name ?? "your child"}`, 100) ||
    "Digital birthday invitation";

  const form = new URLSearchParams({
    userSecretKey: secretKey,
    categoryCode,
    billName,
    billDescription,
    billPriceSetting: "1",
    billAmount: String(BILL_AMOUNT_CENTS),
    billPayorInfo: "1",
    billTo: order.parent_name ?? "",
    billEmail: order.parent_email ?? "",
    billPhone: order.rsvp_phone_contact ?? "",
    billReturnUrl: `${SITE_URL}/create/success/${order.order_token}`,
    billCallbackUrl: `${SITE_URL}/api/toyyibpay-callback`,
    billExternalReferenceNo: order.order_token,
    billPaymentChannel: "2", // FPX + credit card
  });

  const billRes = await fetch(CREATE_BILL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const text = await billRes.text();

  // createBill returns HTTP 200 for both success and failure. A failure
  // shows up either as JSON ({"status":"error","msg":...}) or a plain
  // bracketed code (e.g. "[KEY-DID-NOT-EXIST]") — never as the expected
  // [{"BillCode":"..."}] array, so both non-array shapes and non-JSON text
  // are treated as errors below.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: `Payment provider error: ${text.trim() || "unknown error"}` },
      { status: 502 }
    );
  }

  const bill = Array.isArray(parsed) ? parsed[0] : undefined;
  const billCode =
    bill && typeof bill === "object" && "BillCode" in bill
      ? String((bill as { BillCode: unknown }).BillCode)
      : null;

  if (!billCode) {
    const message =
      parsed && typeof parsed === "object" && "msg" in parsed
        ? String((parsed as { msg?: unknown }).msg)
        : text.trim();
    return NextResponse.json({ error: `Payment provider error: ${message}` }, { status: 502 });
  }

  return NextResponse.json({ billCode });
}
