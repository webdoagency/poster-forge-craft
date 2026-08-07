import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, Image as ImageIcon, Plus, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useRafty } from "@/lib/rafty/store";
import { generateCaption } from "@/lib/rafty/caption";
import { downloadNode, slugify } from "@/lib/rafty/download";
import { readFileAsDataUrl } from "@/lib/rafty/file";
import { TYPE_FIELDS } from "@/lib/rafty/constants";
import { emptyContent, type Post, type PostContent } from "@/lib/rafty/types";
import { id as newId } from "@/lib/rafty/repo";

export const Route = createFileRoute("/_authenticated/create")({
  validateSearch: (search: Record<string, unknown>) => ({
    post: typeof search["post"] === "string" ? (search["post"] as string) : undefined,
    template: typeof search["template"] === "string" ? (search["template"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create a post | Rafty Content" },
      {
        name: "description",
        content: "Upload one image, add a few details and generate a branded post in seconds.",
      },
      { property: "og:title", content: "Create a post | Rafty Content" },
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

  const [templateId, setTemplateId] = useState<string>(
    existing?.templateId ?? search.template ?? templates[0]?.id ?? "",
  );
  const [content, setContent] = useState<PostContent>(existing?.content ?? emptyContent);
  const [postId, setPostId] = useState<string | null>(existing?.id ?? null);
  const [generated, setGenerated] = useState(Boolean(existing));
  const [newService, setNewService] = useState("");
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

  function writeCaption() {
    set({
      caption: generateCaption(content, business!.type, business!.name, brand!.currency, Date.now()),
    });
  }

  function generate() {
    if (locked) {
      toast.error(t("create.trialUsed"));
      return;
    }
    const post: Post = {
      id: postId ?? newId("post"),
      businessId: business!.id,
      templateId: template!.id,
      content,
      createdAt: new Date().toISOString(),
    };
    createPost(post);
    setPostId(post.id);
    setGenerated(true);
    toast.success(t("create.saved"));
  }

  async function download() {
    if (!canvasRef.current) return;
    try {
      await downloadNode(canvasRef.current, slugify(content.title || business!.name));
    } catch {
      toast.error("Download failed. Please try again.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section className="flex flex-col gap-4">
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

          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="caption">{t("create.caption")}</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-auto h-8 rounded-lg"
                onClick={writeCaption}
              >
                <Wand2 className="mr-1 size-3.5" />
                {t("create.write")}
              </Button>
            </div>
            <Textarea
              id="caption"
              value={content.caption}
              onChange={(e) => set({ caption: e.target.value })}
              rows={5}
              className="rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
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
            className="rounded-xl"
          />
        </div>

        <div className="mx-auto flex w-full max-w-[520px] gap-2">
          {generated ? (
            <>
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-xl"
                onClick={() => setGenerated(false)}
              >
                {t("create.edit")}
              </Button>
              <Button className="h-12 flex-1 rounded-xl" onClick={download}>
                <Download className="mr-1 size-4" />
                {t("create.download")}
              </Button>
            </>
          ) : (
            <Button className="h-12 flex-1 rounded-xl" onClick={generate} disabled={locked}>
              <Sparkles className="mr-1 size-4" />
              {t("create.generate")}
            </Button>
          )}
        </div>

        {postId ? (
          <button
            className="mx-auto text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setPostId(null);
              setContent(emptyContent);
              setGenerated(false);
              navigate({ to: "/create", search: {} });
            }}
          >
            {t("create.title")}
          </button>
        ) : null}
      </section>
    </div>
  );
}
