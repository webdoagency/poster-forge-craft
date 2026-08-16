/**
 * Rafty data model.
 * Every business owned record carries businessId (tenant id). Authorization is
 * enforced in Supabase with row level security, this layer only mirrors it.
 */

/**
 * Quick start types. They only decide which fields are suggested, never which
 * templates are available. Any other business uses "other" plus a custom type
 * label, so salons, gyms, clinics, hotels, trades, events and local shops all
 * fit without a separate product.
 */
export type BusinessType =
  | "travel_agency"
  | "real_estate"
  | "car_dealership"
  | "restaurant"
  | "retail"
  | "other";


export type LanguageCode = "en" | "de" | "sq";

export type CurrencyCode = "EUR" | "CHF" | "GBP" | "USD" | "ALL" | "SEK" | "NOK" | "DKK";

export type BusinessStatus = "pending" | "approved" | "rejected" | "suspended";

export type UserRole = "owner" | "admin";

export type PlanTier = "starter" | "growth" | "partnership";

export type AccountPlan = {
  userId: string;
  plan: PlanTier;
  brandLimit: number;
  billingCycle: string;
  partnershipPostsUsed: number;
  partnershipPostsLimit: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

export type Business = {
  id: string;
  name: string;
  type: BusinessType;
  customType: string | null;
  status: BusinessStatus;
  ownerUserId: string;
  onboarded: boolean;
  createdAt: string;
};

export type BusinessMembership = {
  id: string;
  businessId: string;
  userId: string;
  role: "owner" | "member";
};

/** Caption guidance owned by the brand and reused on every post. */
export type ContentInstructions = {
  tone: string;
  phrasesUse: string;
  phrasesAvoid: string;
  ctaStyle: string;
  contact: string;
  hashtags: string;
};

export const emptyInstructions: ContentInstructions = {
  tone: "",
  phrasesUse: "",
  phrasesAvoid: "",
  ctaStyle: "",
  contact: "",
  hashtags: "",
};

/** Reusable brand contact details. Brand scoped, shown only when the user opts in. */
export type BrandContact = {
  phones: string[];
  email: string;
  website: string;
  address: string;
  social: string;
};

export const emptyContact: BrandContact = {
  phones: [],
  email: "",
  website: "",
  address: "",
  social: "",
};

export type BrandProfile = {
  businessId: string;
  /** Private storage object path. Never a public url. */
  logoPath?: string | null;
  /** Short lived signed url used for rendering only. */
  logoDataUrl: string | null;
  /** Once a logo is saved only a Rafty admin can replace it. */
  logoLocked: boolean;
  primary: string;
  secondary: string;
  accent: string;
  background: string | null;
  fontFamily: string;
  fontSecondary: string | null;
  showBrandName: boolean;
  instructions: ContentInstructions;
  contact: BrandContact;
  currency: CurrencyCode;
  language: LanguageCode;
};


export type BusinessService = {
  id: string;
  businessId: string;
  name: string;
  position: number;
};

export type TemplateScope = "global" | "custom";

/** Visual families. The library is not locked to an industry. */
export type TemplateTag =
  | "editorial"
  | "minimal"
  | "bold"
  | "luxury"
  | "whitespace"
  | "dense"
  | "image_first"
  | "type_first"
  | "gradient"
  | "dark"
  | "light"
  | "glass"
  | "blur"
  | "asymmetric"
  | "centered"
  | "split"
  | "offer";

export type TemplateVariant = {
  align: "left" | "center" | "right";
  tone: "light" | "dark";
  badge: "pill" | "square";
  accent?: "primary" | "secondary" | "accent";
};

/** A mapped dynamic content area on an uploaded design. Percentages of canvas. */
export type TemplateZone = {
  key: ZoneKey;
  x: number;
  y: number;
  width: number;
  size: number;
  align: "left" | "center" | "right";
  color: string;
  weight: "regular" | "bold" | "extra";
  uppercase: boolean;
};

export type ZoneKey =
  | "title"
  | "subject"
  | "price"
  | "location"
  | "date"
  | "services"
  | "additionalText"
  | "cta"
  | "brandName"
  | "logo";

export type Template = {
  id: string;
  name: string;
  engine: string;
  tags: TemplateTag[];
  variant: TemplateVariant;
  scope: TemplateScope;
  businessId: string | null;
  archived: boolean;
  /** Custom templates only: locked uploaded design plus mapped zones. */
  backgroundPath?: string | null;
  backgroundUrl?: string | null;
  requirements?: string | null;
  zones?: TemplateZone[];
  lockedDesign?: boolean;
};

export type CustomTemplateRequestStatus = "processing" | "ready" | "rejected";

export type CustomTemplateRequest = {
  id: string;
  businessId: string;
  businessName: string;
  fileName: string;
  fileType: string;
  previewDataUrl: string | null;
  status: CustomTemplateRequestStatus;
  templateId: string | null;
  createdAt: string;
};

/** Post text/media content. Field relevance is suggested by business type. */
export type PostContent = {
  title: string;
  subject: string;
  location: string;
  price: string;
  date: string;
  meta1: string;
  meta2: string;
  additionalText: string;
  cta: string;
  services: string[];
  imageDataUrl: string | null;
  caption: string;
};

/** Safe content nudges. Values are clamped by the adjust controls. */
export type LayerAdjust = {
  x: number;
  y: number;
  scale: number;
  align: "left" | "center" | "right";
};

export type PostAdjustments = {
  text?: LayerAdjust;
  image?: { x: number; y: number; scale: number };
};

export type ShareStatus = {
  savedToDevice?: boolean;
  instagram?: "not_connected" | "ready" | "publishing" | "published" | "failed";
  facebook?: "not_connected" | "ready" | "publishing" | "published" | "failed";
};

export type Post = {
  id: string;
  businessId: string;
  templateId: string;
  imagePath?: string | null;
  content: PostContent;
  showBrandName: boolean;
  adjustments: PostAdjustments;
  shareStatus: ShareStatus;
  createdAt: string;
};

export type TrialUsage = {
  businessId: string;
  postsCreated: number;
  freePostLimit: number;
};

export const emptyContent: PostContent = {
  title: "",
  subject: "",
  location: "",
  price: "",
  date: "",
  meta1: "",
  meta2: "",
  additionalText: "",
  cta: "",
  services: [],
  imageDataUrl: null,
  caption: "",
};

export const defaultAdjust: LayerAdjust = { x: 0, y: 0, scale: 1, align: "left" };
