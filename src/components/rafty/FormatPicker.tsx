import { Film, Images, Image as ImageIcon, Lock, Smartphone } from "lucide-react";
import { CONTENT_FORMATS, FORMAT_HINTS, FORMAT_SPECS } from "@/lib/rafty/constants";
import type { ContentFormat } from "@/lib/rafty/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ContentFormat, typeof ImageIcon> = {
  post: ImageIcon,
  carousel: Images,
  video: Film,
  story: Smartphone,
};

/** First choice in the Create flow. Four plain options, no technical terms.
 * Formats outside the active plan are visible but locked, the database also
 * refuses them, so this is a hint and never the security boundary. */
export function FormatPicker({
  value,
  onChange,
  allowed,
}: {
  value: ContentFormat;
  onChange: (next: ContentFormat) => void;
  allowed?: ContentFormat[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CONTENT_FORMATS.map((format) => {
        const Icon = ICONS[format];
        const active = value === format;
        const enabled = !allowed || allowed.includes(format);
        return (
          <button
            key={format}
            type="button"
            onClick={() => enabled && onChange(format)}
            aria-pressed={active}
            disabled={!enabled}
            title={enabled ? undefined : "Available on a higher plan"}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
              active
                ? "border-primary bg-primary-soft shadow-sm"
                : "border-border bg-card hover:border-primary/50",
              !enabled && "cursor-not-allowed opacity-55 hover:border-border",
            )}
          >
            {enabled ? (
              <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
            ) : (
              <Lock className="size-4 text-muted-foreground" />
            )}
            <span className="text-sm font-semibold">{FORMAT_SPECS[format].label}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              {enabled ? FORMAT_HINTS[format] : "Upgrade to unlock"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

