import { useMemo, useState } from "react";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { demoPosts } from "@/lib/rafty/demo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACCENTS = [
  { name: "Violet", primary: "#5b4bff", secondary: "#c05cf6" },
  { name: "Ember", primary: "#d9481f", secondary: "#f0a04b" },
  { name: "Forest", primary: "#1f6d4a", secondary: "#79c48f" },
  { name: "Ink", primary: "#1a1a1a", secondary: "#5b5b5b" },
];

/**
 * A tightly scoped interactive preview: visitors can only change the
 * headline text and the accent color. Everything else stays fixed so it
 * reads as a taste of Rafty, not a full editor.
 */
export function MiniDemo() {
  const base = demoPosts[0]!;
  const [headline, setHeadline] = useState(base.content.title);
  const [accentIndex, setAccentIndex] = useState(0);
  const accent = ACCENTS[accentIndex]!;

  const content = useMemo(
    () => ({ ...base.content, title: headline || base.content.title }),
    [headline, base.content],
  );
  const brand = useMemo(
    () => ({ ...base.brand, primary: accent.primary, secondary: accent.secondary }),
    [accent],
  );

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] sm:items-center">
      <div className="order-2 flex flex-col gap-5 sm:order-1">
        <div>
          <Label htmlFor="mini-demo-headline" className="text-sm font-semibold">
            Headline
          </Label>
          <Input
            id="mini-demo-headline"
            value={headline}
            maxLength={42}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-2 rounded-xl"
            placeholder="Your headline here"
          />
        </div>
        <div>
          <span className="text-sm font-semibold">Accent color</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENTS.map((a, i) => (
              <button
                key={a.name}
                type="button"
                onClick={() => setAccentIndex(i)}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors data-[active=true]:border-foreground"
                data-active={i === accentIndex}
              >
                <span
                  className="size-3.5 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${a.primary}, ${a.secondary})` }}
                />
                {a.name}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This is a taste of what Rafty can do. Inside the app you control
          every detail of your post.
        </p>
      </div>

      <div className="order-1 mx-auto w-full max-w-[280px] sm:order-2">
        <PostCanvas
          template={base.template}
          content={content}
          brand={brand}
          businessName={base.businessName}
          businessType={base.businessType}
          className="rounded-2xl shadow-xl"
        />
      </div>
    </div>
  );
}
