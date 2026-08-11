import { useState } from "react";
import { Check, Copy, Download, Facebook, Instagram, Save, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadNode, nodeToPngFile, slugify } from "@/lib/rafty/download";

type Props = {
  canvasRef: React.RefObject<HTMLElement | null>;
  filename: string;
  caption: string;
  onSave: () => void;
  saveLabel?: string;
  saving?: boolean;
};

/**
 * Primary actions once a post has been generated. Meta publishing is not
 * implemented, so Instagram and Facebook are clearly disabled with an
 * explanation instead of pretending to publish anything.
 */
export function ShareActions({ canvasRef, filename, caption, onSave, saveLabel = "Save", saving }: Props) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

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

  async function saveToDevice() {
    const node = canvasRef.current;
    if (!node) return;
    setSharing(true);
    try {
      const file = await nodeToPngFile(node, slugify(filename));
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: filename, text: caption });
        return;
      }
      await downloadNode(node, slugify(filename));
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
      <div className="grid grid-cols-2 gap-2">
        <Button className="h-12 rounded-xl" onClick={onSave} disabled={saving}>
          <Save className="mr-1 size-4" />
          {saveLabel}
        </Button>
        <Button variant="outline" className="h-12 rounded-xl" onClick={saveToDevice} disabled={sharing}>
          <Share2 className="mr-1 size-4" />
          Save to device
        </Button>
      </div>

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

      <Button
        variant="ghost"
        className="h-9 rounded-xl text-xs text-muted-foreground"
        onClick={() => canvasRef.current && downloadNode(canvasRef.current, slugify(filename))}
      >
        <Download className="mr-1 size-3.5" />
        Download PNG
      </Button>
    </div>
  );
}
