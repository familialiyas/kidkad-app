interface StoredRsvp {
  guestPhone: string;
  guestName: string;
  paxCount: number;
}

function key(guestLink: string): string {
  return `kidkad_rsvp_${guestLink}`;
}

export function getStoredRsvp(guestLink: string): StoredRsvp | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(guestLink));
    return raw ? (JSON.parse(raw) as StoredRsvp) : null;
  } catch {
    return null;
  }
}

export function setStoredRsvp(guestLink: string, value: StoredRsvp) {
  try {
    window.localStorage.setItem(key(guestLink), JSON.stringify(value));
  } catch {
    // localStorage unavailable — return-visit detection just won't persist
  }
}

export function clearStoredRsvp(guestLink: string) {
  try {
    window.localStorage.removeItem(key(guestLink));
  } catch {
    // ignore
  }
}
