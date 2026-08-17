import { cn } from "@/lib/utils";

/**
 * krijo24 wordmark.
 *
 * The final krijo24 logo file is not in the project yet, so the mark is set
 * typographically rather than invented. When the asset lands, drop it in
 * src/assets and swap the <span> for an <img src={logoAsset.url} /> here, this
 * is the only place the mark is rendered.
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
    <span
      className={cn("inline-flex items-center leading-none", className)}
      style={{ height }}
      aria-label="krijo24"
    >
      <span
        className="font-display font-extrabold tracking-tight"
        style={{ fontSize: height * 0.82 }}
      >
        {showWordmark ? "krijo24" : "k24"}
      </span>
    </span>
  );
}
