import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rafty/AppShell";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { useRafty } from "@/lib/rafty/store";
import { templates } from "@/lib/rafty/templates";
import type { PostFields } from "@/lib/rafty/types";
import demoBeach from "@/assets/demo-beach.jpg";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates — RAFTY" },
      {
        name: "description",
        content: "Deterministic post templates. Layout is fixed by design; AI only writes the text.",
      },
      { property: "og:title", content: "Templates — RAFTY" },
      { property: "og:description", content: "Polished 4:5 layouts for branded social posts." },
    ],
  }),
  component: TemplatesPage,
});

const sample: PostFields = {
  title: "7 Nights in Paradise",
  destination: "Maldives",
  business: "Wanderlux Travel",
  price: "€1,290",
  date: "September",
  additionalText: "Limited seats — book before Friday",
  services: ["Flights", "Hotel", "Transfers"],
  imageDataUrl: demoBeach,
  caption: "",
};

function TemplatesPage() {
  const { brand } = useRafty();

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Layouts are fixed. AI writes text only — never the design.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <article key={t.id} className="card-soft overflow-hidden">
            <div className="p-2">
              <PostCanvas
                templateId={t.id}
                fields={{ ...sample, business: brand.businessName }}
                brand={brand}
                className="rounded-xl"
              />
            </div>
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm font-bold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.vibe}</p>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
