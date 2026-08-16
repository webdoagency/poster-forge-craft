import { forwardRef } from "react";
import { renderTemplate } from "@/lib/rafty/templates";
import type {
  BrandProfile,
  BusinessType,
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
  className?: string;
};

/** 4:5 canvas. All template sizing is container relative, so thumbnails and
 * exports render identically. Pure render of its props: no internal state,
 * so it never goes stale and is safe to key by post/template id. */
export const PostCanvas = forwardRef<HTMLDivElement, Props>(function PostCanvas(
  { template, content, brand, businessName, businessType, showBrandName, showContact, adjustments, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("relative aspect-[4/5] w-full overflow-hidden bg-muted", className)}
      style={{ containerType: "inline-size" }}
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
    </div>
  );
});
