import { cn } from "@/lib/utils";
import logoAsset from "@/assets/rafty-logo.png.asset.json";
import iconAsset from "@/assets/rafty-icon.png.asset.json";

/**
 * Official Rafty Content logo.
 * showWordmark renders the full lockup, otherwise the icon mark alone.
 */
export function Logo({
  className,
  showWordmark = true,
  height = 28,
}: {
  className?: string;
  showWordmark?: boolean;
  height?: number;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img
        src={showWordmark ? logoAsset.url : iconAsset.url}
        alt="Rafty Content"
        style={{ height, width: "auto", objectFit: "contain" }}
      />
    </span>
  );
}
