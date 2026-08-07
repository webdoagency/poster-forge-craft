import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as repo from "./repo";
import { DEFAULT_BRAND } from "./constants";
import { makeT, type Translator } from "./i18n";
import { globalTemplates } from "./templates";
import { supabase } from "@/integrations/supabase/client";
import type {
  BrandProfile,
  Business,
  BusinessService,
  BusinessType,
  LanguageCode,
  Post,
  Template,
  TrialUsage,
  User,
} from "./types";

/**
 * Session and single business context backed by Supabase.
 * One account owns exactly one business, so there is no business switcher.
 * Access is enforced by row level security, this layer only mirrors it.
 */

type OnboardingInput = {
  type: BusinessType;
  customType?: string | null;
  name: string;
  logoDataUrl: string | null;
  primary: string;
  secondary: string;
  fontFamily: string;
  currency: BrandProfile["currency"];
  language: LanguageCode;
  services: string[];
  customTemplate: { fileName: string; fileType: string; previewDataUrl: string | null } | null;
};

type Result = { ok: boolean; error?: string };

type Ctx = {
  ready: boolean;
  user: User | null;
  isAdmin: boolean;
  business: Business | null;
  brand: BrandProfile | null;
  services: BusinessService[];
  posts: Post[];
  templates: Template[];
  trial: TrialUsage | null;
  language: LanguageCode;
  t: Translator;
  setLanguage: (lang: LanguageCode) => void;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<Result>;
  signOut: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  saveBrand: (patch: Partial<BrandProfile>) => Promise<void>;
  renameBusiness: (name: string) => Promise<void>;
  addService: (name: string) => Promise<void>;
  renameService: (serviceId: string, name: string) => Promise<void>;
  removeService: (serviceId: string) => Promise<void>;
  createPost: (post: Post) => Promise<Post | null>;
  removePost: (postId: string) => Promise<void>;
  canCreatePost: boolean;
  refresh: () => void;
};

const RaftyContext = createContext<Ctx | null>(null);

