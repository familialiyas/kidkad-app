import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const orderId = String(form.get("order_id") ?? "");
  const status = String(form.get("status") ?? "");
  const refno = String(form.get("refno") ?? "");
  const hash = String(form.get("hash") ?? "");

  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  if (!secretKey || !orderId || !status || !refno || !hash) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const expectedHash = createHash("md5")
    .update(`${secretKey}${status}${orderId}${refno}ok`)
    .digest("hex");

  if (expectedHash !== hash) {
    return new NextResponse("Invalid hash", { status: 400 });
  }

  // status: 1 = success, 2 = pending, 3 = fail. Pending gets no write —
  // the order stays "draft" until toyyibPay calls back again with a
  // final status.
  let paymentStatus: "paid" | "failed" | null = null;
  if (status === "1") paymentStatus = "paid";
  else if (status === "3") paymentStatus = "failed";

  if (paymentStatus) {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("order_token", orderId);
    if (error) {
      // Still acknowledge receipt below — returning non-200 would just make
      // toyyibPay retry forever against the same broken write.
      console.error("[KidKad] Failed to update payment_status from callback:", error.message);
    }
  }

  return new NextResponse("OK", { status: 200 });
}
