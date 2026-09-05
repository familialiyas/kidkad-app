import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateOrderToken(): string {
  return `order_${randomBytes(8).toString("hex")}`;
}

export function generateGuestLink(): string {
  return `guest_${randomString(20)}`;
}

export function generateAdminLink(): string {
  return `admin_${randomString(26)}`;
}
