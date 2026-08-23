import { forwardRef } from "react";
import { renderTemplate } from "@/lib/rafty/templates";
import { ExtraTextLayer } from "./ExtraTextLayer";
import { FORMAT_SPECS } from "@/lib/rafty/constants";

import type {
  BrandProfile,
  BusinessType,
  ContentFormat,
  PostAdjustments,
  PostContent,
  Template,
} from "@/lib/rafty/types";
import { cn } from "@/lib/utils";

type Props = {
  template: Template;
  content: PostContent;
  brand: BrandProfile;
  businessName: string;
  businessType: BusinessType;
  showBrandName?: boolean;
  showContact?: boolean;
  adjustments?: PostAdjustments;
  /** Overrides the template format, used by previews that force one shape. */
  format?: ContentFormat;
  className?: string;
};

/** Single rendering model for every format. The aspect ratio comes from the
 * shared format table, all template sizing is container relative, so
 * thumbnails, slide previews and exports render identically. Pure render of
 * its props: no internal state, so it never goes stale and is safe to key by
 * post, slide or template id. */
export const PostCanvas = forwardRef<HTMLDivElement, Props>(function PostCanvas(
  {
    template,
    content,
    brand,
    businessName,
    businessType,
    showBrandName,
    showContact,
    adjustments,
    format,
    className,
  },
  ref,
) {
  const spec = FORMAT_SPECS[format ?? template.format ?? "post"];

  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden bg-muted", className)}
      style={{ containerType: "inline-size", aspectRatio: `${spec.width} / ${spec.height}` }}
    >
      {renderTemplate(template, {
        content,
        brand,
        businessName,
        businessType,
        showBrandName: showBrandName ?? false,
        showContact: showContact ?? false,
        ...(adjustments ? { adjustments } : {}),
      })}
      <ExtraTextLayer items={content.extras} brand={brand} />
    </div>

  );
});
