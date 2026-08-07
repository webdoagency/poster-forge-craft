import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/rafty/Logo";
import { useRafty } from "@/lib/rafty/store";
import * as repo from "@/lib/rafty/repo";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_NAMES,
  CURRENCIES,
  FONTS,
  LANGUAGES,
} from "@/lib/rafty/constants";
import type { Business, BusinessStatus, CustomTemplateRequest, TrialUsage } from "@/lib/rafty/types";
import { globalTemplates } from "@/lib/rafty/templates";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Rafty" },
      { name: "description", content: "Rafty platform administration." },
      { property: "og:title", content: "Admin | Rafty" },
      { property: "og:description", content: "Rafty platform administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const STATUSES: BusinessStatus[] = ["pending", "approved", "rejected", "suspended"];

function statusTone(status: BusinessStatus) {
  if (status === "approved") return "default" as const;
  if (status === "pending") return "secondary" as const;
  return "outline" as const;
}

function AdminPage() {
  const { ready, isAdmin, user } = useRafty();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [trials, setTrials] = useState<TrialUsage[]>([]);
  const [requests, setRequests] = useState<CustomTemplateRequest[]>([]);
  const [customTemplates, setCustomTemplates] = useState<
    { id: string; businessId: string; name: string; archived: boolean }[]
  >([]);
  const [postCount, setPostCount] = useState(0);
  const [query, setQuery] = useState("");

  // Admin data is only returned by the database for platform admins.
  const load = useCallback(async () => {
    const [b, tr, rq, ct, posts] = await Promise.all([
      repo.adminListBusinesses(),
      repo.adminListTrials(),
      repo.listRequests(),
      repo.adminListCustomTemplates(),
      repo.adminListPosts(),
    ]);
    setBusinesses(b);
    setTrials(tr);
    setRequests(rq);
    setCustomTemplates(ct);
    setPostCount(posts.length);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) => b.name.toLowerCase().includes(q) || BUSINESS_TYPE_NAMES[b.type].toLowerCase().includes(q),
    );
  }, [businesses, query]);

  async function setStatus(businessId: string, status: BusinessStatus) {
    await repo.adminSetStatus(businessId, status);
    toast.success(`Status set to ${status}`);
    await load();
  }

  if (!ready || !isAdmin) return <div className="page-bg min-h-screen" />;

  const pending = businesses.filter((b) => b.status === "pending").length;

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
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-card p-1">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="requests">Custom templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Businesses", value: businesses.length },
                { label: "Pending approval", value: pending },
                { label: "Posts created", value: postCount },
                { label: "Custom requests", value: requests.length },
              ].map((card) => (
                <div key={card.label} className="card-soft p-5">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="font-display text-3xl font-extrabold">{card.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="businesses">
            <div className="mb-4 max-w-sm">
              <Input
                placeholder="Search businesses"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 rounded-xl bg-card"
              />
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
                <p className="text-sm text-muted-foreground">No businesses yet.</p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="card-soft mb-4 p-5">
              <p className="text-sm text-muted-foreground">Global library</p>
              <p className="font-display text-3xl font-extrabold">{globalTemplates.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Templates are assigned automatically by business type, and every business also sees
                the full library.
              </p>
            </div>
            <div className="grid gap-2">
              {BUSINESS_TYPES.map((bt) => (
                <div key={bt} className="card-soft flex items-center gap-3 p-4 text-sm">
                  <span className="font-semibold">{BUSINESS_TYPE_NAMES[bt]}</span>
                  <span className="ml-auto text-muted-foreground">
                    {globalTemplates.filter((t) => t.businessType === bt).length} templates
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="grid gap-3">
              {requests.map((r) => (
                <div key={r.id} className="card-soft flex flex-wrap items-center gap-3 p-4">
                  {r.previewDataUrl ? (
                    <img
                      src={r.previewDataUrl}
                      alt=""
                      className="size-14 rounded-lg object-cover"
                    />
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

            <h2 className="mb-3 mt-8 font-display text-lg font-extrabold">Private templates</h2>
            <div className="grid gap-2">
              {customTemplates.map((x) => (
                <div key={x.id} className="card-soft flex items-center gap-3 p-4 text-sm">
                  <span className="truncate font-semibold">{x.name}</span>
                  {x.archived ? <Badge variant="outline">archived</Badge> : null}
                  {!x.archived ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto rounded-xl"
                      onClick={async () => {
                        await repo.archiveTemplate(x.id);
                        await load();
                      }}
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              ))}
              {customTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No private templates yet.</p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card-soft p-5">
                <p className="mb-2 font-bold">Business types</p>
                <ul className="grid gap-1 text-sm text-muted-foreground">
                  {BUSINESS_TYPES.map((bt) => (
                    <li key={bt}>{BUSINESS_TYPE_NAMES[bt]}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Businesses outside these categories use Other with a free text category.
                </p>
              </div>
              <div className="card-soft p-5">
                <p className="mb-2 font-bold">Fonts</p>
                <ul className="grid gap-1 text-sm text-muted-foreground">
                  {FONTS.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="card-soft p-5">
                <p className="mb-2 font-bold">Currencies and languages</p>
                <p className="text-sm text-muted-foreground">{CURRENCIES.join(", ")}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {LANGUAGES.map((l) => l.label).join(", ")}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
