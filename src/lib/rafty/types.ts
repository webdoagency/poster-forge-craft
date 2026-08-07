/**
 * Rafty Content data model.
 * Every business owned record carries businessId (tenant id) so the local
 * repository can be swapped for Supabase tables without UI changes.
 */

export type BusinessType =
  | "travel_agency"
  | "real_estate"
  | "car_dealership"
  | "restaurant"
  | "retail";

export type LanguageCode = "en" | "de" | "sq";

export type CurrencyCode = "EUR" | "CHF" | "GBP" | "USD" | "ALL" | "SEK" | "NOK" | "DKK";

export type BusinessStatus = "pending" | "approved" | "rejected" | "suspended";

export type UserRole = "owner" | "admin";

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

export type BrandProfile = {
  businessId: string;
  logoDataUrl: string | null;
  primary: string;
  secondary: string;
  fontFamily: string;
  currency: CurrencyCode;
  language: LanguageCode;
};

export type BusinessService = {
  id: string;
  businessId: string;
  name: string;
};

export type TemplateScope = "global" | "custom";

export type Template = {
  id: string;
  name: string;
  businessType: BusinessType;
  engine: string;
  variant: TemplateVariant;
  scope: TemplateScope;
  businessId: string | null;
  archived: boolean;
};

export type TemplateVariant = {
  align: "left" | "center";
  tone: "light" | "dark";
  badge: "pill" | "square";
  accent?: "primary" | "secondary";
};

export type BusinessTemplateAssignment = {
  id: string;
  templateId: string;
  businessType: BusinessType | null;
  businessId: string | null;
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

/** Post text/media content. Field relevance is decided by business type. */
export type PostContent = {
  title: string;
  subject: string;
  location: string;
  price: string;
  date: string;
  meta1: string;
  meta2: string;
  additionalText: string;
  services: string[];
  imageDataUrl: string | null;
  caption: string;
};

export type Post = {
  id: string;
  businessId: string;
  templateId: string;
  content: PostContent;
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
  services: [],
  imageDataUrl: null,
  caption: "",
};
