import { toPng } from "html-to-image";

const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

// The embedded font CSS is immutable (same fonts for every post), so caching
// it module-wide is safe and does not bleed per-post state between exports.
let fontCssCache: string | null = null;

const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1350;

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

/** Waits for every image inside the node to finish decoding, tolerating
 * broken or slow images instead of hanging the export. */
async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      try {
        await img.decode();
      } catch {
        await new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      }
    }),
  );
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Renders a node to a deterministic 1080x1350 PNG data url. This is the only
 * export implementation, shared by download and share so preview, save,
 * download and share always agree pixel for pixel.
 */
async function renderNodeToDataUrl(node: HTMLElement): Promise<string> {
  const width = node.offsetWidth || node.getBoundingClientRect().width || 1;
  const fontEmbedCSS = await getFontEmbedCss();

  await document.fonts.ready;
  await waitForImages(node);
  await nextFrame();

  const options = {
    width,
    height: node.offsetHeight || Math.round((width * EXPORT_HEIGHT) / EXPORT_WIDTH),
    pixelRatio: EXPORT_WIDTH / width,
    canvasWidth: EXPORT_WIDTH,
    canvasHeight: EXPORT_HEIGHT,
    cacheBust: true,
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  };

  // html-to-image has a known first-pass race where fonts or images that
  // finish loading during the initial rasterization are missing from the
  // resulting canvas. A first, discarded render warms the browser's layout
  // and image cache so the second render is stable and deterministic.
  await toPng(node, options);
  return toPng(node, options);
}

/** Export a rendered post node as a 1080x1350 PNG. */
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

/** Same export, returned as a Blob. Shared helper so download, save and share
 * never diverge into separate export implementations. */
export async function renderPostToBlob(node: HTMLElement, filename: string): Promise<Blob> {
  const dataUrl = await renderNodeToDataUrl(node);
  const blob = await (await fetch(dataUrl)).blob();
  return blob;
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
