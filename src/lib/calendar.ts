import { partyDateTime } from "./date";

const DEFAULT_DURATION_HOURS = 2;

function toCalendarStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours()
  )}${pad(date.getMinutes())}00`;
}

export function buildGoogleCalendarUrl(params: {
  childName: string;
  partyDate: string;
  partyTime: string | null;
  partyVenue: string | null;
}): string {
  const start = partyDateTime(params.partyDate, params.partyTime);
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", `${params.childName}'s Birthday Party`);
  url.searchParams.set("dates", `${toCalendarStamp(start)}/${toCalendarStamp(end)}`);
  url.searchParams.set("details", `You're invited to ${params.childName}'s birthday party!`);
  if (params.partyVenue) url.searchParams.set("location", params.partyVenue);
  url.searchParams.set("ctz", "Asia/Kuala_Lumpur");
  return url.toString();
}

export function buildIcsContent(params: {
  childName: string;
  partyDate: string;
  partyTime: string | null;
  partyVenue: string | null;
}): string {
  const start = partyDateTime(params.partyDate, params.partyTime);
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  const stamp = toCalendarStamp(new Date());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KidKad//Birthday Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${stamp}-${Math.random().toString(36).slice(2)}@kidkad`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toCalendarStamp(start)}`,
    `DTEND:${toCalendarStamp(end)}`,
    `SUMMARY:${params.childName}'s Birthday Party`,
    params.partyVenue ? `LOCATION:${params.partyVenue}` : "",
    `DESCRIPTION:You're invited to ${params.childName}'s birthday party!`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
