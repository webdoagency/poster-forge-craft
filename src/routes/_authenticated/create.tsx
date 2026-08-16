import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Image as ImageIcon, Plus, Sparkles, Wand2 } from "lucide-react";
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
import { FormatPicker } from "@/components/rafty/FormatPicker";
import { SlideStrip } from "@/components/rafty/SlideStrip";
import { CarouselPreview } from "@/components/rafty/CarouselPreview";
import { StoryboardPreview } from "@/components/rafty/StoryboardPreview";
import { useRafty } from "@/lib/rafty/store";
import { generateCaption } from "@/lib/rafty/caption";
import { readFileAsDataUrl } from "@/lib/rafty/file";
import { recommendedFirst, templatesForFormat } from "@/lib/rafty/templates";
import {
  clampDuration,
  CTA_PRESETS,
  FORMAT_SPECS,
  OCCASION_PRESETS,
  TYPE_FIELDS,
} from "@/lib/rafty/constants";
import {
  emptyContent,
  type ContentFormat,
  type PostAdjustments,
  type PostContent,
  type Slide,
} from "@/lib/rafty/types";
import { id as newId, type PostWithContact } from "@/lib/rafty/repo";

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

/** A fresh frame. Every slide owns its own content object, so no two slides
 * ever share mutable state. */
