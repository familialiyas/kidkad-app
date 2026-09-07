/** Parses a free-text time like "3:00 PM" into 24h { hours, minutes }. Falls back to noon. */
export function parsePartyTime(partyTime: string | null): { hours: number; minutes: number } {
  if (!partyTime) return { hours: 12, minutes: 0 };
  const match = partyTime.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return { hours: 12, minutes: 0 };
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

/** Converts a native <input type="time"> 24h value ("15:00") into the
 * friendly "H:MM AM/PM" string ("3:00 PM") this app stores/displays
 * party_time as everywhere else (coin dialogue text, return-visit screen). */
export function formatTimeForStorage(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Combines an ISO date ("2026-09-18") and a free-text time into a local Date. */
export function partyDateTime(partyDate: string, partyTime: string | null): Date {
  const [year, month, day] = partyDate.split("-").map(Number);
  const { hours, minutes } = parsePartyTime(partyTime);
  return new Date(year, month - 1, day, hours, minutes);
}

export function isPastDeadline(rsvpDeadline: string | null): boolean {
  if (!rsvpDeadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = rsvpDeadline.split("-").map(Number);
  const deadline = new Date(year, month - 1, day);
  deadline.setHours(23, 59, 59, 999);
  return today.getTime() > deadline.getTime();
}

export function formatFriendlyDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** A shorter, spoken-aloud date for conversational dialogue text — no year, e.g. "Friday, September 18th". */
export function formatConversationalDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday}, ${monthName} ${ordinal(day)}`;
}
