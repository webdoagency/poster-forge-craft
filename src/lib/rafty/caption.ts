import type { PostFields } from "./types";

/**
 * Caption generation. AI writes TEXT ONLY — it never touches layout.
 * Deterministic local generator standing in for a model call, so the
 * output is reproducible and the template system stays authoritative.
 */

const openers = [
  "Say yes to this one.",
  "Booked out fast last time.",
  "Your next favourite story starts here.",
  "Quietly the best deal we have right now.",
];

export function generateCaption(fields: PostFields, seed = 0): string {
  const title = fields.title.trim() || "New offer";
  const opener = openers[(title.length + seed) % openers.length]!;
  const parts: string[] = [opener];

  const where = fields.destination.trim();
  parts.push(where ? `${title} — ${where}.` : `${title}.`);

  if (fields.price.trim()) parts.push(`From ${fields.price.trim()}.`);
  if (fields.date.trim()) parts.push(`${fields.date.trim()}.`);
  if (fields.services.length) parts.push(`Included: ${fields.services.join(", ")}.`);
  if (fields.additionalText.trim()) parts.push(fields.additionalText.trim().replace(/\.$/, "") + ".");
  if (fields.business.trim()) parts.push(`DM ${fields.business.trim()} to reserve.`);

  const tags = [where, fields.business]
    .map((v) => v.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .map((v) => `#${v}`);

  return [parts.join(" "), tags.join(" ")].filter(Boolean).join("\n\n");
}
