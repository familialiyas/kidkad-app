export type DialogueTone = "excited" | "sweet" | "silly";

export const TONE_LABELS: Record<DialogueTone, string> = {
  excited: "Excited & Bubbly",
  sweet: "Sweet & Gentle",
  silly: "Silly & Funny",
};

export const DIALOGUE_TONES = {
  excited: {
    opening:
      "Hi hi! I'm {name} and I'm turning {age} this time! I am SO excited, come help me collect all my mission coins so you can come to my party!",
    dateTime:
      "My party is happening on {date} at {time} — I cannot wait, mark your calendar right now!",
    location: "We're partying at {venue}! It's going to be SO much fun, get ready!",
    dressCode: "Oh and guess what, everyone's coming dressed {dresscode}! How cool is that?!",
    missionComplete:
      "YOU DID IT! You found every single coin! Here's your reward, come celebrate with me at my party!",
  },
  sweet: {
    opening:
      "Hello, I'm {name}, and I'm turning {age} soon. I'd love for you to join me, will you help me find my mission coins?",
    dateTime: "My special day is {date}, starting at {time}. I do hope you can make it.",
    location: "We'll be celebrating at {venue}. I can't wait to see you there.",
    dressCode: "It would make me so happy if you came dressed {dresscode}.",
    missionComplete:
      "Thank you so much for finding all my coins. Here is my gift to you, an invitation to my birthday.",
  },
  silly: {
    opening:
      "Heyyy, it's me, {name}! I'm turning {age}, which basically makes me a wizard now. Help me grab my coins so you can come to my party, please and thank you!",
    dateTime:
      "Party alert! It's happening {date} at {time}. Set a bunch of alarms if you have to, just don't be late!",
    location: "The party zone is at {venue}. Bring snacks, that part isn't a joke.",
    dressCode: "Dress code is {dresscode}, no excuses, even the cat has an outfit ready.",
    missionComplete:
      "WHOA. You actually found them all. I'm shook. Here's your reward, human, my birthday invitation!",
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
