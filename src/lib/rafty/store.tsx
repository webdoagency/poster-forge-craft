import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as repo from "./repo";
import { DEFAULT_BRAND } from "./constants";
import { makeT, type Translator } from "./i18n";
import { globalTemplates } from "./templates";
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
 * Session and single business context.
 * One account owns exactly one business, so there is no business switcher.
 * Nothing in here ever falls back to another business's data.
 */

type OnboardingInput = {
  type: BusinessType;
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

type Ctx = {
  ready: boolean;
  user: User | null;
  business: Business | null;
  brand: BrandProfile | null;
  services: BusinessService[];
  posts: Post[];
  templates: Template[];
  trial: TrialUsage | null;
  language: LanguageCode;
  t: Translator;
  setLanguage: (lang: LanguageCode) => void;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signUp: (input: { name: string; email: string; password: string }) => { ok: boolean; error?: string };
  signOut: () => void;
  completeOnboarding: (input: OnboardingInput) => void;
  saveBrand: (patch: Partial<BrandProfile>) => void;
  renameBusiness: (name: string) => void;
  addService: (name: string) => void;
  renameService: (serviceId: string, name: string) => void;
  removeService: (serviceId: string) => void;
  createPost: (post: Post) => void;
  removePost: (postId: string) => void;
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

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    repo.seed();
    const u = repo.currentUser();
    setUser(u);
    if (u) {
      const b = repo.businessForUser(u.id);
      setBusiness(b);
      if (b) {
        setBrand(repo.getBrand(b.id));
        setServices(repo.listServices(b.id));
        setPosts(repo.listPosts(b.id));
        setTemplates(repo.templatesForBusiness(b.id, b.type));
        setTrial(repo.getTrial(b.id));
      } else {
        setBrand(null);
        setServices([]);
        setPosts([]);
        setTemplates(globalTemplates);
        setTrial(null);
      }
    } else {
      setBusiness(null);
      setBrand(null);
      setServices([]);
      setPosts([]);
      setTemplates(globalTemplates);
      setTrial(null);
    }
    setReady(true);
  }, [tick]);

  const signIn = useCallback(
    (email: string, password: string) => {
      const res = repo.signIn(email, password);
      if (res.ok) refresh();
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    [refresh],
  );

  const signUp = useCallback(
    (input: { name: string; email: string; password: string }) => {
      const res = repo.signUp(input);
      if (res.ok) refresh();
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    [refresh],
  );

  const signOutFn = useCallback(() => {
    repo.signOut();
    refresh();
  }, [refresh]);

  const completeOnboarding = useCallback(
    (input: OnboardingInput) => {
      if (!user) return;
      const existing = repo.businessForUser(user.id);
      const b =
        existing ??
        repo.createBusiness({ name: input.name, type: input.type, ownerUserId: user.id });
      repo.updateBusiness(b.id, {
        name: input.name,
        type: input.type,
        onboarded: true,
        status: "pending",
      });
      repo.saveBrand(b.id, {
        logoDataUrl: input.logoDataUrl,
        primary: input.primary,
        secondary: input.secondary,
        fontFamily: input.fontFamily,
        currency: input.currency,
        language: input.language,
      });
      repo.listServices(b.id).forEach((s) => repo.removeService(s.id));
      input.services.forEach((name) => repo.addService(b.id, name));
      if (input.customTemplate) {
        repo.createRequest({
          businessId: b.id,
          businessName: input.name,
          fileName: input.customTemplate.fileName,
          fileType: input.customTemplate.fileType,
          previewDataUrl: input.customTemplate.previewDataUrl,
          status: "processing",
          templateId: null,
        });
      }
      refresh();
    },
    [user, refresh],
  );

  const saveBrandFn = useCallback(
    (patch: Partial<BrandProfile>) => {
      if (!business) return;
      repo.saveBrand(business.id, patch);
      refresh();
    },
    [business, refresh],
  );

  const renameBusiness = useCallback(
    (name: string) => {
      if (!business) return;
      repo.updateBusiness(business.id, { name });
      refresh();
    },
    [business, refresh],
  );

  const addServiceFn = useCallback(
    (name: string) => {
      if (!business) return;
      repo.addService(business.id, name);
      refresh();
    },
    [business, refresh],
  );

  const renameServiceFn = useCallback(
    (serviceId: string, name: string) => {
      repo.renameService(serviceId, name);
      refresh();
    },
    [refresh],
  );

  const removeServiceFn = useCallback(
    (serviceId: string) => {
      repo.removeService(serviceId);
      refresh();
    },
    [refresh],
  );

  const createPost = useCallback(
    (post: Post) => {
      if (!business || post.businessId !== business.id) return;
      const isNew = !repo.listPosts(business.id).some((p) => p.id === post.id);
      repo.savePost(post);
      if (isNew && business.status !== "approved") repo.bumpTrial(business.id);
      refresh();
    },
    [business, refresh],
  );

  const removePost = useCallback(
    (postId: string) => {
      if (!business) return;
      repo.deletePost(postId, business.id);
      refresh();
    },
    [business, refresh],
  );

  const language = brand?.language ?? guestLanguage;

  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      setGuestLanguage(lang);
      if (business) {
        repo.saveBrand(business.id, { language: lang });
        refresh();
      }
    },
    [business, refresh],
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
