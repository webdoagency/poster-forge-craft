import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/rafty/AppShell";
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
import { useRafty } from "@/lib/rafty/store";

export const Route = createFileRoute("/brand")({
  head: () => ({
    meta: [
      { title: "Brand kit — RAFTY" },
      {
        name: "description",
        content: "Logo, brand colors, font and included services applied to every generated post.",
      },
      { property: "og:title", content: "Brand kit — RAFTY" },
      { property: "og:description", content: "Keep every post on brand: logo, colors, font, services." },
    ],
  }),
  component: BrandPage,
});

const fonts = ["Sora", "Plus Jakarta Sans"];

function BrandPage() {
  const { brand, saveBrand } = useRafty();
  const [service, setService] = useState("");

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      saveBrand({ logoDataUrl: String(reader.result) });
      toast.success("Logo updated");
    };
    reader.readAsDataURL(file);
  };

  const addService = () => {
    const value = service.trim();
    if (!value || brand.services.includes(value)) return;
    saveBrand({ services: [...brand.services, value] });
    setService("");
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Brand</h1>
        <p className="text-sm text-muted-foreground">Applied to every template automatically.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card-soft space-y-5 p-5">
          <div className="space-y-1.5">
            <Label>Business name</Label>
            <Input
              value={brand.businessName}
              onChange={(e) => saveBrand({ businessName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border bg-secondary">
                {brand.logoDataUrl ? (
                  <img src={brand.logoDataUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-sm font-black text-muted-foreground">
                    {brand.businessName.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="cursor-pointer rounded-xl border bg-card px-3 py-2 text-sm font-semibold hover:bg-accent">
                Upload logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onLogo(e.target.files?.[0])}
                />
              </label>
              {brand.logoDataUrl ? (
                <Button variant="ghost" size="sm" onClick={() => saveBrand({ logoDataUrl: null })}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Primary"
              value={brand.primary}
              onChange={(v) => saveBrand({ primary: v })}
            />
            <ColorField
              label="Secondary"
              value={brand.secondary}
              onChange={(v) => saveBrand({ secondary: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Font</Label>
            <Select value={brand.fontFamily} onValueChange={(v) => saveBrand({ fontFamily: v })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="card-soft space-y-4 p-5">
          <div>
            <Label>Included services</Label>
            <p className="text-xs text-muted-foreground">Selectable when creating a post.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {brand.services.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 rounded-full border bg-primary-soft px-3 py-1.5 text-xs font-semibold text-accent-foreground"
              >
                {s}
                <button
                  onClick={() => saveBrand({ services: brand.services.filter((x) => x !== s) })}
                  aria-label={`Remove ${s}`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={service}
              onChange={(e) => setService(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addService()}
              placeholder="Add a service"
            />
            <Button onClick={addService} variant="outline" className="shrink-0 gap-1.5 rounded-xl">
              <Plus className="size-4" /> Add
            </Button>
          </div>

          <div className="rounded-xl border p-4">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">Preview</p>
            <div
              className="rounded-xl p-5 text-primary-foreground"
              style={{
                backgroundImage: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`,
                fontFamily: `"${brand.fontFamily}", sans-serif`,
              }}
            >
              <p className="text-lg font-extrabold">{brand.businessName}</p>
              <p className="text-sm opacity-85">Aa — headline &amp; body preview</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-xl border bg-card px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={`${label} color`}
        />
        <span className="text-sm font-semibold uppercase">{value}</span>
      </div>
    </div>
  );
}
