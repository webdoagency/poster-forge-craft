import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Plus, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/rafty/AppShell";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { AdjustControls } from "@/components/rafty/AdjustControls";
import { ShareActions } from "@/components/rafty/ShareActions";
import { useRafty } from "@/lib/rafty/store";
import { generateCaption } from "@/lib/rafty/caption";
import { readFileAsDataUrl } from "@/lib/rafty/file";
import { CTA_PRESETS, OCCASION_PRESETS, TYPE_FIELDS } from "@/lib/rafty/constants";
import { emptyContent, type Post, type PostAdjustments, type PostContent } from "@/lib/rafty/types";
import { id as newId } from "@/lib/rafty/repo";

export const Route = createFileRoute("/_authenticated/create")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { post?: string; template?: string; duplicate?: boolean } => {
    const out: { post?: string; template?: string; duplicate?: boolean } = {};
    if (typeof search["post"] === "string") out.post = search["post"];
    if (typeof search["template"] === "string") out.template = search["template"];
    if (search["duplicate"] === "1" || search["duplicate"] === true) out.duplicate = true;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Create a post | Rafty" },
      {
        name: "description",
        content: "Upload one image, add a few details and generate a branded post in seconds.",
      },
      { property: "og:title", content: "Create a post | Rafty" },
      { property: "og:description", content: "One image in, a finished branded post out." },
    ],
  }),
  component: () => (
    <AppShell>
      <CreatePage />
    </AppShell>
  ),
});

function CreatePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const {
    business,
    brand,
    services,
    posts,
    templates,
    trial,
    canCreatePost,
    createPost,
    addService,
    t,
  } = useRafty();

  const existing = search.post ? posts.find((p) => p.id === search.post) : undefined;
  const isDuplicate = !!existing && !!search.duplicate;

  const [templateId, setTemplateId] = useState<string>(
    existing?.templateId ?? search.template ?? templates[0]?.id ?? "",
  );
  const [content, setContent] = useState<PostContent>(existing?.content ?? emptyContent);
  const [showBrandName, setShowBrandName] = useState<boolean>(
    isDuplicate ? existing!.showBrandName : existing?.showBrandName ?? brand?.showBrandName ?? false,
  );
  const [adjustments, setAdjustments] = useState<PostAdjustments>(
    isDuplicate ? {} : existing?.adjustments ?? {},
  );
  const [postId, setPostId] = useState<string | null>(isDuplicate ? null : existing?.id ?? null);
  const [generated, setGenerated] = useState(Boolean(existing) && !isDuplicate);
  const [showAdjust, setShowAdjust] = useState(false);
  const [newService, setNewService] = useState("");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const template = useMemo(
    () => templates.find((x) => x.id === templateId) ?? templates[0],
    [templates, templateId],
  );

  if (!business || !brand || !template) return null;

  const fields = TYPE_FIELDS[business.type];
  const set = (patch: Partial<PostContent>) => setContent((prev) => ({ ...prev, ...patch }));
  const trialLeft = Math.max(0, (trial?.freePostLimit ?? 1) - (trial?.postsCreated ?? 0));
  const locked = !canCreatePost && !postId;

  async function onImage(file: File) {
    set({ imageDataUrl: await readFileAsDataUrl(file) });
  }

  function refreshCaption(seed = Date.now()) {
    set({
      caption: generateCaption({
        content,
        businessType: business!.type,
        businessName: business!.name,
        currency: brand!.currency,
        instructions: brand!.instructions,
        services: content.services,
        seed,
      }),
    });
  }

  function applyOccasion(occasionId: string) {
    const preset = OCCASION_PRESETS.find((o) => o.id === occasionId);
    if (!preset) return;
    set({
      title: content.title || preset.title,
      additionalText: content.additionalText || preset.extra,
    });
  }

  function generate() {
    if (locked) {
      toast.error(t("create.trialUsed"));
      return;
    }
    const caption = generateCaption({
      content,
      businessType: business!.type,
      businessName: business!.name,
      currency: brand!.currency,
      instructions: brand!.instructions,
      services: content.services,
      seed: Date.now(),
    });
    set({ caption });
    setGenerated(true);
    setShowAdjust(false);
  }

  async function persist() {
    setSaving(true);
    try {
      const post: Post = {
        id: postId ?? newId("post"),
        businessId: business!.id,
        templateId: template!.id,
        content,
        showBrandName,
        adjustments,
        shareStatus: {},
        createdAt: new Date().toISOString(),
      };
      const saved = await createPost(post);
      if (saved) {
        setPostId(saved.id);
        toast.success(t("create.saved"));
      } else {
        toast.error("Could not save the post. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    setPostId(null);
    setContent(emptyContent);
    setShowBrandName(brand!.showBrandName);
    setAdjustments({});
    setGenerated(false);
    setShowAdjust(false);
    navigate({ to: "/create", search: {} });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section className={`flex flex-col gap-4 ${generated ? "order-2 lg:order-1" : ""}`}>
        <div>
          <h1 className="font-display text-2xl font-extrabold">{t("create.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {business.status === "approved"
              ? business.name
              : `${t(`status.${business.status}`)} | ${t("trial.remaining")}: ${trialLeft}`}
          </p>
        </div>

        {locked ? (
          <div className="card-soft p-4 text-sm">
            <p className="font-semibold">{t("create.trialUsed")}</p>
            <Button asChild variant="outline" size="sm" className="mt-3 rounded-xl">
              <Link to="/brand">{t("brand.title")}</Link>
            </Button>
          </div>
        ) : null}

        <div className="card-soft flex flex-col gap-4 p-4">
          <Label>{t("create.image")}</Label>
          <label className="relative block cursor-pointer overflow-hidden rounded-xl border border-dashed bg-card">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImage(file);
              }}
            />
            {content.imageDataUrl ? (
              <img src={content.imageDataUrl} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="size-6" />
                <span className="text-sm font-semibold">{t("create.upload")}</span>
              </div>
            )}
          </label>

          <div className="grid gap-2">
            <Label>Occasion</Label>
            <div className="flex flex-wrap gap-2">
              {OCCASION_PRESETS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => applyOccasion(o.id)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label htmlFor={f.key}>{t(f.labelKey)}</Label>
                <Input
                  id={f.key}
                  value={content[f.key]}
                  onChange={(e) => set({ [f.key]: e.target.value } as Partial<PostContent>)}
                  className="h-11 rounded-xl"
                />
              </div>
            ))}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="additional">{t("create.additional")}</Label>
            <Input
              id="additional"
              value={content.additionalText}
              onChange={(e) => set({ additionalText: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cta">Call to action</Label>
            <Input
              id="cta"
              value={content.cta}
              onChange={(e) => set({ cta: e.target.value })}
              placeholder="Send us a message"
              className="h-11 rounded-xl"
            />
            <div className="flex flex-wrap gap-2">
              {CTA_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => set({ cta: preset })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    content.cta === preset
                      ? "border-primary bg-primary-soft text-accent-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("create.services")}</Label>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => {
                const active = content.services.includes(s.name);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      set({
                        services: active
                          ? content.services.filter((x) => x !== s.name)
                          : [...content.services, s.name],
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                      active ? "border-primary bg-primary-soft text-accent-foreground" : "border-border bg-card"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder={t("create.addService")}
                className="h-10 rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 shrink-0 rounded-xl"
                aria-label={t("create.addService")}
                onClick={() => {
                  const v = newService.trim();
                  if (!v) return;
                  addService(v);
                  set({ services: [...content.services, v] });
                  setNewService("");
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold">Show brand name</p>
              <p className="text-xs text-muted-foreground">Off by default on the generated post.</p>
            </div>
            <Switch checked={showBrandName} onCheckedChange={setShowBrandName} />
          </div>

          {generated ? (
            <div className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="caption">{t("create.caption")}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-8 rounded-lg"
                  onClick={() => refreshCaption()}
                >
                  <Wand2 className="mr-1 size-3.5" />
                  Regenerate
                </Button>
              </div>
              <Textarea
                id="caption"
                value={content.caption}
                onChange={(e) => set({ caption: e.target.value })}
                rows={6}
                className="rounded-xl"
              />
            </div>
          ) : null}
        </div>

        {generated ? (
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => setShowAdjust((v) => !v)}>
            {showAdjust ? "Hide adjust" : "Adjust"}
          </Button>
        ) : null}

        {generated && showAdjust ? (
          <AdjustControls adjustments={adjustments} onChange={setAdjustments} />
        ) : null}
      </section>

      <section className={`flex flex-col gap-4 ${generated ? "order-1 lg:order-2" : ""}`}>
        <div className="flex items-center gap-3">
          <Label className="shrink-0">{t("create.template")}</Label>
          <Select value={template.id} onValueChange={setTemplateId}>
            <SelectTrigger className="rounded-xl bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {templates.map((x) => (
                <SelectItem key={x.id} value={x.id}>
                  {x.name}
                  {x.scope === "custom" ? " (custom)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="card-soft mx-auto w-full max-w-[520px] overflow-hidden p-2">
          <PostCanvas
            ref={canvasRef}
            template={template}
            content={content}
            brand={brand}
            businessName={business.name}
            businessType={business.type}
            showBrandName={showBrandName}
            adjustments={adjustments}
            className="rounded-xl"
          />
        </div>

        <div className="mx-auto w-full max-w-[520px]">
          {generated ? (
            <ShareActions
              canvasRef={canvasRef}
              filename={content.title || business.name}
              caption={content.caption}
              onSave={persist}
              saving={saving}
              saveLabel={t("create.saved").includes("saved") ? "Save" : "Save"}
            />
          ) : (
            <Button className="h-12 w-full rounded-xl" onClick={generate} disabled={locked}>
              <Sparkles className="mr-1 size-4" />
              {t("create.generate")}
            </Button>
          )}
        </div>

        {generated ? (
          <button
            className="mx-auto text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
            onClick={resetAll}
          >
            Create a new post
          </button>
        ) : null}
      </section>
    </div>
  );
}
