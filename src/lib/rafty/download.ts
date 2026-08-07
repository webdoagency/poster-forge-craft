import { toPng } from "html-to-image";

/** Export a rendered post node as a 1080x1350 PNG. */
export async function downloadNode(node: HTMLElement, filename: string) {
  const width = node.offsetWidth || 1;
  const dataUrl = await toPng(node, {
    pixelRatio: Math.min(4, Math.max(1, 1080 / width)),
    cacheBust: true,
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${filename}.png`;
  a.click();
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "rafty-post"
  );
}
