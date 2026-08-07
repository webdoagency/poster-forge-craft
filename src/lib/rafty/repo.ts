import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BRAND } from "./constants";
import { globalTemplates } from "./templates";
import {
  emptyContent,
  type BrandProfile,
  type Business,
  type BusinessService,
  type BusinessStatus,
  type BusinessType,
  type CurrencyCode,
  type CustomTemplateRequest,
  type LanguageCode,
  type Post,
  type PostContent,
  type Template,
  type TemplateVariant,
  type TrialUsage,
  type User,
} from "./types";

/**
 * Supabase data access boundary.
 * Authorization lives in the database (RLS plus security definer functions).
 * Nothing here ever passes a browser supplied business id as proof of access:
 * the server resolves ownership from the signed in user.
 */

const BUCKET = "rafty-media";

export const id = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

/* --------------------------------- storage -------------------------------- */

const signedCache = new Map<string, { url: string; expires: number }>();

/** Private bucket access. Files are only reachable through short lived signed urls. */
export async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const hit = signedCache.get(path);
  if (hit && hit.expires > Date.now()) return hit.url;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (!data?.signedUrl) return null;
  signedCache.set(path, { url: data.signedUrl, expires: Date.now() + 3000 * 1000 });
  return data.signedUrl;
}

async function uploadDataUrl(
  businessId: string,
  kind: "logos" | "posts" | "requests",
  dataUrl: string,
): Promise<string | null> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = (blob.type.split("/")[1] ?? "png").replace("+xml", "");
  const path = `${businessId}/${kind}/${id(kind)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) return null;
  return path;
}

async function removeFile(path: string | null) {
  if (!path) return;
  signedCache.delete(path);
  await supabase.storage.from(BUCKET).remove([path]);
}

const isDataUrl = (value: string | null): value is string => !!value?.startsWith("data:");

/* ---------------------------------- auth ---------------------------------- */

export async function currentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;
  if (!authUser) return null;
  const { data: isAdmin } = await supabase.rpc("is_super_admin");
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", authUser.id)
    .maybeSingle();
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: profile?.display_name || (authUser.email ?? "").split("@")[0] || "Account",
    role: isAdmin ? "admin" : "owner",
    createdAt: authUser.created_at ?? new Date().toISOString(),
  };
}

export async function signUp(input: { name: string; email: string; password: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      ...(typeof window === "undefined" ? {} : { emailRedirectTo: window.location.origin }),
      data: { display_name: input.name.trim() },
    },
  });
  if (error) return { ok: false as const, error: error.message };
  if (!data.session) {
    return { ok: false as const, error: "Check your email to confirm your account, then sign in." };
  }
  if (input.name.trim()) {
    await supabase
      .from("profiles")
      .update({ display_name: input.name.trim() })
      .eq("id", data.user!.id);
  }
  return { ok: true as const };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function signOut() {
  await supabase.auth.signOut();
  signedCache.clear();
}

/* -------------------------------- business -------------------------------- */

type BusinessRow = {
  id: string;
  name: string;
  type: BusinessType;
  custom_type: string | null;
  status: BusinessStatus;
  owner_id: string;
  onboarded: boolean;
  created_at: string;
};

const toBusiness = (row: BusinessRow): Business => ({
  id: row.id,
  name: row.name,
  type: row.type,
  customType: row.custom_type,
  status: row.status,
  ownerUserId: row.owner_id,
  onboarded: row.onboarded,
  createdAt: row.created_at,
});

/** Resolves the caller's business through membership, never through a client id. */
export async function myBusiness(): Promise<Business | null> {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return data ? toBusiness(data as BusinessRow) : null;
}

export async function createMyBusiness(input: {
  name: string;
  type: BusinessType;
  customType?: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase.rpc("create_my_business", {
    _name: input.name,
    _type: input.type,
    ...(input.customType ? { _custom_type: input.customType } : {}),
  });
  if (error) return null;
  return data as string;
}

export async function updateBusiness(businessId: string, patch: Partial<Business>) {
  const row: Record<string, any> = {};
  if (patch.name !== undefined) row["name"] = patch.name;
  if (patch.type !== undefined) row["type"] = patch.type;
  if (patch.customType !== undefined) row["custom_type"] = patch.customType;
  if (patch.onboarded !== undefined) row["onboarded"] = patch.onboarded;
  if (patch.status !== undefined) row["status"] = patch.status;
  if (Object.keys(row).length === 0) return;
  await supabase.from("businesses").update(row as never).eq("id", businessId);
}

/* ---------------------------------- brand --------------------------------- */

type BrandRow = {
  business_id: string;
  logo_path: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  currency: string;
  language: string;
};

export async function getBrand(businessId: string): Promise<BrandProfile | null> {
  const { data } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (!data) return null;
  const row = data as BrandRow;
  return {
    businessId: row.business_id,
    logoPath: row.logo_path,
    logoDataUrl: await signedUrl(row.logo_path),
    primary: row.primary_color,
    secondary: row.secondary_color,
    fontFamily: row.font_family,
    currency: row.currency as CurrencyCode,
    language: row.language as LanguageCode,
  };
}

export async function saveBrand(businessId: string, patch: Partial<BrandProfile>) {
  const row: Record<string, any> = {};
  if (patch.primary !== undefined) row["primary_color"] = patch.primary;
  if (patch.secondary !== undefined) row["secondary_color"] = patch.secondary;
  if (patch.fontFamily !== undefined) row["font_family"] = patch.fontFamily;
  if (patch.currency !== undefined) row["currency"] = patch.currency;
  if (patch.language !== undefined) row["language"] = patch.language;

  if (patch.logoDataUrl !== undefined) {
    const current = await supabase
      .from("brand_profiles")
      .select("logo_path")
      .eq("business_id", businessId)
      .maybeSingle();
    const oldPath = (current.data as { logo_path: string | null } | null)?.logo_path ?? null;
    if (patch.logoDataUrl === null) {
      await removeFile(oldPath);
      row["logo_path"] = null;
    } else if (isDataUrl(patch.logoDataUrl)) {
      const path = await uploadDataUrl(businessId, "logos", patch.logoDataUrl);
      if (path) {
        await removeFile(oldPath);
        row["logo_path"] = path;
      }
    }
  }

  if (Object.keys(row).length === 0) return;
  await supabase
    .from("brand_profiles")
    .upsert({ business_id: businessId, ...row } as never, { onConflict: "business_id" });
}

/* -------------------------------- services -------------------------------- */

export async function listServices(businessId: string): Promise<BusinessService[]> {
  const { data } = await supabase
    .from("business_services")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at");
  return (data ?? []).map((s) => ({
    id: s.id as string,
    businessId: s.business_id as string,
    name: s.name as string,
  }));
}

export async function addService(businessId: string, name: string) {
  const value = name.trim();
  if (!value) return;
  await supabase.from("business_services").insert({ business_id: businessId, name: value });
}

export async function renameService(serviceId: string, name: string) {
  const value = name.trim();
  if (!value) return;
  await supabase.from("business_services").update({ name: value }).eq("id", serviceId);
}

export async function removeService(serviceId: string) {
  await supabase.from("business_services").delete().eq("id", serviceId);
}

/* -------------------------------- templates ------------------------------- */

type CustomTemplateRow = {
  id: string;
  business_id: string;
  name: string;
  engine: string;
  variant: TemplateVariant;
  archived: boolean;
};

const toTemplate = (row: CustomTemplateRow, type: BusinessType): Template => ({
  id: row.id,
  name: row.name,
  businessType: type,
  engine: row.engine,
  variant: row.variant,
  scope: "custom",
  businessId: row.business_id,
  archived: row.archived,
});

export async function listCustomTemplates(
  businessId: string,
  type: BusinessType,
): Promise<Template[]> {
  const { data } = await supabase
    .from("custom_templates")
    .select("*")
    .eq("business_id", businessId)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => toTemplate(row as unknown as CustomTemplateRow, type));
}

export async function saveCustomTemplate(input: {
  businessId: string;
  name: string;
  engine: string;
  variant: TemplateVariant;
}): Promise<string | null> {
  const { data } = await supabase
    .from("custom_templates")
    .insert({
      business_id: input.businessId,
      name: input.name,
      engine: input.engine,
      variant: input.variant,
    })
    .select("id")
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function archiveTemplate(templateId: string) {
  await supabase.from("custom_templates").update({ archived: true }).eq("id", templateId);
}

/** Global library plus templates owned by this business only. */
export async function templatesForBusiness(
  businessId: string,
  type: BusinessType,
): Promise<Template[]> {
  const custom = await listCustomTemplates(businessId, type);
  return [
    ...custom,
    ...globalTemplates.filter((t) => t.businessType === type),
    ...globalTemplates.filter((t) => t.businessType !== type),
  ];
}

/* --------------------------- custom template flow ------------------------- */

type RequestRow = {
  id: string;
  business_id: string;
  file_name: string;
  file_type: string | null;
  file_path: string | null;
  status: CustomTemplateRequest["status"];
  template_id: string | null;
  created_at: string;
  businesses?: { name: string } | null;
};

async function toRequest(row: RequestRow): Promise<CustomTemplateRequest> {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? "",
    fileName: row.file_name,
    fileType: row.file_type ?? "",
    previewDataUrl: await signedUrl(row.file_path),
    status: row.status,
    templateId: row.template_id,
    createdAt: row.created_at,
  };
}

export async function listRequests(businessId?: string): Promise<CustomTemplateRequest[]> {
  let query = supabase
    .from("custom_template_requests")
    .select("*, businesses(name)")
    .order("created_at", { ascending: false });
  if (businessId) query = query.eq("business_id", businessId);
  const { data } = await query;
  return Promise.all((data ?? []).map((row) => toRequest(row as RequestRow)));
}

export async function createRequest(input: {
  businessId: string;
  fileName: string;
  fileType: string;
  previewDataUrl: string | null;
}): Promise<string | null> {
  const path = isDataUrl(input.previewDataUrl)
    ? await uploadDataUrl(input.businessId, "requests", input.previewDataUrl)
    : null;
  const { data } = await supabase
    .from("custom_template_requests")
    .insert({
      business_id: input.businessId,
      file_name: input.fileName,
      file_type: input.fileType,
      file_path: path,
    })
    .select("id")
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function updateRequest(
  requestId: string,
  patch: { status?: CustomTemplateRequest["status"]; templateId?: string | null },
) {
  const row: Record<string, any> = {};
  if (patch.status !== undefined) row["status"] = patch.status;
  if (patch.templateId !== undefined) row["template_id"] = patch.templateId;
  if (Object.keys(row).length === 0) return;
  await supabase.from("custom_template_requests").update(row as never).eq("id", requestId);
}

/* ---------------------------------- posts --------------------------------- */

type PostRow = {
  id: string;
  business_id: string;
  template_id: string;
  content: Partial<PostContent>;
  image_path: string | null;
  created_at: string;
  businesses?: { name: string } | null;
};

async function toPost(row: PostRow): Promise<Post> {
  return {
    id: row.id,
    businessId: row.business_id,
    templateId: row.template_id,
    imagePath: row.image_path,
    content: {
      ...emptyContent,
      ...row.content,
      imageDataUrl: await signedUrl(row.image_path),
    },
    createdAt: row.created_at,
  };
}

export async function listPosts(businessId: string): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return Promise.all((data ?? []).map((row) => toPost(row as PostRow)));
}

export async function savePost(post: Post): Promise<Post | null> {
  const { imageDataUrl, ...text } = post.content;
  let imagePath = post.imagePath ?? null;
  if (isDataUrl(imageDataUrl)) {
    const uploaded = await uploadDataUrl(post.businessId, "posts", imageDataUrl);
    if (uploaded) {
      if (imagePath) await removeFile(imagePath);
      imagePath = uploaded;
    }
  }
  const payload = {
    business_id: post.businessId,
    template_id: post.templateId,
    content: text,
    image_path: imagePath,
  };
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    post.id ?? "",
  );
  const existing = isUuid
    ? await supabase.from("posts").select("id").eq("id", post.id).maybeSingle()
    : { data: null };
  const query = existing.data
    ? supabase.from("posts").update(payload).eq("id", post.id).select("*").maybeSingle()
    : supabase.from("posts").insert(payload).select("*").maybeSingle();
  const { data } = await query;
  if (!data) return null;
  const saved = await toPost(data as PostRow);
  if (!existing.data) await supabase.rpc("register_post_usage", { _business_id: post.businessId });
  return saved;
}

export async function deletePost(postId: string) {
  const { data } = await supabase
    .from("posts")
    .select("image_path")
    .eq("id", postId)
    .maybeSingle();
  await removeFile((data as { image_path: string | null } | null)?.image_path ?? null);
  await supabase.from("posts").delete().eq("id", postId);
}

/* ---------------------------------- trial --------------------------------- */

export async function getTrial(businessId: string): Promise<TrialUsage> {
  const { data } = await supabase
    .from("trial_usage")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return {
    businessId,
    postsCreated: (data?.posts_created as number) ?? 0,
    freePostLimit: (data?.free_post_limit as number) ?? 1,
  };
}

/* ---------------------------------- admin --------------------------------- */
/** These reads only return rows for platform admins, enforced by RLS. */

export async function adminListBusinesses(): Promise<Business[]> {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => toBusiness(row as BusinessRow));
}

export async function adminListTrials(): Promise<TrialUsage[]> {
  const { data } = await supabase.from("trial_usage").select("*");
  return (data ?? []).map((t) => ({
    businessId: t.business_id as string,
    postsCreated: (t.posts_created as number) ?? 0,
    freePostLimit: (t.free_post_limit as number) ?? 1,
  }));
}

export async function adminListPosts(): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return Promise.all((data ?? []).map((row) => toPost(row as PostRow)));
}

export async function adminListCustomTemplates(): Promise<
  { id: string; businessId: string; name: string; archived: boolean }[]
> {
  const { data } = await supabase
    .from("custom_templates")
    .select("id, business_id, name, archived")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id as string,
    businessId: row.business_id as string,
    name: row.name as string,
    archived: row.archived as boolean,
  }));
}

export async function adminSetStatus(businessId: string, status: BusinessStatus) {
  await supabase.from("businesses").update({ status }).eq("id", businessId);
}

export const DEFAULTS = DEFAULT_BRAND;
