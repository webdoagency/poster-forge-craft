import { formatPrice } from "./constants";
import type { BusinessType, CurrencyCode, PostContent } from "./types";

/**
 * Caption writer. Text only, never layout.
 * Deterministic local generator so output is reproducible and templates stay
 * authoritative for the design.
 */

const OPENERS: Record<BusinessType, string[]> = {
  travel_agency: ["Pack light, stay longer.", "This one books out fast.", "Your next trip, sorted."],
  real_estate: ["Just listed.", "Room to breathe.", "A place worth seeing in person."],
  car_dealership: ["Ready to drive today.", "Just arrived on the lot.", "Keys are waiting."],
  restaurant: ["On the menu now.", "Fresh out of the kitchen.", "Tonight tastes good."],
  retail: ["New in stock.", "Small drop, big favourite.", "Back by request."],
  other: ["Something new from us.", "Now available.", "Worth a closer look."],
};

const CLOSERS: Record<BusinessType, string> = {
  travel_agency: "Send us a message to reserve.",
  real_estate: "Message us to book a viewing.",
  car_dealership: "Message us for a test drive.",
  restaurant: "Reserve your table today.",
  retail: "Message us to order.",
  other: "Message us to learn more.",
};

export function generateCaption(
  content: PostContent,
  businessType: BusinessType,
  businessName: string,
  currency: CurrencyCode,
  seed = 0,
): string {
  const title = content.title.trim() || "New offer";
  const openers = OPENERS[businessType];
  const opener = openers[(title.length + seed) % openers.length]!;
  const parts: string[] = [opener];

  const subject = content.subject.trim();
  parts.push(subject ? `${title} in ${subject}.` : `${title}.`);

  const price = formatPrice(content.price, currency);
  if (price) parts.push(`From ${price}.`);
  [content.meta1, content.meta2, content.location, content.date]
    .map((v) => v.trim())
    .filter(Boolean)
    .forEach((v) => parts.push(`${v}.`));
  if (content.services.length) parts.push(`Includes: ${content.services.join(", ")}.`);
  if (content.additionalText.trim())
    parts.push(content.additionalText.trim().replace(/\.$/, "") + ".");
  parts.push(CLOSERS[businessType]);

  const tags = [subject, businessName]
    .map((v) => v.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .map((v) => `#${v}`);

  return [parts.join(" "), [...tags, "#raftycontent"].join(" ")].filter(Boolean).join("\n\n");
}
