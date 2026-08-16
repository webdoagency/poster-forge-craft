import { useEffect, useMemo, useRef, useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { placeholderContent } from "@/lib/rafty/placeholder";
import { useRafty } from "@/lib/rafty/store";
import type { BrandProfile, BusinessType, ContentFormat, Template } from "@/lib/rafty/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "favorites" | "used";

/** Renders its child only once it is close to the viewport, so a long library
 * never renders a hundred live canvases at the same time. */
function Lazy({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
      },
      { rootMargin: "300px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="w-full">
      {visible ? children : <div className="aspect-[4/5] w-full rounded-lg bg-muted" />}
    </div>
  );
}

/**
 * Visual template chooser. Opens over the Create page, so the draft in the
 * form is never lost: picking a template only changes the selected id.
 */
export function TemplatePicker({
  templates,
  value,
  onSelect,
  brand,
  businessType,
  businessName,
  format,
}: {
  templates: Template[];
  value: string;
  onSelect: (templateId: string) => void;
  brand: BrandProfile;
  businessType: BusinessType;
  businessName: string;
  format: ContentFormat;
}) {
  const { favorites, templateUsage, toggleFavorite } = useRafty();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const content = useMemo(() => placeholderContent(businessType), [businessType]);
  const selected = templates.find((x) => x.id === value) ?? templates[0];

  const list = useMemo(() => {
    if (filter === "favorites") return templates.filter((x) => favorites.includes(x.id));
    if (filter === "used")
      return templates
        .filter((x) => (templateUsage[x.id] ?? 0) > 0)
        .sort((a, b) => (templateUsage[b.id] ?? 0) - (templateUsage[a.id] ?? 0));
    return templates;
  }, [templates, filter, favorites, templateUsage]);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "favorites", label: "Favourites" },
    { key: "used", label: "Most used" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2 text-left transition hover:border-primary/60"
        >
          <span className="w-12 shrink-0 overflow-hidden rounded-lg">
            {selected ? (
              <PostCanvas
                template={selected}
                content={content}
                brand={brand}
                businessName={businessName}
                businessType={businessType}
                format={format}
              />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {selected?.name ?? "Choose a template"}
            </span>
            <span className="block text-xs text-muted-foreground">Tap to change template</span>
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">Templates</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 px-4 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                filter === tab.key
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-[62vh] overflow-y-auto px-4 pb-4 pt-3">
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {filter === "favorites"
                ? "No favourites yet. Tap the star on a template."
                : "No templates used yet."}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {list.map((tpl) => (
                <div key={tpl.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(tpl.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "block w-full overflow-hidden rounded-lg border p-1 text-left transition",
                      tpl.id === value ? "border-primary ring-2 ring-primary/40" : "border-border",
                    )}
                  >
                    <Lazy>
                      <PostCanvas
                        template={tpl}
                        content={content}
                        brand={brand}
                        businessName={businessName}
                        businessType={businessType}
                        format={format}
                        className="rounded-md"
                      />
                    </Lazy>
                    <span className="mt-1 block truncate text-[11px] font-semibold">
                      {tpl.name}
                      {tpl.scope === "custom" ? " • yours" : ""}
                    </span>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Favourite"
                    className="absolute right-1 top-1 size-7 rounded-full bg-background/80"
                    onClick={() => void toggleFavorite(tpl.id)}
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        favorites.includes(tpl.id) ? "fill-primary text-primary" : "text-muted-foreground",
                      )}
                    />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
