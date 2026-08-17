import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Info, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/rafty/AppShell";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { LazyMount } from "@/components/rafty/LazyMount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRafty } from "@/lib/rafty/store";
import * as repo from "@/lib/rafty/repo";
import { PLATFORM_LABELS, SOCIAL_PLATFORMS, TIMEZONES } from "@/lib/rafty/constants";
import type { ScheduledPost, SocialConnection, SocialPlatform } from "@/lib/rafty/types";

export const Route = createFileRoute("/_authenticated/schedule")({
  validateSearch: (search: Record<string, unknown>): { post?: string } =>
    typeof search['post'] === "string" && search['post'] ? { post: search['post'] } : {},
  head: () => ({
    meta: [
      { title: "Schedule | krijo24" },
      {
        name: "description",
        content: "Pick a saved post visually and queue it for a date and time.",
      },
      { property: "og:title", content: "Schedule | krijo24" },
      {
        property: "og:description",
        content: "Plan when your saved posts go out, chosen visually.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <SchedulePage />
    </AppShell>
  ),
});

function localInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function statusTone(status: ScheduledPost["status"]) {
  if (status === "queued") return "default" as const;
  if (status === "published") return "secondary" as const;
  return "outline" as const;
}

function SchedulePage() {
  const { business, brand, posts, templates } = useRafty();
  const search = Route.useSearch();
  const [rows, setRows] = useState<ScheduledPost[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [postId, setPostId] = useState(search.post ?? "");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [when, setWhen] = useState(() => localInputValue(new Date(Date.now() + 3600_000)));
  const [timezone, setTimezone] = useState("Europe/Tirane");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [labels, setLabels] = useState<Record<string, string>>({});

  const businessId = business?.id ?? null;

  const load = useCallback(async () => {
    if (!businessId) return;
    const [queue, conns] = await Promise.all([
      repo.listSchedules(businessId),
      repo.listConnections(businessId),
    ]);
    setRows(queue);
    setConnections(conns);
    setLabels(Object.fromEntries(conns.map((c) => [c.platform, c.accountLabel])));
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const postTitle = useMemo(
    () => (id: string) => posts.find((p) => p.id === id)?.content.title || "Untitled post",
    [posts],
  );

  /** Small live render of a saved post, so a queue item is recognised by sight. */
  const Thumb = useCallback(
    ({ id, className }: { id: string; className?: string }) => {
      const post = posts.find((p) => p.id === id);
      const template = post ? templates.find((x) => x.id === post.templateId) ?? templates[0] : null;
      if (!post || !template || !brand || !business) {
        return <div className={`w-full rounded-md bg-muted ${className ?? ""}`} style={{ aspectRatio: "4 / 5" }} />;
      }
      return (
        <LazyMount className={className}>
          <PostCanvas
            template={template}
            content={post.slides?.[0]?.content ?? post.content}
            brand={brand}
            businessName={business.name}
            businessType={business.type}
            showBrandName={post.showBrandName}
            showContact={post.showContact ?? false}
            adjustments={post.slides?.[0]?.adjustments ?? post.adjustments}
            format={post.format ?? "post"}
            className="rounded-md"
          />
        </LazyMount>
      );
    },
    [posts, templates, brand, business],
  );

  if (!business || !businessId || !brand) return null;
  const bid = businessId;

  async function add() {
    if (!postId) {
      toast.error("Pick a saved post first.");
      return;
    }
    const at = new Date(when);
    if (Number.isNaN(at.getTime())) {
      toast.error("Pick a valid date and time.");
      return;
    }
    setSaving(true);
    const res = await repo.createSchedule({
      businessId: bid,
      postId,
      platform,
      scheduledAt: at.toISOString(),
      timezone,
      note,
    });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setNote("");
    toast.success("Added to your krijo24 queue.");
    await load();
  }

  async function cancel(scheduleId: string) {
    const res = await repo.cancelSchedule(scheduleId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    await load();
  }

  async function remove(scheduleId: string) {
    await repo.deleteSchedule(scheduleId);
    await load();
  }

  async function saveLabel(p: SocialPlatform) {
    const res = await repo.saveConnectionLabel(bid, p, labels[p] ?? "");
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Saved.");
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="glass-panel rounded-3xl p-5 sm:p-6">
        <header className="mb-4 flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" />
          <h1 className="text-lg font-black tracking-tight">Schedule</h1>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-xs font-bold text-muted-foreground">Saved post</span>
            <Select value={postId} onValueChange={setPostId}>
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue placeholder={posts.length ? "Choose a post" : "No saved posts yet"} />
              </SelectTrigger>
              <SelectContent>
                {posts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.content.title || "Untitled post"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold text-muted-foreground">Platform</span>
            <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((p) => (
                  <SelectItem key={p.platform} value={p.platform}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold text-muted-foreground">Timezone</span>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="h-11 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold text-muted-foreground">Date and time</span>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="h-11 rounded-xl bg-card"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold text-muted-foreground">Note (optional)</span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Morning slot"
              className="h-11 rounded-xl bg-card"
            />
          </label>

          <Button className="h-11 rounded-xl sm:col-span-2" onClick={() => void add()} disabled={saving}>
            Add to queue
          </Button>
        </div>

        <p className="mt-4 flex gap-2 rounded-xl border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Queued items are prepared and timed inside krijo24. Automatic posting starts only once a
          platform connection is available, so nothing is ever marked as published by mistake.
        </p>

        <div className="mt-5 grid gap-2">
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nothing queued yet.{" "}
              <Link to="/posts" className="font-semibold text-primary">
                Pick a saved post
              </Link>
              .
            </p>
          ) : null}
          {rows.map((row) => (
            <article
              key={row.id}
              className="flex items-center gap-3 rounded-2xl border bg-card/70 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{postTitle(row.postId)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {PLATFORM_LABELS[row.platform]} ·{" "}
                  {new Date(row.scheduledAt).toLocaleString()} · {row.timezone}
                  {row.note ? ` · ${row.note}` : ""}
                </p>
              </div>
              <Badge variant={statusTone(row.status)}>{row.status}</Badge>
              {row.status === "queued" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  aria-label="Cancel"
                  onClick={() => void cancel(row.id)}
                >
                  <X className="size-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  aria-label="Remove"
                  onClick={() => void remove(row.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </article>
          ))}
        </div>
      </section>

      <aside className="glass-panel h-fit rounded-3xl p-5 sm:p-6">
        <h2 className="text-base font-black tracking-tight">Social accounts</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Save the handle krijo24 should use. Connecting opens up as each platform becomes available.
        </p>
        <div className="mt-4 grid gap-3">
          {SOCIAL_PLATFORMS.map((p) => {
            const conn = connections.find((c) => c.platform === p.platform);
            return (
              <div key={p.platform} className="rounded-2xl border bg-card/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{p.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {p.available ? (conn?.status ?? "not connected") : "Connect when available"}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{p.note}</p>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={labels[p.platform] ?? ""}
                    onChange={(e) =>
                      setLabels((prev) => ({ ...prev, [p.platform]: e.target.value }))
                    }
                    placeholder="@handle"
                    className="h-9 rounded-xl bg-card text-sm"
                  />
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl"
                    onClick={() => void saveLabel(p.platform)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
