import { toPng } from "html-to-image";

const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

let fontCssCache: string | null = null;

/** Inline the brand webfonts as base64 so exported PNGs keep the typography. */
async function getFontEmbedCss(): Promise<string> {
  if (fontCssCache !== null) return fontCssCache;
  try {
    const css = await (await fetch(FONT_CSS)).text();
    const urls = [...new Set(css.match(/https:\/\/[^)]+\.woff2/g) ?? [])];
    let out = css;
    await Promise.all(
      urls.map(async (url) => {
        const buf = await (await fetch(url)).arrayBuffer();
        let binary = "";
        new Uint8Array(buf).forEach((b) => (binary += String.fromCharCode(b)));
        out = out.split(url).join(`data:font/woff2;base64,${btoa(binary)}`);
      }),
    );
    fontCssCache = out;
  } catch {
    fontCssCache = "";
  }
  return fontCssCache;
}

/** Renders a node to a ~1080x1350 PNG data url. Shared by download and share. */
async function renderNodeToDataUrl(node: HTMLElement): Promise<string> {
  const width = node.offsetWidth || 1;
  const fontEmbedCSS = await getFontEmbedCss();
  return toPng(node, {
    pixelRatio: Math.min(4, Math.max(1, 1080 / width)),
    cacheBust: true,
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  });
}

/** Export a rendered post node as a ~1080x1350 PNG. */
export async function downloadNode(node: HTMLElement, filename: string) {
  const dataUrl = await renderNodeToDataUrl(node);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${filename}.png`;
  a.click();
}

/** Same export, returned as a File so it can be handed to the Web Share API. */
export async function nodeToPngFile(node: HTMLElement, filename: string): Promise<File> {
  const dataUrl = await renderNodeToDataUrl(node);
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], `${filename}.png`, { type: "image/png" });
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
