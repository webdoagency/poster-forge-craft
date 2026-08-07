import { useCallback, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, ImagePlus, Save, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/rafty/AppShell";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCaption } from "@/lib/rafty/caption";
import { downloadNode, slugify } from "@/lib/rafty/download";
import { useRafty } from "@/lib/rafty/store";
import { templates } from "@/lib/rafty/templates";
import { emptyFields, type PostFields } from "@/lib/rafty/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Create a branded post — RAFTY" },
      {
        name: "description",
        content:
          "Upload one image, add your offer details and generate an on-brand social post in seconds with RAFTY.",
      },
      { property: "og:title", content: "Create a branded post — RAFTY" },
      {
        property: "og:description",
        content: "Branded social posts from one image and a few details. Templates control the design.",
      },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { brand, addPost, tenant } = useRafty();
  const [fields, setFields] = useState<PostFields>({ ...emptyFields, business: brand.businessName });
  const [templateId, setTemplateId] = useState(templates[0]!.id);
  const [generated, setGenerated] = useState(false);
  const [captionSeed, setCaptionSeed] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const set = useCallback(
    <K extends keyof PostFields>(key: K, value: PostFields[K]) =>
      setFields((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const business = fields.business || brand.businessName;
  const preview = useMemo(() => ({ ...fields, business }), [fields, business]);

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("imageDataUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const toggleService = (service: string) =>
    setFields((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));

  const writeCaption = () => {
    set("caption", generateCaption({ ...fields, business }, captionSeed));
    setCaptionSeed((s) => s + 1);
    toast.success("Caption written");
  };

  const generate = () => {
    if (!fields.imageDataUrl) {
      toast.error("Add one image first");
      return;
    }
    if (!fields.title.trim()) {
      toast.error("Add a title");
      return;
    }
    setGenerated(true);
    toast.success("Post generated");
  };

  const save = () => {
    addPost({
      id: `p_${Date.now()}`,
      tenantId: tenant.id,
      templateId,
      fields: { ...fields, business },
      createdAt: new Date().toISOString(),
    });
    toast.success("Saved to Posts");
  };

  const download = async () => {
    if (!canvasRef.current) return;
    try {
      await downloadNode(canvasRef.current, slugify(fields.title || "rafty-post"));
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        {/* Form */}
        <section className="card-soft order-2 min-w-0 space-y-5 p-5 lg:order-1 lg:sticky lg:top-24">
          <div>
            <h1 className="font-display text-xl font-extrabold">Create post</h1>
            <p className="text-sm text-muted-foreground">One image, a few details.</p>
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            {fields.imageDataUrl ? (
              <div className="relative overflow-hidden rounded-xl border">
                <img src={fields.imageDataUrl} alt="" className="h-28 w-full object-cover" />
                <button
                  onClick={() => set("imageDataUrl", null)}
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg bg-background/85 backdrop-blur"
                  aria-label="Remove image"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-secondary/60 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                <ImagePlus className="size-5" />
                Upload one image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onUpload(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="grid gap-3">
            <Field label="Offer / Title">
              <Input
                value={fields.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="7 Nights in Paradise"
              />
            </Field>
            <Field label="Destination">
              <Input
                value={fields.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder="Maldives"
              />
            </Field>
            <Field label="Business / Product">
              <Input
                value={fields.business}
                onChange={(e) => set("business", e.target.value)}
                placeholder={brand.businessName}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price" optional>
                <Input
                  value={fields.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="€1,290"
                />
              </Field>
              <Field label="Date / Month" optional>
                <Input
                  value={fields.date}
                  onChange={(e) => set("date", e.target.value)}
                  placeholder="September"
                />
              </Field>
            </div>
            <Field label="Additional text" optional>
              <Input
                value={fields.additionalText}
                onChange={(e) => set("additionalText", e.target.value)}
                placeholder="Limited seats"
              />
            </Field>
          </div>

          {brand.services.length ? (
            <div className="space-y-2">
              <Label>
                Included services <span className="text-muted-foreground">· optional</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {brand.services.map((s) => {
                  const active = fields.services.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleService(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-primary bg-primary-soft text-accent-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Caption <span className="text-muted-foreground">· optional</span>
              </Label>
              <Button variant="ghost" size="sm" onClick={writeCaption} className="h-7 gap-1.5 px-2 text-primary">
                <Wand2 className="size-3.5" /> AI write
              </Button>
            </div>
            <Textarea
              value={fields.caption}
              onChange={(e) => set("caption", e.target.value)}
              placeholder="AI writes text only — never the layout."
              rows={4}
            />
          </div>

          <Button onClick={generate} className="brand-gradient w-full gap-2 rounded-xl py-6 text-base font-bold shadow-[var(--shadow-lift)]">
            <Sparkles className="size-4" /> Generate post
          </Button>
        </section>

        {/* Preview */}
        <section className="order-1 min-w-0 space-y-4 lg:order-2">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition-all ${
                  templateId === t.id
                    ? "border-primary bg-card shadow-[var(--shadow-soft)]"
                    : "bg-card/60 hover:bg-card"
                }`}
              >
                <span className="block text-sm font-bold">{t.name}</span>
                <span className="block text-[11px] text-muted-foreground">{t.vibe}</span>
              </button>
            ))}
          </div>

          <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border bg-card p-2 shadow-[var(--shadow-lift)] lg:max-w-[560px]">
            <PostCanvas
              ref={canvasRef}
              templateId={templateId}
              fields={preview}
              brand={brand}
              className="rounded-2xl"
            />
          </div>

          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3 lg:max-w-[560px]">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={save} disabled={!generated} className="gap-2 rounded-xl">
                <Save className="size-4" /> Save
              </Button>
              <Button variant="outline" onClick={download} disabled={!generated} className="gap-2 rounded-xl">
                <Download className="size-4" /> Download
              </Button>
            </div>
            {fields.caption ? (
              <div className="card-soft p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {fields.caption}
                </p>
              </div>
            ) : null}
            {!generated ? (
              <p className="text-center text-xs text-muted-foreground">
                Generate to save or download. Templates control the layout.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {optional ? <span className="text-muted-foreground">· optional</span> : null}
      </Label>
      {children}
    </div>
  );
}