function newSlide(durationMs?: number): Slide {
  return {
    id: newId("slide"),
    content: { ...emptyContent, services: [] },
    adjustments: {},
    ...(durationMs !== undefined ? { durationMs } : {}),
  };
}

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
    formats,
    canCreatePost,
    createPost,
    addService,
    t,
  } = useRafty();

  const existing = search.post ? posts.find((p) => p.id === search.post) : undefined;
  const isDuplicate = !!existing && !!search.duplicate;

  const [format, setFormat] = useState<ContentFormat>(existing?.format ?? "post");
  const [templateId, setTemplateId] = useState<string>(
    existing?.templateId ?? search.template ?? "",
  );
  const [slides, setSlides] = useState<Slide[]>(() => {
    if (existing?.slides?.length) {
      return existing.slides.map((slide) => ({
        ...slide,
        content: { ...slide.content },
        adjustments: { ...slide.adjustments },
        ...(isDuplicate ? { id: newId("slide"), imagePath: null } : {}),
      }));
    }
    return [
      {
        id: newId("slide"),
        content: existing ? { ...existing.content } : { ...emptyContent, services: [] },
        adjustments: isDuplicate ? {} : { ...(existing?.adjustments ?? {}) },
        ...(isDuplicate ? {} : { imagePath: existing?.imagePath ?? null }),
      },
    ];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [showBrandName, setShowBrandName] = useState<boolean>(
    existing?.showBrandName ?? brand?.showBrandName ?? false,
  );
  const [showContact, setShowContact] = useState<boolean>(existing?.showContact ?? false);
  const [postId, setPostId] = useState<string | null>(isDuplicate ? null : existing?.id ?? null);
  const [generated, setGenerated] = useState(Boolean(existing) && !isDuplicate);
  const [showAdjust, setShowAdjust] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [newService, setNewService] = useState("");

  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const slideNodes = useRef<(HTMLDivElement | null)[]>([]);

  const spec = FORMAT_SPECS[format];
  /** Business type only reorders the list, it never removes a template. */
  const formatTemplates = useMemo(
    () => recommendedFirst(templatesForFormat(templates, format), business?.type ?? "other"),
    [templates, format, business?.type],
  );
  const template = useMemo(
    () => formatTemplates.find((x) => x.id === templateId) ?? formatTemplates[0],
    [formatTemplates, templateId],
  );

  if (!business || !brand || !template) return null;

  const limits = {
    min: template.slides?.min ?? spec.minSlides,
    max: template.slides?.max ?? spec.maxSlides,
  };
  const multi = limits.max > 1;
  const active = slides[Math.min(activeIndex, slides.length - 1)] ?? slides[0]!;
  const content = active.content;
  const fields = TYPE_FIELDS[business.type];
  /** Only the two headline fields stay visible, the rest is optional detail. */
  const primaryFields = fields.slice(0, 2);
  const secondaryFields = fields.slice(2);

  const trialLeft = Math.max(0, (trial?.freePostLimit ?? 1) - (trial?.postsCreated ?? 0));
  const locked = !canCreatePost && !postId;

  /** Patches only the active frame. */
  const set = (patch: Partial<PostContent>) =>
    setSlides((prev) =>
      prev.map((slide, i) =>
        i === activeIndex ? { ...slide, content: { ...slide.content, ...patch } } : slide,
      ),
    );

  const setAdjustments = (next: PostAdjustments) =>
    setSlides((prev) =>
      prev.map((slide, i) => (i === activeIndex ? { ...slide, adjustments: next } : slide)),
    );

  /** Switching format resets the frames to that format's defaults so content
   * from a different shape never leaks into the new one. */
  function changeFormat(next: ContentFormat) {
    const nextSpec = FORMAT_SPECS[next];
    const nextTemplate = templatesForFormat(templates, next)[0];
    setFormat(next);
    setTemplateId(nextTemplate?.id ?? "");
    setSlides(
      Array.from({ length: nextSpec.defaultSlides }, () =>
        newSlide(next === "video" ? nextSpec.defaultDuration : undefined),
      ),
    );
    setActiveIndex(0);
    setPostId(null);
    setGenerated(false);
    setShowAdjust(false);
    slideNodes.current = [];
  }

  async function onImage(file: File) {
    set({ imageDataUrl: await readFileAsDataUrl(file) });
  }

  function captionFor(seed: number) {
    return generateCaption({
      content: slides[0]!.content,
      businessType: business!.type,
      businessName: business!.name,
      currency: brand!.currency,
      instructions: brand!.instructions,
      services: slides[0]!.content.services,
      seed,
    });
  }

  function refreshCaption() {
    const caption = captionFor(Date.now());
    setSlides((prev) =>
      prev.map((slide, i) => (i === 0 ? { ...slide, content: { ...slide.content, caption } } : slide)),
    );
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
    refreshCaption();
    setGenerated(true);
    setShowAdjust(false);
  }

  function setDefaultDuration(ms: number) {
    const value = clampDuration(ms, spec);
    setSlides((prev) => prev.map((slide) => ({ ...slide, durationMs: value })));
  }

  function setCardDuration(index: number, ms: number) {
    setSlides((prev) =>
      prev.map((slide, i) => (i === index ? { ...slide, durationMs: clampDuration(ms, spec) } : slide)),
    );
  }

  function moveSlide(index: number, direction: -1 | 1) {
    setSlides((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const a = next[index]!;
      const b = next[target]!;
      next[index] = b;
      next[target] = a;
      return next;
    });
    slideNodes.current = [];
    setActiveIndex(index + direction);
  }

  function addSlide() {
    if (slides.length >= limits.max) return;
    setSlides((prev) => [
      ...prev,
      newSlide(format === "video" ? spec.defaultDuration : undefined),
    ]);
    setActiveIndex(slides.length);
  }

  function removeSlide(index: number) {
    if (slides.length <= limits.min) return;
    setSlides((prev) => prev.filter((_, i) => i !== index));
    slideNodes.current = [];
    setActiveIndex((prev) => Math.max(0, Math.min(prev, slides.length - 2)));
  }

  async function persist() {
    setSaving(true);
    try {
      const first = slides[0]!;
      const post: PostWithContact = {
        id: postId ?? newId("post"),
        businessId: business!.id,
        templateId: template!.id,
        format,
        content: first.content,
        adjustments: first.adjustments,
        slides: multi ? slides : [],
        ...(multi ? {} : { imagePath: first.imagePath ?? null }),
        showBrandName,
        showContact,
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
    setSlides(
      Array.from({ length: spec.defaultSlides }, () =>
        newSlide(format === "video" ? spec.defaultDuration : undefined),
      ),
    );
    setActiveIndex(0);
    setShowBrandName(brand!.showBrandName);
    setShowContact(false);
    setGenerated(false);
    setShowAdjust(false);
    slideNodes.current = [];
    navigate({ to: "/create", search: {} });
  }

  const frameLabel = format === "video" ? "card" : "slide";

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

        <FormatPicker value={format} onChange={changeFormat} allowed={formats} />

        {locked ? (
          <div className="card-soft p-4 text-sm">
            <p className="font-semibold">{t("create.trialUsed")}</p>
            <Button asChild variant="outline" size="sm" className="mt-3 rounded-xl">
              <Link to="/brand">{t("brand.title")}</Link>
            </Button>
          </div>
        ) : null}

        {multi ? (
          <SlideStrip
            slides={slides}
            activeIndex={activeIndex}
            format={format}
            spec={spec}
            limits={limits}
            onSelect={setActiveIndex}
            onMove={moveSlide}
            onAdd={addSlide}
            onRemove={removeSlide}
            onDuration={setCardDuration}
          />
        ) : null}

        {format === "video" ? (
          <div className="card-soft flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold">Time per card</p>
              <p className="text-xs text-muted-foreground">
                Sets every card, then fine tune single cards above.
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-xl"
                aria-label="Shorter cards"
                onClick={() => setDefaultDuration((active.durationMs ?? spec.defaultDuration) - 500)}
              >
                -
              </Button>
              <span className="w-14 text-center text-sm font-semibold">
                {((active.durationMs ?? spec.defaultDuration) / 1000).toFixed(1)}s
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-xl"
                aria-label="Longer cards"
                onClick={() => setDefaultDuration((active.durationMs ?? spec.defaultDuration) + 500)}
              >
                +
              </Button>
            </div>
          </div>
        ) : null}

        <div className="card-soft flex flex-col gap-4 p-4">
          <Label>
            {t("create.image")}
            {multi ? ` (${frameLabel} ${activeIndex + 1})` : ""}
          </Label>
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

          <div className="grid gap-3 sm:grid-cols-2">
            {primaryFields.map((f) => (
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

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            {moreOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            More details (optional)
          </button>

          {moreOpen ? (
            <div className="grid gap-4 border-t pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {secondaryFields.map((f) => (
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

              <div className="grid gap-2">
                <Label>{t("create.services")}</Label>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => {
                    const isOn = content.services.includes(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          set({
                            services: isOn
                              ? content.services.filter((x) => x !== s.name)
                              : [...content.services, s.name],
                          })
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                          isOn ? "border-primary bg-primary-soft text-accent-foreground" : "border-border bg-card"
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
                  <p className="text-xs text-muted-foreground">Off by default on the generated design.</p>
                </div>
                <Switch checked={showBrandName} onCheckedChange={setShowBrandName} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">Show contact info</p>
                  <p className="text-xs text-muted-foreground">
                    Uses the contact details saved in your brand settings.
                  </p>
                </div>
                <Switch checked={showContact} onCheckedChange={setShowContact} />
              </div>
            </div>
          ) : null}


          {generated ? (
            <div className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="caption">{t("create.caption")}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-8 rounded-lg"
                  onClick={refreshCaption}
                >
                  <Wand2 className="mr-1 size-3.5" />
                  Regenerate
                </Button>
              </div>
              <Textarea
                id="caption"
                value={slides[0]!.content.caption}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev.map((slide, i) =>
                      i === 0 ? { ...slide, content: { ...slide.content, caption: e.target.value } } : slide,
                    ),
                  )
                }
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
          <AdjustControls adjustments={active.adjustments} onChange={setAdjustments} />
        ) : null}
      </section>

      <section className={`flex flex-col gap-4 ${generated ? "order-1 lg:order-2" : ""}`}>
        <div className="mx-auto w-full max-w-[520px]">
          <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
            {t("create.template")}
          </Label>
          <TemplatePicker
            templates={formatTemplates}
            value={template.id}
            onSelect={setTemplateId}
            brand={brand}
            businessType={business.type}
            businessName={business.name}
            format={format}
          />
        </div>


        <div className="mx-auto w-full max-w-[520px]">
          {format === "carousel" ? (
            <CarouselPreview
              slides={slides}
              template={template}
              brand={brand}
              businessName={business.name}
              businessType={business.type}
              showBrandName={showBrandName}
              showContact={showContact}
              format={format}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              nodesRef={slideNodes}
            />
          ) : format === "video" ? (
            <StoryboardPreview
              slides={slides}
              template={template}
              brand={brand}
              businessName={business.name}
              businessType={business.type}
              showBrandName={showBrandName}
              showContact={showContact}
              spec={spec}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            />
          ) : (
            <div
              className={`card-soft mx-auto overflow-hidden p-2 ${format === "story" ? "max-w-[320px]" : ""}`}
            >
              <PostCanvas
                ref={canvasRef}
                template={template}
                content={content}
                brand={brand}
                businessName={business.name}
                businessType={business.type}
                showBrandName={showBrandName}
                showContact={showContact}
                adjustments={active.adjustments}
                format={format}
                className="rounded-xl"
              />
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-[520px]">
          {generated ? (
            <ShareActions
              canvasRef={canvasRef}
              filename={slides[0]!.content.title || business.name}
              caption={slides[0]!.content.caption}
              onSave={persist}
              saving={saving}
              size={{ width: spec.width, height: spec.height }}
              {...(format === "carousel" ? { slideNodes } : {})}
              exportable={spec.exportable}
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
            Start something new
          </button>
        ) : null}
      </section>
    </div>
  );
}
