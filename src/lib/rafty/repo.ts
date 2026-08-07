import { DEFAULT_BRAND, SERVICE_SUGGESTIONS } from "./constants";
import { globalTemplates } from "./templates";
import type {
  BrandProfile,
  Business,
  BusinessMembership,
  BusinessService,
  BusinessStatus,
  BusinessType,
  CustomTemplateRequest,
  Post,
  Template,
  TrialUsage,
  User,
} from "./types";

/**
 * Local repository boundary.
 * Every function here maps one to one onto a Supabase table query, so the
 * backend can replace this module without touching the UI.
 * Tenant rule: nothing is ever read across businessId boundaries.
 */

const K = {
  users: "rafty:v11:users",
  businesses: "rafty:v11:businesses",
  memberships: "rafty:v11:memberships",
  brands: "rafty:v11:brands",
  services: "rafty:v11:services",
  posts: "rafty:v11:posts",
  templates: "rafty:v11:custom_templates",
  requests: "rafty:v11:template_requests",
  trials: "rafty:v11:trials",
  session: "rafty:v11:session",
  seeded: "rafty:v11:seeded",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota, ignore */
  }
}

export const id = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

type StoredUser = User & { password: string };

/* ---------------------------------- seed --------------------------------- */

export function seed() {
  if (typeof window === "undefined") return;
  if (read<boolean>(K.seeded, false)) return;

  const admin: StoredUser = {
    id: "u_admin",
    email: "admin@raftycontent.app",
    name: "Rafty Admin",
    role: "admin",
    password: "admin",
    createdAt: new Date().toISOString(),
  };

  // Example client records for the admin area. These belong to their own
  // businesses and are never used as defaults for a real user account.
  const clients: { name: string; type: BusinessType; status: BusinessStatus }[] = [
    { name: "Adriatic Voyages", type: "travel_agency", status: "approved" },
    { name: "Nordhaus Immobilien", type: "real_estate", status: "pending" },
    { name: "Prima Motors", type: "car_dealership", status: "approved" },
  ];

  const businesses: Business[] = [];
  const brands: BrandProfile[] = [];
  const services: BusinessService[] = [];
  const trials: TrialUsage[] = [];

  clients.forEach((c, i) => {
    const bid = `b_seed_${i + 1}`;
    businesses.push({
      id: bid,
      name: c.name,
      type: c.type,
      status: c.status,
      ownerUserId: `u_seed_${i + 1}`,
      onboarded: true,
      createdAt: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
    });
    brands.push({
      businessId: bid,
      logoDataUrl: null,
      primary: DEFAULT_BRAND.primary,
      secondary: DEFAULT_BRAND.secondary,
      fontFamily: DEFAULT_BRAND.fontFamily,
      currency: DEFAULT_BRAND.currency,
      language: DEFAULT_BRAND.language,
    });
    SERVICE_SUGGESTIONS[c.type].slice(0, 4).forEach((name) =>
      services.push({ id: id("svc"), businessId: bid, name }),
    );
    trials.push({ businessId: bid, postsCreated: 0, freePostLimit: 1 });
  });

  write(K.users, [admin]);
  write(K.businesses, businesses);
  write(K.brands, brands);
  write(K.services, services);
  write(K.trials, trials);
  write(K.memberships, []);
  write(K.posts, []);
  write(K.templates, []);
  write(K.requests, []);
  write(K.seeded, true);
}

/* ---------------------------------- auth --------------------------------- */

export function listUsers(): User[] {
  return read<StoredUser[]>(K.users, []).map(({ password: _p, ...u }) => u);
}

export function signUp(input: { name: string; email: string; password: string }):
  | { ok: true; user: User }
  | { ok: false; error: string } {
  const users = read<StoredUser[]>(K.users, []);
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) return { ok: false, error: "Email already in use." };
  const user: StoredUser = {
    id: id("u"),
    email,
    name: input.name.trim() || email.split("@")[0]!,
    role: "owner",
    password: input.password,
    createdAt: new Date().toISOString(),
  };
  write(K.users, [...users, user]);
  write(K.session, user.id);
  const { password: _p, ...safe } = user;
  return { ok: true, user: safe };
}

