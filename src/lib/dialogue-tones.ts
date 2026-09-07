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

export const PERSONAL_MESSAGE_SAMPLES = {
  excited: [
    "Come celebrate with me, it's going to be the BEST day ever!",
    "I've been waiting for this all year, please come!",
    "Get ready for cake, games, and so much fun!",
  ],
  sweet: [
    "It would mean so much to me if you could come celebrate this day with us.",
    "I'm so grateful to have you in my life, please join me on my special day.",
    "Come make some sweet memories with me.",
  ],
  silly: [
    "Warning: cake will be consumed in dangerous quantities.",
    "There will be balloons, snacks, and zero adult supervision on the dance floor.",
    "Come for the cake, stay for my dance moves.",
  ],
} as const;
