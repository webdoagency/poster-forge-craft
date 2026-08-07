import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/rafty/Logo";
import { useRafty } from "@/lib/rafty/store";
import * as repo from "@/lib/rafty/repo";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_NAMES,
  CURRENCIES,
  FONTS,
} from "@/lib/rafty/constants";
import { globalTemplates } from "@/lib/rafty/templates";
import type { Business, BusinessStatus, BusinessType } from "@/lib/rafty/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Rafty Content" },
      { name: "description", content: "Approve businesses, manage templates and review custom requests." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin | Rafty Content" },
      { property: "og:description", content: "Operational admin area for Rafty Content." },
    ],
  }),
  component: AdminPage,
});

type Tab = "dashboard" | "businesses" | "templates" | "requests";

function AdminPage() {
  const { ready, user, refresh } = useRafty();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (ready && (!user || user.role !== "admin")) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  const businesses = useMemo(() => repo.listBusinesses(), [tick]);
  const posts = useMemo(() => repo.listAllPosts(), [tick]);
  const requests = useMemo(() => repo.listRequests(), [tick]);
  const customTemplates = useMemo(
    () => repo.listAllCustomTemplates().filter((x) => x.scope === "custom"),
    [tick],
  );

  const bump = () => {
    setTick((n) => n + 1);
    refresh();
  };

  if (!ready || !user || user.role !== "admin") return <div className="page-bg min-h-screen" />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "businesses", label: "Businesses" },
    { id: "templates", label: "Templates" },
    { id: "requests", label: "Custom templates" },
  ];

  return (
    <div className="page-bg min-h-screen">
      <header className="glass-panel sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="shrink-0">
            <Logo height={24} />
          </Link>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
            Admin
          </span>
          <nav className="ml-auto flex flex-wrap gap-1">
            {tabs.map((x) => (
              <button
                key={x.id}
                onClick={() => setTab(x.id)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === x.id
                    ? "bg-primary-soft text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {x.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {tab === "dashboard" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Businesses", value: businesses.length },
              {
                label: "Pending approval",
                value: businesses.filter((b) => b.status === "pending").length,
              },
              { label: "Posts created", value: posts.length },
              { label: "Custom requests", value: requests.length },
            ].map((c) => (
              <div key={c.label} className="card-soft p-5">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="font-display text-3xl font-extrabold">{c.value}</p>
              </div>
            ))}
            <div className="card-soft p-5 sm:col-span-2 lg:col-span-4">
              <p className="text-sm text-muted-foreground">Template library</p>
              <p className="font-display text-3xl font-extrabold">
                {globalTemplates.length} global, {customTemplates.length} custom
              </p>
            </div>
          </div>
        ) : null}

        {tab === "businesses" ? <Businesses businesses={businesses} onChange={bump} /> : null}

        {tab === "templates" ? (
          <div className="grid gap-4">
            <div className="card-soft p-5">
              <p className="font-display text-lg font-bold">Library</p>
              <p className="text-sm text-muted-foreground">
                {globalTemplates.length} deterministic templates, assigned by business type.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {BUSINESS_TYPES.map((bt) => (
                  <div key={bt} className="rounded-xl border bg-card px-4 py-3">
                    <p className="text-sm font-bold">{BUSINESS_TYPE_NAMES[bt]}</p>
                    <p className="text-xs text-muted-foreground">
                      {globalTemplates.filter((x) => x.businessType === bt).length} templates
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-soft p-5">
              <p className="font-display text-lg font-bold">Custom templates</p>
              {customTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {customTemplates.map((x) => (
                    <div key={x.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{x.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {businesses.find((b) => b.id === x.businessId)?.name ?? x.businessId}
                          {x.archived ? " | archived" : ""}
                        </p>
                      </div>
                      {!x.archived ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto shrink-0 rounded-xl"
                          onClick={() => {
                            repo.archiveTemplate(x.id);
                            bump();
                          }}
                        >
                          Archive
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card-soft grid gap-2 p-5 text-sm">
              <p className="font-display text-lg font-bold">Available options</p>
              <p className="text-muted-foreground">
                Business types: {BUSINESS_TYPES.map((b) => BUSINESS_TYPE_NAMES[b]).join(", ")}
              </p>
              <p className="text-muted-foreground">Fonts: {FONTS.join(", ")}</p>
              <p className="text-muted-foreground">Currencies: {CURRENCIES.join(", ")}</p>
            </div>
          </div>
        ) : null}

        {tab === "requests" ? (
          <div className="card-soft grid gap-3 p-5">
            <p className="font-display text-lg font-bold">Custom template requests</p>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
                  {r.previewDataUrl ? (
                    <img src={r.previewDataUrl} alt="" className="size-14 rounded-lg object-cover" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{r.businessName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.fileName} | {r.status}
                    </p>
                  </div>
                  {r.status !== "rejected" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto shrink-0 rounded-xl"
                      onClick={() => {
                        repo.updateRequest(r.id, { status: "rejected" });
                        if (r.templateId) repo.archiveTemplate(r.templateId);
                        bump();
                      }}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Businesses({ businesses, onChange }: { businesses: Business[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<BusinessType>("travel_agency");
  const [email, setEmail] = useState("");

  const setStatus = (id: string, status: BusinessStatus) => {
    repo.updateBusiness(id, { status });
    onChange();
  };

  return (
    <div className="grid gap-4">
      <div className="card-soft grid gap-3 p-5">
        <p className="font-display text-lg font-bold">Create client</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="cname">Business name</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cemail">Owner email</Label>
            <Input id="cemail" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label>Business type</Label>
            <Select value={type} onValueChange={(v) => setType(v as BusinessType)}>
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((bt) => (
                  <SelectItem key={bt} value={bt}>
                    {BUSINESS_TYPE_NAMES[bt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="h-11 w-fit rounded-xl"
          onClick={() => {
            if (!name.trim() || !email.trim()) return;
            const created = repo.signUp({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password: "rafty-temp-1234",
            });
            if (!created.ok) {
              toast.error(created.error);
              return;
            }
            repo.createBusiness({
              name: name.trim(),
              type,
              ownerUserId: created.user.id,
            });
            setName("");
            setEmail("");
            onChange();
            toast.success("Client created with a temporary password.");
          }}
        >
          Create
        </Button>
      </div>

      <div className="card-soft grid gap-2 p-5">
        <p className="font-display text-lg font-bold">Clients</p>
        {businesses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No businesses yet.</p>
        ) : (
          businesses.map((b) => {
            const trial = repo.getTrial(b.id);
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {BUSINESS_TYPE_NAMES[b.type]} | {b.status} | trial {trial.postsCreated}/
                    {trial.freePostLimit}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 flex-wrap gap-2">
                  {b.status !== "approved" ? (
                    <Button size="sm" className="rounded-xl" onClick={() => setStatus(b.id, "approved")}>
                      Approve
                    </Button>
                  ) : null}
                  {b.status !== "suspended" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setStatus(b.id, "suspended")}
                    >
                      Suspend
                    </Button>
                  ) : null}
                  {b.status !== "rejected" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => setStatus(b.id, "rejected")}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