export function signIn(email: string, password: string):
  | { ok: true; user: User }
  | { ok: false; error: string } {
  const users = read<StoredUser[]>(K.users, []);
  const found = users.find((u) => u.email === email.trim().toLowerCase());
  if (!found || found.password !== password) return { ok: false, error: "Wrong email or password." };
  write(K.session, found.id);
  const { password: _p, ...safe } = found;
  return { ok: true, user: safe };
}

export function signOut() {
  write(K.session, null);
}

export function currentUser(): User | null {
  const uid = read<string | null>(K.session, null);
  if (!uid) return null;
  return listUsers().find((u) => u.id === uid) ?? null;
}

/* -------------------------------- business ------------------------------- */

export function listBusinesses(): Business[] {
  return read<Business[]>(K.businesses, []);
}

export function businessForUser(userId: string): Business | null {
  const own = listBusinesses().find((b) => b.ownerUserId === userId);
  if (own) return own;
  const membership = read<BusinessMembership[]>(K.memberships, []).find((m) => m.userId === userId);
  if (!membership) return null;
  return listBusinesses().find((b) => b.id === membership.businessId) ?? null;
}

export function createBusiness(input: {
  name: string;
  type: BusinessType;
  ownerUserId: string;
  status?: BusinessStatus;
  onboarded?: boolean;
}): Business {
  const business: Business = {
    id: id("b"),
    name: input.name.trim(),
    type: input.type,
    status: input.status ?? "pending",
    ownerUserId: input.ownerUserId,
    onboarded: input.onboarded ?? false,
    createdAt: new Date().toISOString(),
  };
  write(K.businesses, [...listBusinesses(), business]);
  write(K.memberships, [
    ...read<BusinessMembership[]>(K.memberships, []),
    { id: id("mem"), businessId: business.id, userId: input.ownerUserId, role: "owner" as const },
  ]);
  write(K.brands, [
    ...read<BrandProfile[]>(K.brands, []),
    {
      businessId: business.id,
      logoDataUrl: null,
      primary: DEFAULT_BRAND.primary,
      secondary: DEFAULT_BRAND.secondary,
      fontFamily: DEFAULT_BRAND.fontFamily,
      currency: DEFAULT_BRAND.currency,
      language: DEFAULT_BRAND.language,
    },
  ]);
  write(K.trials, [
    ...read<TrialUsage[]>(K.trials, []),
    { businessId: business.id, postsCreated: 0, freePostLimit: 1 },
  ]);
  return business;
}

export function updateBusiness(businessId: string, patch: Partial<Business>) {
  write(
    K.businesses,
    listBusinesses().map((b) => (b.id === businessId ? { ...b, ...patch, id: b.id } : b)),
  );
}

/* --------------------------------- brand --------------------------------- */

export function getBrand(businessId: string): BrandProfile | null {
  return read<BrandProfile[]>(K.brands, []).find((b) => b.businessId === businessId) ?? null;
}

export function saveBrand(businessId: string, patch: Partial<BrandProfile>) {
  const all = read<BrandProfile[]>(K.brands, []);
  const exists = all.some((b) => b.businessId === businessId);
  const next = exists
    ? all.map((b) => (b.businessId === businessId ? { ...b, ...patch, businessId } : b))
    : [
        ...all,
        {
          businessId,
          logoDataUrl: null,
          primary: DEFAULT_BRAND.primary,
          secondary: DEFAULT_BRAND.secondary,
          fontFamily: DEFAULT_BRAND.fontFamily,
          currency: DEFAULT_BRAND.currency,
          language: DEFAULT_BRAND.language,
          ...patch,
        } as BrandProfile,
      ];
  write(K.brands, next);
}

/* -------------------------------- services ------------------------------- */

export function listServices(businessId: string): BusinessService[] {
  return read<BusinessService[]>(K.services, []).filter((s) => s.businessId === businessId);
}

