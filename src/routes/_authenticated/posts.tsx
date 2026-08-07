import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/rafty/AppShell";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { useRafty } from "@/lib/rafty/store";

export const Route = createFileRoute("/_authenticated/posts")({
  head: () => ({
    meta: [
      { title: "Your posts | Rafty" },
      { name: "description", content: "Every post your business created, ready to reopen or download." },
      { property: "og:title", content: "Your posts | Rafty" },
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
  const { business, brand, posts, templates, removePost, t } = useRafty();
  if (!business || !brand) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">{t("posts.title")}</h1>
        <p className="text-sm text-muted-foreground">{business.name}</p>
      </div>

      {posts.length === 0 ? (
        <div className="card-soft p-6 text-sm text-muted-foreground">{t("posts.empty")}</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const template = templates.find((x) => x.id === post.templateId) ?? templates[0];
            if (!template) return null;
            return (
              <article key={post.id} className="card-soft overflow-hidden">
                <div className="p-2">
                  <PostCanvas
                    template={template}
                    content={post.content}
                    brand={brand}
                    businessName={business.name}
                    businessType={business.type}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 pb-4 pt-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{post.content.title || "Untitled"}</p>
                    <p className="truncate text-xs text-muted-foreground">{template.name}</p>
                  </div>
                  <Button asChild size="icon" variant="outline" className="ml-auto size-9 shrink-0 rounded-xl">
                    <Link to="/create" search={{ post: post.id }} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-9 shrink-0 rounded-xl"
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
