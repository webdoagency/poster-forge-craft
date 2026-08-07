import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Brand, Post, Tenant } from "./types";
import demoBeach from "@/assets/demo-beach.jpg";
import demoCoffee from "@/assets/demo-coffee.jpg";
import demoCity from "@/assets/demo-city.jpg";

/**
 * Local persistence layer with tenant isolation.
 * Every record is namespaced by tenant id, mirroring the future
 * Supabase schema: tenants(id) -> brands(tenant_id), posts(tenant_id).
 * Swapping this module for Supabase queries requires no UI changes.
 */

const TENANTS_KEY = "rafty:tenants";
const ACTIVE_KEY = "rafty:active-tenant";
const brandKey = (t: string) => `rafty:${t}:brand`;
const postsKey = (t: string) => `rafty:${t}:posts`;

export const defaultTenants: Tenant[] = [
  { id: "t_wanderlux", name: "Wanderlux Travel", slug: "wanderlux" },
  { id: "t_beanpress", name: "Beanpress Coffee", slug: "beanpress" },
];

const defaultBrands: Record<string, Brand> = {
  t_wanderlux: {
    businessName: "Wanderlux Travel",
    logoDataUrl: null,
    primary: "#7c3aed",
    secondary: "#c026d3",
    fontFamily: "Sora",
    services: ["Flights", "Hotel", "Transfers", "Guide", "Insurance", "Visa support"],
  },
  t_beanpress: {
    businessName: "Beanpress Coffee",
    logoDataUrl: null,
    primary: "#6d28d9",
    secondary: "#0ea5e9",
    fontFamily: "Plus Jakarta Sans",
    services: ["Dine-in", "Takeaway", "Delivery", "Catering"],
  },
};

const demoPosts: Record<string, Post[]> = {
  t_wanderlux: [
    {
      id: "p_demo_1",
      tenantId: "t_wanderlux",
      templateId: "aurora",
      createdAt: "2026-08-02T09:20:00.000Z",
      fields: {
        title: "7 Nights in Paradise",
        destination: "Maldives",
        business: "Wanderlux Travel",
        price: "€1,290",
        date: "September",
        additionalText: "Limited seats — book before Friday",
        services: ["Flights", "Hotel", "Transfers"],
        imageDataUrl: demoBeach,
        caption:
          "Turquoise water, zero to-do list. 7 nights in the Maldives from €1,290 — flights, hotel and transfers handled. September dates open now.",
      },
    },
    {
      id: "p_demo_2",
      tenantId: "t_wanderlux",
      templateId: "editorial",
      createdAt: "2026-07-28T14:05:00.000Z",
      fields: {
        title: "City Break Weekend",
        destination: "Lisbon",
        business: "Wanderlux Travel",
        price: "€349",
        date: "Oct 10–13",
        additionalText: "Boutique stay in Alfama",
        services: ["Flights", "Hotel", "Guide"],
        imageDataUrl: demoCity,
        caption:
          "Tiled streets, pastéis and sunset viewpoints. Lisbon long weekend from €349, Oct 10–13.",
      },
    },
  ],
  t_beanpress: [
    {
      id: "p_demo_3",
      tenantId: "t_beanpress",
      templateId: "glass",
      createdAt: "2026-08-04T07:45:00.000Z",
      fields: {
        title: "Single Origin Fridays",
        destination: "Bergen Roastery",
        business: "Beanpress Coffee",
        price: "kr 49",
        date: "Every Friday",
        additionalText: "Filter brew, first cup free for members",
        services: ["Dine-in", "Takeaway"],
        imageDataUrl: demoCoffee,
        caption:
          "New single origin every Friday. Members get the first cup on us — filter only, while it lasts.",
      },
    },
  ],
};

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
    /* quota — ignore */
  }
}

type Ctx = {
  ready: boolean;
  tenants: Tenant[];
  tenant: Tenant;
  setTenantId: (id: string) => void;
  brand: Brand;
  saveBrand: (patch: Partial<Brand>) => void;
  posts: Post[];
  addPost: (post: Post) => void;
  deletePost: (id: string) => void;
};

const RaftyContext = createContext<Ctx | null>(null);

export function RaftyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [tenantId, setTid] = useState(defaultTenants[0]!.id);
  const [tenants, setTenants] = useState<Tenant[]>(defaultTenants);
  const [brand, setBrand] = useState<Brand>(defaultBrands[defaultTenants[0]!.id]!);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const t = read<Tenant[]>(TENANTS_KEY, defaultTenants);
    const active = read<string>(ACTIVE_KEY, defaultTenants[0]!.id);
    setTenants(t);
    setTid(active);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setBrand(read<Brand>(brandKey(tenantId), defaultBrands[tenantId] ?? defaultBrands.t_wanderlux!));
    setPosts(read<Post[]>(postsKey(tenantId), demoPosts[tenantId] ?? []));
    write(ACTIVE_KEY, tenantId);
  }, [tenantId, ready]);

  const setTenantId = useCallback((id: string) => setTid(id), []);

  const saveBrand = useCallback(
    (patch: Partial<Brand>) => {
      setBrand((prev) => {
        const next = { ...prev, ...patch };
        write(brandKey(tenantId), next);
        return next;
      });
    },
    [tenantId],
  );

  const addPost = useCallback(
    (post: Post) => {
      setPosts((prev) => {
        const next = [post, ...prev.filter((p) => p.id !== post.id)];
        write(postsKey(tenantId), next);
        return next;
      });
    },
    [tenantId],
  );

  const deletePost = useCallback(
    (id: string) => {
      setPosts((prev) => {
        const next = prev.filter((p) => p.id !== id);
        write(postsKey(tenantId), next);
        return next;
      });
    },
    [tenantId],
  );

  const tenant = useMemo(
    () => tenants.find((t) => t.id === tenantId) ?? tenants[0]!,
    [tenants, tenantId],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready,
      tenants,
      tenant,
      setTenantId,
      brand,
      saveBrand,
      posts,
      addPost,
      deletePost,
    }),
    [ready, tenants, tenant, setTenantId, brand, saveBrand, posts, addPost, deletePost],
  );

  return <RaftyContext.Provider value={value}>{children}</RaftyContext.Provider>;
}

export function useRafty() {
  const ctx = useContext(RaftyContext);
  if (!ctx) throw new Error("useRafty must be used inside RaftyProvider");
  return ctx;
}
