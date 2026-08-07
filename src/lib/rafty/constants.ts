import type { BusinessType, CurrencyCode, LanguageCode } from "./types";

export const BUSINESS_TYPES: BusinessType[] = [
  "travel_agency",
  "real_estate",
  "car_dealership",
  "restaurant",
  "retail",
];

/** Canonical English names used in the data model. */
export const BUSINESS_TYPE_NAMES: Record<BusinessType, string> = {
  travel_agency: "Travel Agency",
  real_estate: "Real Estate",
  car_dealership: "Car Dealership",
  restaurant: "Restaurant",
  retail: "Retail",
};

export const FONTS = [
  "Inter",
  "DM Sans",
  "Manrope",
  "Plus Jakarta Sans",
  "Sora",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Lora",
  "Space Grotesk",
] as const;

export const CURRENCIES: CurrencyCode[] = ["EUR", "CHF", "GBP", "USD", "ALL", "SEK", "NOK", "DKK"];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EUR: "€",
  CHF: "CHF",
  GBP: "£",
  USD: "$",
  ALL: "L",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
};

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "sq", label: "Shqip" },
];

/** Price rendering always follows the business currency. */
export function formatPrice(value: string, currency: CurrencyCode): string {
  const raw = value.trim();
  if (!raw) return "";
  const symbol = CURRENCY_SYMBOLS[currency];
  const numeric = raw.replace(/[^\d.,]/g, "");
  if (!numeric) return raw;
  const prefix = raw.toLowerCase().startsWith("from") ? "" : "";
  const before = currency === "EUR" || currency === "GBP" || currency === "USD";
  return prefix + (before ? `${symbol}${numeric}` : `${numeric} ${symbol}`);
}

export type FieldKey = "title" | "subject" | "location" | "price" | "date" | "meta1" | "meta2";

/** Per business type field schema. Same creation architecture, typed fields. */
export const TYPE_FIELDS: Record<BusinessType, { key: FieldKey; labelKey: string }[]> = {
  travel_agency: [
    { key: "title", labelKey: "field.offer" },
    { key: "subject", labelKey: "field.destination" },
    { key: "location", labelKey: "field.hotel" },
    { key: "price", labelKey: "field.price" },
    { key: "date", labelKey: "field.date" },
    { key: "meta1", labelKey: "field.nights" },
  ],
  real_estate: [
    { key: "title", labelKey: "field.property" },
    { key: "subject", labelKey: "field.location" },
    { key: "price", labelKey: "field.price" },
    { key: "meta1", labelKey: "field.rooms" },
    { key: "meta2", labelKey: "field.area" },
    { key: "date", labelKey: "field.available" },
  ],
  car_dealership: [
    { key: "title", labelKey: "field.vehicle" },
    { key: "subject", labelKey: "field.model" },
    { key: "price", labelKey: "field.price" },
    { key: "meta1", labelKey: "field.year" },
    { key: "meta2", labelKey: "field.mileage" },
    { key: "date", labelKey: "field.financing" },
  ],
  restaurant: [
    { key: "title", labelKey: "field.dish" },
    { key: "subject", labelKey: "field.menu" },
    { key: "price", labelKey: "field.price" },
    { key: "location", labelKey: "field.location" },
    { key: "date", labelKey: "field.when" },
  ],
  retail: [
    { key: "title", labelKey: "field.product" },
    { key: "subject", labelKey: "field.category" },
    { key: "price", labelKey: "field.price" },
    { key: "meta1", labelKey: "field.offer" },
    { key: "date", labelKey: "field.validUntil" },
  ],
};

/** Editable suggestions only. Businesses own their final service list. */
export const SERVICE_SUGGESTIONS: Record<BusinessType, string[]> = {
  travel_agency: [
    "Accommodation",
    "Breakfast",
    "Half board",
    "Transfers",
    "Pool",
    "Beach",
    "Spa",
    "Guided tours",
  ],
  real_estate: [
    "Parking",
    "Balcony",
    "Elevator",
    "Garden",
    "Furnished",
    "New build",
    "Sea view",
    "Storage",
  ],
  car_dealership: [
    "Warranty",
    "Financing",
    "Trade in",
    "Service history",
    "Automatic",
    "Navigation",
    "Leather seats",
    "Winter tires",
  ],
  restaurant: [
    "Dine in",
    "Takeaway",
    "Delivery",
    "Vegetarian",
    "Vegan",
    "Gluten free",
    "Terrace",
    "Reservations",
  ],
  retail: [
    "Free shipping",
    "In store pickup",
    "Returns 30 days",
    "Warranty",
    "Gift wrapping",
    "Limited stock",
    "New arrival",
    "Members price",
  ],
};

export const DEFAULT_BRAND = {
  primary: "#6d4dff",
  secondary: "#b06cf5",
  fontFamily: "Sora",
  currency: "EUR" as CurrencyCode,
  language: "en" as LanguageCode,
};
