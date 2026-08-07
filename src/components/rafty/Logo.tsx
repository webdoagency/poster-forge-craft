import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Official Rafty Content logo.
 * Drop the supplied asset at public/brand/rafty-logo.svg (or .png and change
 * the path below) and it renders at the exact same size and position, with no
 * layout change. Until then a clean wordmark is shown instead of a generic
 * placeholder icon.
 */

const LOGO_SRC = "/brand/rafty-logo.svg";

export function Logo({
  className,
  showWordmark = true,
  height = 28,
}: {
  className?: string;
  showWordmark?: boolean;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={cn("flex items-center gap-2", className)}>
      {!failed ? (
        <img
          src={LOGO_SRC}
          alt="Rafty Content"
          style={{ height, width: "auto", objectFit: "contain" }}
          onError={() => setFailed(true)}
        />
      ) : null}
      {(failed || showWordmark) && (
        <span className="font-display text-lg font-extrabold leading-none tracking-tight">
          Rafty<span className="text-primary"> Content</span>
        </span>
      )}
    </span>
  );
}
