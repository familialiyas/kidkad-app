import type { Character } from "./types";
import type { DialogueTone } from "./dialogue-tones";
import type { ThemeName } from "./theme-config";
import type { EventDetailsFields } from "@/app/create/EventDetailsStep";
import type { ParentDetailsFields } from "@/app/create/ParentDetailsStep";

const STORAGE_KEY = "kidkad_create_draft";

export interface CreateDraft {
  step: string;
  childName: string;
  childAge: string;
  /** Absent (undefined) on any draft saved before the theme step existed —
   * CreateOrderClient's restore logic treats that as "resume from the theme
   * step" rather than trusting a `character` selection that predates theme
   * ever being asked. */
  theme?: ThemeName | null;
  character: Character | null;
  tone: DialogueTone | null;
  childPhotoUrl: string;
  event: EventDetailsFields;
  parent: ParentDetailsFields;
}

export function getCreateDraft(): CreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CreateDraft) : null;
  } catch {
    return null;
  }
}

export function setCreateDraft(draft: CreateDraft) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // localStorage unavailable — draft just won't persist across visits
  }
}

export function clearCreateDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
