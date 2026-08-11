import { formatPrice } from "./constants";
import type { BusinessType, ContentInstructions, CurrencyCode, PostContent } from "./types";

/**
 * Caption writer. Text only, never layout.
 * Deterministic local generator so output is reproducible and the brand's own
 * content instructions stay authoritative for tone and wording.
 */

const OPENERS: Record<BusinessType, string[]> = {
  travel_agency: ["Pack light, stay longer.", "This one books out fast.", "Your next trip, sorted."],
  real_estate: ["Just listed.", "Room to breathe.", "A place worth seeing in person."],
  car_dealership: ["Ready to drive today.", "Just arrived on the lot.", "Keys are waiting."],
  restaurant: ["On the menu now.", "Fresh out of the kitchen.", "Tonight tastes good."],
  retail: ["New in stock.", "Small drop, big favourite.", "Back by request."],
  other: ["Something new from us.", "Now available.", "Worth a closer look."],
};

const DEFAULT_CLOSERS: Record<BusinessType, string> = {
  travel_agency: "Send us a message to reserve.",
  real_estate: "Message us to book a viewing.",
  car_dealership: "Message us for a test drive.",
  restaurant: "Reserve your table today.",
  retail: "Message us to order.",
  other: "Message us to learn more.",
};

const MAX_LENGTH = 2200;

function toneHint(tone: string): string | null {
  const value = tone.trim().toLowerCase();
  if (!value) return null;
  if (value.includes("playful") || value.includes("fun")) return "!";
  if (value.includes("formal") || value.includes("professional")) return ".";
  return null;
}

/** Removes any sentence that contains a phrase the brand asked to avoid. */
function filterAvoided(text: string, avoid: string): string {
  const banned = avoid
    .split(/[,\n]/)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (!banned.length) return text;
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !banned.some((word) => sentence.toLowerCase().includes(word)))
    .join(" ");
}

function pickPhrase(phrasesUse: string, seed: number): string | null {
  const options = phrasesUse
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (!options.length) return null;
  return options[seed % options.length]!;
}

function buildHashtags(input: {
  hashtags: string;
  subject: string;
  businessName: string;
}): string[] {
  const custom = input.hashtags
    .split(/[\s,]+/)
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => (v.startsWith("#") ? v : `#${v}`));
  if (custom.length) return custom.slice(0, 12);
  const fallback = [input.subject, input.businessName]
    .map((v) => v.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .map((v) => `#${v}`);
  return [...fallback, "#rafty"];
}

export function generateCaption(input: {
  content: PostContent;
  businessType: BusinessType;
  businessName: string;
  currency: CurrencyCode;
  instructions: ContentInstructions;
  services?: string[];
  seed?: number;
}): string {
  const { content, businessType, businessName, currency, instructions } = input;
  const seed = input.seed ?? 0;
  const punctuation = toneHint(instructions.tone) ?? ".";

  const title = content.title.trim() || "New offer";
  const openers = OPENERS[businessType];
  const opener = openers[(title.length + seed) % openers.length]!;
  const parts: string[] = [opener];

  const subject = content.subject.trim();
  parts.push(subject ? `${title} in ${subject}${punctuation}` : `${title}${punctuation}`);

  const price = formatPrice(content.price, currency);
  if (price) parts.push(`From ${price}.`);

  [content.meta1, content.meta2, content.location, content.date]
    .map((v) => v.trim())
    .filter(Boolean)
    .forEach((v) => parts.push(`${v}.`));

  const services = input.services?.length ? input.services : content.services;
  if (services.length) parts.push(`Includes: ${services.join(", ")}.`);

  if (content.additionalText.trim()) {
    parts.push(content.additionalText.trim().replace(/\.$/, "") + ".");
  }

  const usedPhrase = pickPhrase(instructions.phrasesUse, seed);
  if (usedPhrase) parts.push(usedPhrase.replace(/\.$/, "") + ".");

  const cta = content.cta.trim() || instructions.ctaStyle.trim() || DEFAULT_CLOSERS[businessType];
  parts.push(cta.replace(/\.$/, "") + ".");

  if (instructions.contact.trim()) parts.push(instructions.contact.trim());

  let body = filterAvoided(parts.join(" "), instructions.phrasesAvoid).replace(/\s{2,}/g, " ").trim();

  const tags = buildHashtags({
    hashtags: instructions.hashtags,
    subject,
    businessName,
  });

  let caption = [body, tags.join(" ")].filter(Boolean).join("\n\n");
  if (caption.length > MAX_LENGTH) {
    body = body.slice(0, MAX_LENGTH - tags.join(" ").length - 4).trim() + "...";
    caption = [body, tags.join(" ")].filter(Boolean).join("\n\n");
  }
  return caption;
}
