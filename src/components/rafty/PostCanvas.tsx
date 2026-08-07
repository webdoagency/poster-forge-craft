import { forwardRef } from "react";
import { getTemplate } from "@/lib/rafty/templates";
import type { Brand, PostFields } from "@/lib/rafty/types";
import { cn } from "@/lib/utils";

type Props = {
  templateId: string;
  fields: PostFields;
  brand: Brand;
  className?: string;
};

/** 4:5 canvas. All sizing inside templates is container-relative (cqw), so
 * the same markup renders identically at thumbnail and export size. */
export const PostCanvas = forwardRef<HTMLDivElement, Props>(function PostCanvas(
  { templateId, fields, brand, className },
  ref,
) {
  const template = getTemplate(templateId);
  return (
    <div
      ref={ref}
      className={cn("relative aspect-[4/5] w-full overflow-hidden bg-muted", className)}
      style={{ containerType: "inline-size" }}
    >
      {template.render({ fields, brand })}
    </div>
  );
});
