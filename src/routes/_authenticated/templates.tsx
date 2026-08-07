import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/rafty/AppShell";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { useRafty } from "@/lib/rafty/store";
import { globalTemplates } from "@/lib/rafty/templates";
import { readFileAsDataUrl } from "@/lib/rafty/file";
import * as repo from "@/lib/rafty/repo";
import { BUSINESS_TYPES, BUSINESS_TYPE_NAMES } from "@/lib/rafty/constants";
import demoBeach from "@/assets/demo-beach.jpg";
import { emptyContent, type BusinessType, type PostContent } from "@/lib/rafty/types";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({
    meta: [
      { title: "Templates | Rafty Content" },
      {
        name: "description",
        content: "Fifty deterministic post templates across five business types, plus your own uploads.",
      },
      { property: "og:title", content: "Templates | Rafty Content" },
      { property: "og:description", content: "Layout is fixed by design. You only bring the content." },
    ],
  }),
  component: () => (
    <AppShell>
      <TemplatesPage />
    </AppShell>
  ),
});

const samples: Record<BusinessType, PostContent> = {
  travel_agency: {
    ...emptyContent,
    title: "7 nights in paradise",
    subject: "Maldives",
    location: "Reethi Beach Resort",
    price: "1290",
    date: "September",
    meta1: "7 nights",
    additionalText: "Limited seats, book before Friday",
    services: ["Accommodation", "Breakfast", "Transfers"],
    imageDataUrl: demoBeach,
  },
  real_estate: {
    ...emptyContent,
    title: "Light filled city apartment",
    subject: "Two bedroom apartment",
    location: "Lisbon, Alfama",
    price: "349000",
    meta1: "3 rooms",
    meta2: "96 m2",
    additionalText: "Private viewings this weekend",
    services: ["Balcony", "Parking", "Elevator"],
    imageDataUrl: demoBeach,
  },
  car_dealership: {
    ...emptyContent,
    title: "Ready to drive today",
    subject: "Audi A4 Avant",
    location: "Zurich showroom",
    price: "28900",
    date: "2022",
    meta1: "42000 km",
    additionalText: "Financing from 199 per month",
    services: ["Warranty", "Trade in", "Service history"],
    imageDataUrl: demoBeach,
  },
  restaurant: {
    ...emptyContent,
    title: "Sunday roast, all afternoon",
    subject: "Slow roasted lamb",
    location: "Old Town",
    price: "24",
    date: "Every Sunday",
    additionalText: "Reservations recommended",
    services: ["Dinner", "Wine list", "Terrace"],
    imageDataUrl: demoBeach,
  },
  retail: {
    ...emptyContent,
    title: "New season, new layers",
    subject: "Merino knit sweater",
    location: "In store and online",
    price: "89",
    meta1: "Autumn collection",
    additionalText: "Free shipping this week",
    services: ["New arrival", "Free returns"],
    imageDataUrl: demoBeach,
  },
};

function TemplatesPage() {
  const { business, brand, templates, refresh, t } = useRafty();
  const [filter, setFilter] = useState<BusinessType | "all">(business?.type ?? "all");
  const [uploading, setUploading] = useState(false);

  const requests = useMemo(
    () => (business ? repo.listRequests(business.id) : []),
    [business, uploading],
  );

  if (!business || !brand) return null;

  const custom = templates.filter((x) => x.scope === "custom");
  const list = filter === "all" ? templates : templates.filter((x) => x.businessType === filter);

  async function upload(file: File) {
    setUploading(true);
    const preview = file.type.startsWith("image/") ? await readFileAsDataUrl(file) : null;
    const request = repo.createRequest({
      businessId: business!.id,
      businessName: business!.name,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      previewDataUrl: preview,
      status: "processing",
      templateId: null,
    });
    // Deterministic recreation: the reference is mapped onto a base engine and
    // saved as a private template owned by this business only.
    const base = globalTemplates.find((x) => x.businessType === business!.type) ?? globalTemplates[0]!;
    const template = {
      ...base,
      id: repo.id("tpl"),
      name: `${business!.name} custom`,
      scope: "custom" as const,
      businessId: business!.id,
    };
    repo.saveCustomTemplate(template);
    repo.updateRequest(request.id, { status: "ready", templateId: template.id });
    setUploading(false);
    refresh();
    toast.success(t("tpl.ready"));
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-2xl font-extrabold">{t("tpl.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {BUSINESS_TYPE_NAMES[business.type]} | {templates.length}
          </p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as BusinessType | "all")}>
          <SelectTrigger className="h-11 w-[200px] rounded-xl bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("tpl.all")}</SelectItem>
            {BUSINESS_TYPES.map((bt) => (
              <SelectItem key={bt} value={bt}>
                {BUSINESS_TYPE_NAMES[bt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="inline-flex">
          <input
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold">
            <Upload className="size-4" />
            {uploading ? t("tpl.processing") : t("tpl.upload")}
          </span>
        </label>
      </div>

      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">{t("tpl.uploadHint")}</p>

      {requests.length ? (
        <div className="card-soft mb-6 grid gap-2 p-4 text-sm">
          <p className="font-semibold">{t("tpl.mine")}</p>
          {requests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 text-muted-foreground">
              <span className="truncate">{r.fileName}</span>
              <span className="ml-auto shrink-0 font-semibold text-foreground">
                {t(`tpl.${r.status}`)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[...custom.filter((c) => list.includes(c)), ...list.filter((x) => x.scope === "global")].map(
          (tpl) => (
            <article key={tpl.id} className="card-soft overflow-hidden">
              <div className="p-2">
                <PostCanvas
                  template={tpl}
                  content={samples[tpl.businessType]}
                  brand={brand}
                  businessName={business.name}
                  businessType={tpl.businessType}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center gap-3 px-4 pb-4 pt-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{tpl.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {BUSINESS_TYPE_NAMES[tpl.businessType]}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="ml-auto shrink-0 rounded-xl">
                  <Link to="/create" search={{ template: tpl.id }}>
                    {t("tpl.select")}
                  </Link>
                </Button>
              </div>
            </article>
          ),
        )}
      </div>
    </div>
  );
}
