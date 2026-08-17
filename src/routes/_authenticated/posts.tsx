import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CalendarClock, Clipboard, Copy, Download, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/rafty/AppShell";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { useRafty } from "@/lib/rafty/store";
import { downloadNode, slugify } from "@/lib/rafty/download";
import { id as newId } from "@/lib/rafty/repo";
import type { Post } from "@/lib/rafty/types";

export const Route = createFileRoute("/_authenticated/posts")({
  head: () => ({
    meta: [
      { title: "Your posts | krijo24" },
      { name: "description", content: "Every post your business created, ready to reopen or download." },
      { property: "og:title", content: "Your posts | krijo24" },
      { property: "og:description", content: "Reopen, edit or download your saved posts." },
    ],
  }),
  component: () => (
    <AppShell>
      <PostsPage />
    </AppShell>
  ),
});

function PostsPage() {
  const { business, brand, posts, templates, removePost, createPost, t } = useRafty();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const canvasRefs = useRef(new Map<string, HTMLDivElement>());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) => p.content.title.toLowerCase().includes(q) || p.content.caption.toLowerCase().includes(q),
    );
  }, [posts, query]);

  if (!business || !brand) return null;

  async function handleDownload(post: Post) {
    const node = canvasRefs.current.get(post.id);
    if (!node) return;
    await downloadNode(node, slugify(post.content.title || "krijo24-post"));
  }

  async function handleCopyCaption(post: Post) {
    if (!post.content.caption) {
      toast.error("This post has no caption yet.");
      return;
    }
    await navigator.clipboard.writeText(post.content.caption);
    toast.success("Caption copied.");
  }

  async function handleDuplicate(post: Post) {
    if (!business) return;
    const duplicated: Post = {
      ...post,
      id: newId("post"),
      imagePath: null,
      content: { ...post.content, imageDataUrl: post.content.imageDataUrl },
      createdAt: new Date().toISOString(),
      shareStatus: {},
    };
    const saved = await createPost(duplicated);
    if (!saved) {
      toast.error("Could not duplicate the post.");
      return;
    }
    toast.success("Post duplicated.");
    navigate({ to: "/create", search: { post: saved.id, duplicate: "true" } as never });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">{t("posts.title")}</h1>
          <p className="text-sm text-muted-foreground">{business.name}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-xl bg-card pl-9"
          />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="card-soft p-6 text-sm text-muted-foreground">{t("posts.empty")}</div>
      ) : filtered.length === 0 ? (
        <div className="card-soft p-6 text-sm text-muted-foreground">No posts match this search.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((post) => {
            const template = templates.find((x) => x.id === post.templateId) ?? templates[0];
            if (!template) return null;
            return (
              <article key={post.id} className="card-soft overflow-hidden">
                <div className="p-2">
                  <div
                    ref={(node) => {
                      if (node) canvasRefs.current.set(post.id, node);
                      else canvasRefs.current.delete(post.id);
                    }}
                  >
                    <PostCanvas
                      template={template}
                      content={post.slides?.[0]?.content ?? post.content}
                      brand={brand}
                      businessName={business.name}
                      businessType={business.type}
                      showBrandName={post.showBrandName}
                      showContact={post.showContact ?? false}
                      adjustments={post.slides?.[0]?.adjustments ?? post.adjustments}
                      format={post.format ?? "post"}
                      className="rounded-xl"
                    />

                  </div>
                </div>
                <div className="px-4 pb-2 pt-1">
                  <p className="truncate text-sm font-bold">{post.content.title || "Untitled"}</p>
                  <p className="truncate text-xs text-muted-foreground">{template.name}</p>
                  {post.content.caption ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.content.caption}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-1">
                  <Button asChild size="icon" variant="outline" className="size-9 shrink-0 rounded-xl">
                    <Link to="/create" search={{ post: post.id }} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-9 shrink-0 rounded-xl"
                    aria-label="Duplicate"
                    onClick={() => void handleDuplicate(post)}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-9 shrink-0 rounded-xl"
                    aria-label="Copy caption"
                    onClick={() => void handleCopyCaption(post)}
                  >
                    <Clipboard className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-9 shrink-0 rounded-xl"
                    aria-label="Download"
                    onClick={() => void handleDownload(post)}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button asChild size="icon" variant="outline" className="size-9 shrink-0 rounded-xl">
                    <Link to="/schedule" aria-label="Schedule">
                      <CalendarClock className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto size-9 shrink-0 rounded-xl"
                    aria-label={t("posts.delete")}
                    onClick={() => removePost(post.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
