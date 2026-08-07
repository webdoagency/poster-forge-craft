import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
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
import { AppShell } from "@/components/rafty/AppShell";
import { useRafty } from "@/lib/rafty/store";
import { readFileAsDataUrl } from "@/lib/rafty/file";
import { BUSINESS_TYPE_NAMES, CURRENCIES, FONTS, LANGUAGES } from "@/lib/rafty/constants";
import type { CurrencyCode, LanguageCode } from "@/lib/rafty/types";

export const Route = createFileRoute("/_authenticated/brand")({
  head: () => ({
    meta: [
      { title: "Brand settings | Rafty Content" },
      {
        name: "description",
        content: "Logo, colors, font, currency, language and services for your business.",
      },
      { property: "og:title", content: "Brand settings | Rafty Content" },
      { property: "og:description", content: "Everything your templates use to stay on brand." },
    ],
  }),
  component: () => (
    <AppShell>
      <BrandPage />
    </AppShell>
  ),
});

function BrandPage() {
  const {
    business,
    brand,
    services,
    trial,
    saveBrand,
    renameBusiness,
    addService,
    renameService,
    removeService,
    setLanguage,
    t,
  } = useRafty();

  const [name, setName] = useState(business?.name ?? "");
  const [newService, setNewService] = useState("");

  if (!business || !brand) return null;

  const trialLeft = Math.max(0, (trial?.freePostLimit ?? 1) - (trial?.postsCreated ?? 0));

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">{t("brand.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("brand.status")}: {t(`status.${business.status}`)}
          {business.status !== "approved" ? ` | ${t("trial.remaining")}: ${trialLeft}` : ""}
        </p>
      </div>

      <div className="card-soft grid gap-4 p-4">
        <div className="grid gap-1.5">
          <Label htmlFor="bname">{t("brand.business")}</Label>
          <Input
            id="bname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name.trim() !== business.name) {
                renameBusiness(name.trim());
                toast.success(t("brand.saved"));
              }
            }}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="grid gap-1.5">
          <Label>{t("brand.type")}</Label>
          <Input
            value={BUSINESS_TYPE_NAMES[business.type]}
            readOnly
            className="h-11 rounded-xl bg-muted"
          />
        </div>

        <div className="grid gap-2">
          <Label>{t("brand.logo")}</Label>
          <div className="flex items-center gap-3">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border bg-card">
              {brand.logoDataUrl ? (
                <img src={brand.logoDataUrl} alt="" className="size-full object-contain p-1" />
              ) : (
                <span className="text-xs text-muted-foreground">Logo</span>
              )}
            </div>
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  saveBrand({ logoDataUrl: await readFileAsDataUrl(file) });
                  toast.success(t("brand.saved"));
                }}
              />
              <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold">
                <Upload className="size-4" />
                {t("onb.uploadLogo")}
              </span>
            </label>
            {brand.logoDataUrl ? (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => saveBrand({ logoDataUrl: null })}
              >
                {t("posts.delete")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="primary">{t("onb.primary")}</Label>
            <input
              id="primary"
              type="color"
              value={brand.primary}
              onChange={(e) => saveBrand({ primary: e.target.value })}
              className="h-11 w-full cursor-pointer rounded-xl border bg-card px-2"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="secondary">{t("onb.secondary")}</Label>
            <input
              id="secondary"
              type="color"
              value={brand.secondary}
              onChange={(e) => saveBrand({ secondary: e.target.value })}
              className="h-11 w-full cursor-pointer rounded-xl border bg-card px-2"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label>{t("brand.font")}</Label>
            <Select value={brand.fontFamily} onValueChange={(v) => saveBrand({ fontFamily: v })}>
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("brand.currency")}</Label>
            <Select
              value={brand.currency}
              onValueChange={(v) => saveBrand({ currency: v as CurrencyCode })}
            >
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("brand.language")}</Label>
            <Select
              value={brand.language}
              onValueChange={(v) => setLanguage(v as LanguageCode)}
            >
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="card-soft grid gap-3 p-4">
        <Label>{t("brand.services")}</Label>
        <div className="grid gap-2">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <Input
                defaultValue={s.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== s.name) renameService(s.id, v);
                }}
                className="h-10 rounded-xl"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 rounded-xl"
                aria-label={t("posts.delete")}
                onClick={() => removeService(s.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            placeholder={t("create.addService")}
            className="h-10 rounded-xl"
          />
          <Button
            variant="outline"
            className="h-10 shrink-0 rounded-xl"
            onClick={() => {
              const v = newService.trim();
              if (!v) return;
              addService(v);
              setNewService("");
            }}
          >
            {t("onb.addService")}
          </Button>
        </div>
      </div>
    </div>
  );
}
