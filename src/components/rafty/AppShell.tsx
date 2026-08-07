import { Link } from "@tanstack/react-router";
import { Images, LayoutTemplate, Palette, Settings, Sparkles } from "lucide-react";
import { useRafty } from "@/lib/rafty/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const nav = [
  { to: "/", label: "Create", icon: Sparkles },
  { to: "/posts", label: "Posts", icon: Images },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/brand", label: "Brand", icon: Palette },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { tenant, tenants, setTenantId } = useRafty();

  return (
    <div className="page-bg min-h-screen">
      <header className="glass-panel sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <span className="brand-gradient grid size-8 shrink-0 place-items-center rounded-xl text-sm font-black text-primary-foreground">
                R
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">RAFTY</span>
            </Link>
            <nav className="ml-4 hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-primary-soft data-[status=active]:text-accent-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Select value={tenant.id} onValueChange={setTenantId}>
            <SelectTrigger className="w-[150px] shrink-0 rounded-xl bg-card sm:w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">{children}</main>

      <nav className="glass-panel fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
