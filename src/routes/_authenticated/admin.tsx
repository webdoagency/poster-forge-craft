import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/rafty/Logo";
import { useRafty } from "@/lib/rafty/store";
import * as repo from "@/lib/rafty/repo";
import {
  BUSINESS_TYPE_NAMES,
  PLAN_NAMES,
  PLATFORM_LABELS,
  PRICE_POINTS,
  partnershipPostsFor,
  tierForPrice,
} from "@/lib/rafty/constants";
import type {
  AccountPlan,
  Business,
  BusinessStatus,
  CustomTemplateRequest,
  Post,
  ScheduledPost,
  TrialUsage,
} from "@/lib/rafty/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin | krijo24" },
      { name: "description", content: "Platform administration." },
      { property: "og:title", content: "Admin | krijo24" },
      { property: "og:description", content: "Platform administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const STATUSES: BusinessStatus[] = ["pending", "approved", "rejected", "suspended"];
const STATUS_FILTERS: (BusinessStatus | "all")[] = ["all", ...STATUSES];

function statusTone(status: BusinessStatus) {
  if (status === "approved") return "default" as const;
  if (status === "pending") return "secondary" as const;
  return "outline" as const;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function AdminPage() {
  const { ready, isAdmin, user } = useRafty();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [trials, setTrials] = useState<TrialUsage[]>([]);
  const [requests, setRequests] = useState<CustomTemplateRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [plans, setPlans] = useState<AccountPlan[]>([]);
  const [schedules, setSchedules] = useState<ScheduledPost[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BusinessStatus | "all">("all");
  const [loading, setLoading] = useState(false);

  // Every read below only returns rows for platform admins. Access is enforced
  // server side by RLS and is_super_admin(), this page never assumes a role.
  const load = useCallback(async () => {
    setLoading(true);
    const [b, tr, rq, ps, pl, sc] = await Promise.all([
      repo.adminListBusinesses(),
      repo.adminListTrials(),
      repo.listRequests(),
      repo.adminListPosts(),
      repo.adminListPlans(),
      repo.adminListSchedules(),
    ]);
    setBusinesses(b);
    setTrials(tr);
    setRequests(rq);
    setPosts(ps);
    setPlans(pl);
    setSchedules(sc);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAdmin) {
      navigate({ to: "/create", replace: true });
      return;
    }
    void load();
  }, [ready, isAdmin, navigate, load]);

  const trialFor = useMemo(
    () => (businessId: string) => trials.find((t) => t.businessId === businessId),
    [trials],
  );

  const planFor = useMemo(
    () => (ownerUserId: string) => plans.find((p) => p.userId === ownerUserId),
    [plans],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return b.name.toLowerCase().includes(q) || BUSINESS_TYPE_NAMES[b.type].toLowerCase().includes(q);
    });
  }, [businesses, query, statusFilter]);

  async function setStatus(businessId: string, status: BusinessStatus) {
    await repo.adminSetStatus(businessId, status);
    toast.success(`Status set to ${status}`);
    await load();
  }

  /** Price is the entitlement source of truth, the database derives the rest. */
  async function setPlan(ownerUserId: string, monthlyPrice: number, active: boolean) {
    const { error } = await repo.adminSetPlan(ownerUserId, monthlyPrice, active);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(active ? `Activated at ${monthlyPrice} €` : "Entitlement saved, not active");
    await load();
  }

  if (!ready || !isAdmin) return <div className="page-bg min-h-screen" />;

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const byStatus = (status: BusinessStatus) => businesses.filter((b) => b.status === status).length;
  const approvedThisWeek = businesses.filter(
    (b) => b.status === "approved" && now - new Date(b.createdAt).getTime() <= weekMs,
  ).length;
  const activeBrands = businesses.filter((b) => b.onboarded).length;
  const trialTotals = trials.reduce(
    (acc, t) => ({ used: acc.used + t.postsCreated, limit: acc.limit + t.freePostLimit }),
    { used: 0, limit: 0 },
  );

  // Owners grouped for plan management, one row per account.
  const owners = useMemoOwners(businesses);
  const recentSignups = businesses.slice(0, 6);
  const recentPosts = posts.slice(0, 6);
  const postBusinessName = (businessId: string) =>
    businesses.find((b) => b.id === businessId)?.name ?? "Unknown business";

  return (
    <div className="page-bg min-h-screen">
      <header className="glass-panel sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/">
            <Logo height={24} />
          </Link>
          <span className="rounded-lg bg-primary-soft px-2 py-1 text-xs font-bold">Admin</span>
          <p className="ml-auto truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-card p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="requests">Custom templates</TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Businesses", value: businesses.length },
                { label: "Pending approval", value: byStatus("pending") },
                { label: "Approved", value: byStatus("approved") },
                { label: "Approved this week", value: approvedThisWeek },
                { label: "Suspended or rejected", value: byStatus("suspended") + byStatus("rejected") },
                { label: "Active brands", value: activeBrands },
                { label: "Posts created", value: posts.length },
                {
                  label: "Trial usage",
                  value: `${trialTotals.used}/${trialTotals.limit || 0}`,
                },
              ].map((card) => (
                <div key={card.label} className="card-soft p-5">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="font-display text-3xl font-extrabold">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="card-soft p-5">
                <h2 className="mb-3 font-display text-lg font-extrabold">Recent signups</h2>
                <div className="grid gap-2">
                  {recentSignups.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate font-semibold">{b.name}</span>
                      <Badge variant={statusTone(b.status)}>{b.status}</Badge>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(b.createdAt)}</span>
                    </div>
                  ))}
                  {recentSignups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No businesses yet.</p>
                  ) : null}
                </div>
              </div>
              <div className="card-soft p-5">
                <h2 className="mb-3 font-display text-lg font-extrabold">Recent posts</h2>
                <div className="grid gap-2">
                  {recentPosts.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {p.content.title || "Untitled"}
                      </span>
                      <span className="shrink-0 truncate text-xs text-muted-foreground">
                        {postBusinessName(p.businessId)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(p.createdAt)}</span>
                    </div>
                  ))}
                  {recentPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No posts yet.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="businesses">
            <div className="mb-4 flex flex-wrap gap-2">
              <Input
                placeholder="Search businesses"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 max-w-sm rounded-xl bg-card"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BusinessStatus | "all")}>
                <SelectTrigger className="h-11 w-40 rounded-xl bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "all" ? "All statuses" : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading ? <span className="self-center text-xs text-muted-foreground">Loading...</span> : null}
            </div>
            <div className="grid gap-3">
              {filtered.map((b) => {
                const trial = trialFor(b.id);
                return (
                  <div key={b.id} className="card-soft flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{b.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.customType || BUSINESS_TYPE_NAMES[b.type]} | trial{" "}
                        {trial?.postsCreated ?? 0}/{trial?.freePostLimit ?? 1}
                      </p>
                    </div>
                    <Badge variant={statusTone(b.status)}>{b.status}</Badge>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.filter((s) => s !== b.status).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => void setStatus(b.id, s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No businesses match this search.</p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="plans">
            <div className="grid gap-3">
              {owners.map((owner) => {
                const plan = planFor(owner.ownerUserId);
                const price = plan?.monthlyPrice ?? 50;
                const active = plan?.active ?? false;
                return (
                  <div key={owner.ownerUserId} className="card-soft flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{owner.names.join(", ")}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {owner.businessIds.length} brand{owner.businessIds.length === 1 ? "" : "s"} | limit{" "}
                        {plan?.brandLimit ?? 1} | {PLAN_NAMES[plan?.plan ?? "starter"]}
                        {plan && plan.partnershipPostsLimit > 0
                          ? ` | ${plan.partnershipPostsUsed}/${plan.partnershipPostsLimit} done for you posts`
                          : ""}
                      </p>
                    </div>
                    <Select
                      value={String(price)}
                      onValueChange={(v) => void setPlan(owner.ownerUserId, Number(v), active)}
                    >
                      <SelectTrigger className="h-10 w-52 rounded-xl bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_POINTS.map((p) => (
                          <SelectItem key={p} value={String(p)}>
                            {p} € | {PLAN_NAMES[tierForPrice(p)]}
                            {partnershipPostsFor(p) > 0 ? ` | ${partnershipPostsFor(p)} posts` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {active ? "Active" : "Not active"}
                      </span>
                      <Switch
                        checked={active}
                        onCheckedChange={(v) => void setPlan(owner.ownerUserId, price, v)}
                      />
                    </div>
                  </div>
                );
              })}
              {owners.length === 0 ? (
                <p className="text-sm text-muted-foreground">No accounts yet.</p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="grid gap-3">
              {requests.map((r) => (
                <div key={r.id} className="card-soft flex flex-wrap items-center gap-3 p-4">
                  {r.previewDataUrl ? (
                    <img src={r.previewDataUrl} alt="" className="size-14 rounded-lg object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{r.fileName}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.businessName}</p>
                  </div>
                  <Badge variant="secondary">{r.status}</Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={async () => {
                        await repo.updateRequest(r.id, { status: "ready" });
                        await load();
                      }}
                    >
                      Mark ready
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={async () => {
                        await repo.updateRequest(r.id, { status: "rejected" });
                        if (r.templateId) await repo.archiveTemplate(r.templateId);
                        await load();
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No custom template requests.</p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="queue">
            <div className="grid gap-3">
              {schedules.map((row) => {
                const b = businesses.find((x) => x.id === row.businessId);
                return (
                  <div key={row.id} className="card-soft flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{b?.name ?? row.businessId}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {PLATFORM_LABELS[row.platform]} · {new Date(row.scheduledAt).toLocaleString()} ·{" "}
                        {row.timezone}
                        {row.note ? ` · ${row.note}` : ""}
                      </p>
                    </div>
                    <Badge variant={row.status === "queued" ? "default" : "outline"}>{row.status}</Badge>
                  </div>
                );
              })}
              {schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled across the platform.</p>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/** Groups businesses by owner so each account gets one plan management row. */
function useMemoOwners(businesses: Business[]) {
  return useMemo(() => {
    const map = new Map<string, { ownerUserId: string; names: string[]; businessIds: string[] }>();
    for (const b of businesses) {
      const entry = map.get(b.ownerUserId) ?? { ownerUserId: b.ownerUserId, names: [], businessIds: [] };
      entry.names.push(b.name);
      entry.businessIds.push(b.id);
      map.set(b.ownerUserId, entry);
    }
    return [...map.values()];
  }, [businesses]);
}
