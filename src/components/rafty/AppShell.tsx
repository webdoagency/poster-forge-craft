import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Images, LayoutTemplate, Palette, Sparkles, LogOut } from "lucide-react";
import { useRafty } from "@/lib/rafty/store";
import { Logo } from "@/components/rafty/Logo";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const nav = [
  { to: "/create", labelKey: "nav.create", icon: Sparkles },
  { to: "/posts", labelKey: "nav.posts", icon: Images },
  { to: "/templates", labelKey: "nav.templates", icon: LayoutTemplate },
  { to: "/brand", labelKey: "nav.brand", icon: Palette },
] as const;

/** Business chrome. Most accounts have one brand, a switcher only appears
 * once the plan grants more than one. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user, business, brands, selectBrand, isAdmin, t, signOut } = useRafty();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // The route gate already requires a session. Onboarding must be finished
  // before any business surface is usable.
  useEffect(() => {
    if (!ready || !user) return;
    if (!business || !business.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [ready, user, business, navigate]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!ready || !user || !business || !business.onboarded) {
    return <div className="page-bg min-h-screen" />;
  }

  const statusLabel = t(`status.${business.status}`);
  const hasMultipleBrands = brands.length > 1;

  return (
    <div className="page-bg min-h-screen">
      <header className="glass-panel sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/create" className="shrink-0">
            <Logo height={26} />
          </Link>
          <nav className="ml-3 hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-primary-soft data-[status=active]:text-accent-foreground"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
          {hasMultipleBrands ? (
            <Select value={business.id} onValueChange={(id) => selectBrand(id)}>
              <SelectTrigger className="ml-2 h-9 w-40 shrink-0 rounded-lg bg-card text-sm sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div className="ml-auto flex min-w-0 items-center gap-3">
            {isAdmin ? (
              <Link
                to="/admin"
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground sm:block"
              >
                Admin
              </Link>
            ) : null}
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-bold">{business.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{statusLabel}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label={t("nav.signOut")}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">{children}</main>

      <nav className="glass-panel fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-4">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <item.icon className="size-5" />
              {t(item.labelKey)}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
