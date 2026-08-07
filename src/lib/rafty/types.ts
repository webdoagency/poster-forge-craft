export type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export type Brand = {
  businessName: string;
  logoDataUrl: string | null;
  primary: string;
  secondary: string;
  fontFamily: string;
  services: string[];
};

export type PostFields = {
  title: string;
  destination: string;
  business: string;
  price: string;
  date: string;
  additionalText: string;
  services: string[];
  imageDataUrl: string | null;
  caption: string;
};

export type Post = {
  id: string;
  tenantId: string;
  templateId: string;
  fields: PostFields;
  createdAt: string;
};

export const emptyFields: PostFields = {
  title: "",
  destination: "",
  business: "",
  price: "",
  date: "",
  additionalText: "",
  services: [],
  imageDataUrl: null,
  caption: "",
};
