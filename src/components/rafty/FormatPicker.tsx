import { Film, Images, Image as ImageIcon, Smartphone } from "lucide-react";
import { CONTENT_FORMATS, FORMAT_HINTS, FORMAT_SPECS } from "@/lib/rafty/constants";
import type { ContentFormat } from "@/lib/rafty/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ContentFormat, typeof ImageIcon> = {
  post: ImageIcon,
  carousel: Images,
  video: Film,
  story: Smartphone,
};

/** First choice in the Create flow. Four plain options, no technical terms. */
export function FormatPicker({
  value,
  onChange,
}: {
  value: ContentFormat;
  onChange: (next: ContentFormat) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CONTENT_FORMATS.map((format) => {
        const Icon = ICONS[format];
        const active = value === format;
        return (
          <button
            key={format}
            type="button"
            onClick={() => onChange(format)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
              active
                ? "border-primary bg-primary-soft shadow-sm"
                : "border-border bg-card hover:border-primary/50",
            )}
          >
            <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-semibold">{FORMAT_SPECS[format].label}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              {FORMAT_HINTS[format]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