export function RaftyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [trial, setTrial] = useState<TrialUsage | null>(null);
  const [guestLanguage, setGuestLanguage] = useState<LanguageCode>("en");
  const loading = useRef(false);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    loading.current = true;

    (async () => {
      const u = await repo.currentUser();
      if (cancelled) return;
      setUser(u);

      if (!u) {
        setBusiness(null);
        setBrand(null);
        setServices([]);
        setPosts([]);
        setTemplates(globalTemplates);
        setTrial(null);
        setReady(true);
        return;
      }

      const b = await repo.myBusiness();
      if (cancelled) return;
      setBusiness(b);

      if (!b) {
        setBrand(null);
        setServices([]);
        setPosts([]);
        setTemplates(globalTemplates);
        setTrial(null);
        setReady(true);
        return;
      }

      const [nextBrand, nextServices, nextPosts, nextTemplates, nextTrial] = await Promise.all([
        repo.getBrand(b.id),
        repo.listServices(b.id),
        repo.listPosts(b.id),
        repo.templatesForBusiness(b.id, b.type),
        repo.getTrial(b.id),
      ]);
      if (cancelled) return;
      setBrand(nextBrand);
      setServices(nextServices);
      setPosts(nextPosts);
      setTemplates(nextTemplates);
      setTrial(nextTrial);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await repo.signIn(email, password);
      if (res.ok) refresh();
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    [refresh],
  );

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const res = await repo.signUp(input);
      if (res.ok) refresh();
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    [refresh],
  );

  const signOutFn = useCallback(async () => {
    await repo.signOut();
    refresh();
  }, [refresh]);

  const completeOnboarding = useCallback(
    async (input: OnboardingInput) => {
      if (!user) return;
      const existing = await repo.myBusiness();
      const businessId =
        existing?.id ??
        (await repo.createMyBusiness({
          name: input.name,
          type: input.type,
          customType: input.customType ?? null,
        }));
      if (!businessId) return;

      await repo.updateBusiness(businessId, {
        name: input.name,
        type: input.type,
        customType: input.customType ?? null,
        onboarded: true,
      });
      await repo.saveBrand(businessId, {
        logoDataUrl: input.logoDataUrl,
        primary: input.primary,
        secondary: input.secondary,
        fontFamily: input.fontFamily,
        currency: input.currency,
        language: input.language,
      });
      const current = await repo.listServices(businessId);
      await Promise.all(current.map((s) => repo.removeService(s.id)));
      for (const name of input.services) await repo.addService(businessId, name);
      if (input.customTemplate) {
        await repo.createRequest({
          businessId,
          fileName: input.customTemplate.fileName,
          fileType: input.customTemplate.fileType,
          previewDataUrl: input.customTemplate.previewDataUrl,
        });
      }
      refresh();
    },
    [user, refresh],
  );

  const saveBrandFn = useCallback(
    async (patch: Partial<BrandProfile>) => {
      if (!business) return;
      await repo.saveBrand(business.id, patch);
      refresh();
    },
    [business, refresh],
  );

  const renameBusiness = useCallback(
    async (name: string) => {
      if (!business) return;
      await repo.updateBusiness(business.id, { name });
      refresh();
    },
    [business, refresh],
  );

  const addServiceFn = useCallback(
    async (name: string) => {
      if (!business) return;
      await repo.addService(business.id, name);
      refresh();
    },
    [business, refresh],
  );

  const renameServiceFn = useCallback(
    async (serviceId: string, name: string) => {
      await repo.renameService(serviceId, name);
      refresh();
    },
    [refresh],
  );

  const removeServiceFn = useCallback(
    async (serviceId: string) => {
      await repo.removeService(serviceId);
      refresh();
    },
    [refresh],
  );

  const createPost = useCallback(
    async (post: Post) => {
      if (!business || post.businessId !== business.id) return null;
      const saved = await repo.savePost(post);
      refresh();
      return saved;
    },
    [business, refresh],
  );

  const removePost = useCallback(
    async (postId: string) => {
      if (!business) return;
      await repo.deletePost(postId);
      refresh();
    },
    [business, refresh],
  );

  const language = brand?.language ?? guestLanguage;

  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      setGuestLanguage(lang);
      if (business) void saveBrandFn({ language: lang });
    },
    [business, saveBrandFn],
  );

  const canCreatePost = useMemo(() => {
    if (!business) return false;
    if (business.status === "approved") return true;
    if (business.status === "rejected" || business.status === "suspended") return false;
    const used = trial?.postsCreated ?? 0;
    return used < (trial?.freePostLimit ?? 1);
  }, [business, trial]);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      user,
      isAdmin: user?.role === "admin",
      business,
      brand,
      services,
      posts,
      templates,
      trial,
      language,
      t: makeT(language),
      setLanguage,
      signIn,
      signUp,
      signOut: signOutFn,
      completeOnboarding,
      saveBrand: saveBrandFn,
      renameBusiness,
      addService: addServiceFn,
      renameService: renameServiceFn,
      removeService: removeServiceFn,
      createPost,
      removePost,
      canCreatePost,
      refresh,
    }),
    [
      ready,
      user,
      business,
      brand,
      services,
      posts,
      templates,
      trial,
      language,
      setLanguage,
      signIn,
      signUp,
      signOutFn,
      completeOnboarding,
      saveBrandFn,
      renameBusiness,
      addServiceFn,
      renameServiceFn,
      removeServiceFn,
      createPost,
      removePost,
      canCreatePost,
      refresh,
    ],
  );

  return <RaftyContext.Provider value={value}>{children}</RaftyContext.Provider>;
}

export function useRafty() {
  const ctx = useContext(RaftyContext);
  if (!ctx) throw new Error("useRafty must be used inside RaftyProvider");
  return ctx;
}

/** Neutral brand used only for isolated previews such as the landing page. */
export const previewBrand: BrandProfile = {
  businessId: "preview",
  logoDataUrl: null,
  primary: DEFAULT_BRAND.primary,
  secondary: DEFAULT_BRAND.secondary,
  fontFamily: DEFAULT_BRAND.fontFamily,
  currency: DEFAULT_BRAND.currency,
  language: "en",
};
