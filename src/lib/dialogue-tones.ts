export type DialogueTone = "excited" | "sweet" | "silly";

export const TONE_LABELS: Record<DialogueTone, string> = {
  excited: "Excited & Bubbly",
  sweet: "Sweet & Gentle",
  silly: "Silly & Funny",
};

export const DIALOGUE_TONES = {
  excited: {
    opening: "Hi hi! I'm {name} and I'm turning {age}! Help me collect all my mission coins!",
    dateTime: "Mark your calendars — my mission happens on {date} at {time}!",
    location: "The mission takes place at {venue} — see you there!",
    dressCode: "Oh and wear {dresscode} — gotta look the part!",
    missionComplete:
      "Woohoo, you did it! Mission complete — can't wait to see you at my party!",
  },
  sweet: {
    opening:
      "Hello, I'm {name}, and I'm turning {age} soon. Would you help me find my coins?",
    dateTime: "My special day is on {date}, starting at {time}.",
    location: "It will take place at {venue}.",
    dressCode: "It would mean a lot if you wore {dresscode}.",
    missionComplete: "Thank you so much for helping me. I really hope to see you there.",
  },
  silly: {
    opening:
      "Psst, it's me, {name}! I'm turning {age}, which is basically ancient in kid years! Help me grab my coins, quick quick!",
    dateTime: "Circle this on your calendar with a giant marker: {date} at {time}!",
    location: "The party HQ is located at {venue}. Don't get lost, I need you there!",
    dressCode: "Wear {dresscode} or the space cats will be very confused.",
    missionComplete:
      "BOOM! Mission complete! You're basically a superhero now, see you at the party!",
  },
} as const;

/** Fills {token} placeholders in a dialogue template string, e.g. fillTemplate(t, {name: "Alex"}). */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

// Kid-voiced on purpose, including "silly" — this is attributed directly to
// the child (e.g. "{name} says...") at mission-complete in the guest game,
// so even the joke register has to stay inside a genuine kid's sense of
// humor (mock-mild threats, silliness) rather than adult sarcasm about
// topics a 3-8 year-old wouldn't actually reference (supervision, dance
// floors as a wry aside, etc).
export const PERSONAL_MESSAGE_SAMPLES = {
  excited: [
    "I can't wait to see you at my party, it's going to be SO fun!!",
    "There's going to be games, cake, and YOU! Please come!",
    "I've been counting the days until my party — see you there!",
  ],
  sweet: [
    "It would make me so happy if you could come to my party.",
    "I hope you can come celebrate with me, it means a lot.",
    "You're one of my favorite people, I really hope you can make it!",
  ],
  silly: [
    "Warning: there will be lots of cake and even more giggles!",
    "Come to my party or I'll be sad (just kidding, but please come)!",
    "There will be balloons, snacks, and probably some silly dancing!",
  ],
} as const;
