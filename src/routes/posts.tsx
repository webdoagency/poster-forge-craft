import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/rafty/AppShell";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { Button } from "@/components/ui/button";
import { downloadNode, slugify } from "@/lib/rafty/download";
import { useRafty } from "@/lib/rafty/store";
import { getTemplate } from "@/lib/rafty/templates";

export const Route = createFileRoute("/posts")({
  head: () => ({
    meta: [
      { title: "Saved posts — RAFTY" },
      { name: "description", content: "Every branded post you saved, ready to download again." },
      { property: "og:title", content: "Saved posts — RAFTY" },
      { property: "og:description", content: "Your saved branded social posts in one place." },
    ],
  }),
  component: PostsPage,
});

function PostsPage() {
  const { posts, brand, deletePost } = useRafty();
  const nodes = useRef(new Map<string, HTMLDivElement | null>());
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (id: string, title: string) => {
    const node = nodes.current.get(id);
    if (!node) return;
    setBusy(id);
    try {
      await downloadNode(node, slugify(title));
    } catch {
      toast.error("Download failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">Posts</h1>
        <p className="text-sm text-muted-foreground">{posts.length} saved</p>
      </div>

      {posts.length === 0 ? (
        <div className="card-soft flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          <Button asChild className="brand-gradient rounded-xl">
            <Link to="/">Create your first post</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="card-soft overflow-hidden">
              <div className="p-2">
                <PostCanvas
                  ref={(el) => {
                    nodes.current.set(post.id, el);
                  }}
                  templateId={post.templateId}
                  fields={post.fields}
                  brand={brand}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 px-4 pb-4 pt-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{post.fields.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getTemplate(post.templateId).name} ·{" "}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 gap-1">
                  <Button asChild size="icon" variant="ghost" aria-label="Open">
                    <Link to="/" search={{ post: post.id }}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={busy === post.id}
                    onClick={() => download(post.id, post.fields.title)}
                    aria-label="Download"
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deletePost(post.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
