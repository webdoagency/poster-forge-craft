import { useState } from "react";
import { Check, Copy, Download, Facebook, Instagram, Save, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  downloadNode,
  downloadNodes,
  nodeToPngFile,
  slugify,
  type ExportSize,
} from "@/lib/rafty/download";

type Props = {
  canvasRef: React.RefObject<HTMLElement | null>;
  filename: string;
  caption: string;
  onSave: () => void;
  saveLabel?: string;
  saving?: boolean;
  /** Export canvas size, from the shared format table. */
  size?: ExportSize;
  /** Ordered slide nodes for multi frame formats. */
  slideNodes?: React.MutableRefObject<(HTMLDivElement | null)[]>;
  /** False for formats without a reliable renderer yet, such as video. */
  exportable?: boolean;
  /** Shown instead of the export buttons when export is unavailable. */
  unavailableNote?: string;
};

/**
 * Primary actions once content has been generated. Every export goes through
 * the one deterministic renderer. Meta publishing is not implemented, so
 * Instagram and Facebook are clearly disabled with an explanation instead of
 * pretending to publish anything.
 */
export function ShareActions({
  canvasRef,
  filename,
  caption,
  onSave,
  saveLabel = "Save",
  saving,
  size,
  slideNodes,
  exportable = true,
  unavailableNote,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const multi = (slideNodes?.current?.filter(Boolean).length ?? 0) > 1;

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      toast.success("Caption copied.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the caption.");
    }
  }

  async function exportAll() {
    setSharing(true);
    try {
      if (slideNodes) {
        const nodes = slideNodes.current.filter((n): n is HTMLDivElement => !!n);
        const count = await downloadNodes(nodes, slugify(filename), size);
        toast.success(`${count} images downloaded in order.`);
        return;
      }
      const node = canvasRef.current;
      if (!node) return;
      const file = await nodeToPngFile(node, slugify(filename), size);
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: filename, text: caption });
        return;
      }
      await downloadNode(node, slugify(filename), size);
      toast.success("Image downloaded.");
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error("Could not share the image. Try downloading instead.");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={exportable ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
        <Button className="h-12 rounded-xl" onClick={onSave} disabled={saving}>
          <Save className="mr-1 size-4" />
          {saveLabel}
        </Button>
        {exportable ? (
          <Button variant="outline" className="h-12 rounded-xl" onClick={exportAll} disabled={sharing}>
            <Share2 className="mr-1 size-4" />
            {multi ? "Save all slides" : "Save to device"}
          </Button>
        ) : null}
      </div>

      {!exportable ? (
        <p className="rounded-xl border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
          {unavailableNote ??
            "Video download is not available yet. Your storyboard, timing and content are saved and will export once video rendering is ready."}
        </p>
      ) : null}

      <Button variant="outline" className="h-11 rounded-xl" onClick={copyCaption}>
        {copied ? <Check className="mr-1 size-4" /> : <Copy className="mr-1 size-4" />}
        Copy caption
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <div
          className="flex h-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/40 px-2 text-center opacity-70"
          title="Connect a Meta business account to publish to Instagram."
        >
          <Instagram className="size-4 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground">Connect required</span>
        </div>
        <div
          className="flex h-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/40 px-2 text-center opacity-70"
          title="Connect a Meta business account to publish to Facebook."
        >
          <Facebook className="size-4 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground">Connect required</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Posting to Instagram needs a professional account connected to a Facebook Page through a
        connected Meta business account. Nothing is published automatically.
      </p>

      {exportable && !slideNodes ? (
        <Button
          variant="ghost"
          className="h-9 rounded-xl text-xs text-muted-foreground"
          onClick={() => canvasRef.current && downloadNode(canvasRef.current, slugify(filename), size)}
        >
          <Download className="mr-1 size-3.5" />
          Download PNG
        </Button>
      ) : null}
    </div>
  );
}
