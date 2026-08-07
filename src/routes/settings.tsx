import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { AppShell } from "@/components/rafty/AppShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRafty } from "@/lib/rafty/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RAFTY" },
      {
        name: "description",
        content: "Workspace settings and tenant isolation details for your RAFTY account.",
      },
      { property: "og:title", content: "Settings — RAFTY" },
      { property: "og:description", content: "Workspace, tenant and export settings for RAFTY." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { tenant, tenants, setTenantId, posts } = useRafty();

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Settings</h1>
        <p className="text-sm text-muted-foreground">Workspace &amp; export.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card-soft space-y-4 p-5">
          <div>
            <Label>Workspace</Label>
            <p className="text-xs text-muted-foreground">
              Each workspace has isolated brand kit and posts.
            </p>
          </div>
          <div className="space-y-2">
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => setTenantId(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  t.id === tenant.id ? "border-primary bg-primary-soft" : "bg-card hover:bg-accent"
                }`}
              >
                <span className="brand-gradient grid size-9 shrink-0 place-items-center rounded-lg text-xs font-black text-primary-foreground">
                  {t.name.slice(0, 1)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{t.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">/{t.slug}</span>
                </span>
                {t.id === tenant.id ? <Check className="ml-auto size-4 text-primary" /> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="card-soft space-y-4 p-5">
          <div className="space-y-1.5">
            <Label>Tenant ID</Label>
            <Input value={tenant.id} readOnly className="font-mono text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Saved posts" value={String(posts.length)} />
            <Stat label="Export size" value="1080 × 1350" />
          </div>
          <p className="text-xs text-muted-foreground">
            Posts export as 4:5 PNG. One image per post.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-secondary/50 p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-extrabold">{value}</p>
    </div>
  );
}