export function addService(businessId: string, name: string): BusinessService | null {
  const value = name.trim();
  if (!value) return null;
  const all = read<BusinessService[]>(K.services, []);
  if (all.some((s) => s.businessId === businessId && s.name.toLowerCase() === value.toLowerCase()))
    return null;
  const svc: BusinessService = { id: id("svc"), businessId, name: value };
  write(K.services, [...all, svc]);
  return svc;
}

export function renameService(serviceId: string, name: string) {
  write(
    K.services,
    read<BusinessService[]>(K.services, []).map((s) =>
      s.id === serviceId ? { ...s, name: name.trim() || s.name } : s,
    ),
  );
}

export function removeService(serviceId: string) {
  write(
    K.services,
    read<BusinessService[]>(K.services, []).filter((s) => s.id !== serviceId),
  );
}

/* -------------------------------- templates ------------------------------ */

export function listCustomTemplates(businessId: string): Template[] {
  return read<Template[]>(K.templates, []).filter(
    (t) => t.scope === "custom" && t.businessId === businessId && !t.archived,
  );
}

export function listAllCustomTemplates(): Template[] {
  return read<Template[]>(K.templates, []);
}

export function saveCustomTemplate(template: Template) {
  const all = read<Template[]>(K.templates, []);
  write(K.templates, [...all.filter((t) => t.id !== template.id), template]);
}

export function archiveTemplate(templateId: string) {
  write(
    K.templates,
    read<Template[]>(K.templates, []).map((t) =>
      t.id === templateId ? { ...t, archived: true } : t,
    ),
  );
}

/** Global library plus templates owned by this business only. */
export function templatesForBusiness(businessId: string, type: BusinessType): Template[] {
  return [
    ...listCustomTemplates(businessId),
    ...globalTemplates.filter((t) => t.businessType === type),
    ...globalTemplates.filter((t) => t.businessType !== type),
  ];
}

/* --------------------------- custom template flow ------------------------ */

export function listRequests(businessId?: string): CustomTemplateRequest[] {
  const all = read<CustomTemplateRequest[]>(K.requests, []);
  return businessId ? all.filter((r) => r.businessId === businessId) : all;
}

export function createRequest(input: Omit<CustomTemplateRequest, "id" | "createdAt">) {
  const request: CustomTemplateRequest = {
    ...input,
    id: id("req"),
    createdAt: new Date().toISOString(),
  };
  write(K.requests, [...listRequests(), request]);
  return request;
}

export function updateRequest(requestId: string, patch: Partial<CustomTemplateRequest>) {
  write(
    K.requests,
    listRequests().map((r) => (r.id === requestId ? { ...r, ...patch, id: r.id } : r)),
  );
}

/* ---------------------------------- posts -------------------------------- */

export function listPosts(businessId: string): Post[] {
  return read<Post[]>(K.posts, [])
    .filter((p) => p.businessId === businessId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllPosts(): Post[] {
  return read<Post[]>(K.posts, []);
}

export function savePost(post: Post) {
  const all = read<Post[]>(K.posts, []);
  write(K.posts, [post, ...all.filter((p) => p.id !== post.id)]);
}

export function deletePost(postId: string, businessId: string) {
  write(
    K.posts,
    read<Post[]>(K.posts, []).filter((p) => !(p.id === postId && p.businessId === businessId)),
  );
}

/* ---------------------------------- trial -------------------------------- */

export function getTrial(businessId: string): TrialUsage {
  return (
    read<TrialUsage[]>(K.trials, []).find((t) => t.businessId === businessId) ?? {
      businessId,
      postsCreated: 0,
      freePostLimit: 1,
    }
  );
}

export function bumpTrial(businessId: string) {
  const all = read<TrialUsage[]>(K.trials, []);
  const current = getTrial(businessId);
  const next = { ...current, postsCreated: current.postsCreated + 1 };
  write(K.trials, [...all.filter((t) => t.businessId !== businessId), next]);
  return next;
}
