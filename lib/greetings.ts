export interface Greeting {
  text: string;
  attribution?: string;
}

// Rotating greetings. Weighted: Sonnet 116 appears 7x (its lines carry the
// rotation — it is their sonnet), other quotes and personal lines 1x each.
// 30 slots total; Shakespeare holds 21 of them.
export const GREETINGS: Greeting[] = [
  // Sonnet 116 — 7 distinct lines, weighted
  { text: "Let me not to the marriage of true minds admit impediments.", attribution: "Sonnet 116" },
  { text: "Love is not love which alters when it alteration finds.", attribution: "Sonnet 116" },
  { text: "O no! it is an ever-fixed mark that looks on tempests and is never shaken.", attribution: "Sonnet 116" },
  { text: "It is the star to every wandering bark, whose worth's unknown, although his height be taken.", attribution: "Sonnet 116" },
  { text: "Love's not Time's fool, though rosy lips and cheeks within his bending sickle's compass come.", attribution: "Sonnet 116" },
  { text: "Love alters not with his brief hours and weeks, but bears it out even to the edge of doom.", attribution: "Sonnet 116" },
  { text: "If this be error and upon me prov'd, I never writ, nor no man ever lov'd.", attribution: "Sonnet 116" },

  // Other Shakespeare — 1x each
  { text: "Journeys end in lovers meeting.", attribution: "Twelfth Night" },
  { text: "My bounty is as boundless as the sea, my love as deep.", attribution: "Romeo and Juliet" },
  { text: "Hear my soul speak: The very instant that I saw you, did my heart fly to your service.", attribution: "The Tempest" },
  { text: "Love looks not with the eyes, but with the mind.", attribution: "A Midsummer Night's Dream" },
  { text: "The course of true love never did run smooth.", attribution: "A Midsummer Night's Dream" },
  { text: "I do love nothing in the world so well as you—is not that strange?", attribution: "Much Ado About Nothing" },
  { text: "I love you with so much of my heart that none is left to protest.", attribution: "Much Ado About Nothing" },
  { text: "One half of me is yours, the other half yours.", attribution: "The Merchant of Venice" },
  { text: "For where thou art, there is the world itself.", attribution: "Henry VI, Part 2" },
  { text: "But, soft! what light through yonder window breaks?", attribution: "Romeo and Juliet" },
  { text: "Who ever loved that loved not at first sight?", attribution: "As You Like It" },
  { text: "I would not wish any companion in the world but you.", attribution: "The Tempest" },
  { text: "But never doubt I love.", attribution: "Hamlet" },
  { text: "She loved me for the dangers I had passed, and I loved her that she did pity them.", attribution: "Othello" },

  // Other voices — 1x each
  { text: "Whatever our souls are made of, his and mine are the same.", attribution: "Emily Brontë" },
  { text: "Grow old with me! The best is yet to be.", attribution: "Robert Browning" },
  { text: "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.", attribution: "Maya Angelou" },
  { text: "If I know what love is, it is because of you.", attribution: "Hermann Hesse" },

  // Personal — 1x each
  { text: "The morning is better with you in it." },
  { text: "This site is yours. It was always going to be." },
  { text: "Whatever you make here, I'm glad you made it." },
  { text: "You belong here." },
  { text: "The light in the window is for you." },
];

export function pickGreeting(userId: number, date = new Date()): Greeting {
  const dayKey = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return GREETINGS[(userId + dayKey) % GREETINGS.length];
}

export function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
