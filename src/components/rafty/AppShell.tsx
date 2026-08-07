import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Images, LayoutTemplate, Palette, Sparkles, LogOut } from "lucide-react";
import { useRafty } from "@/lib/rafty/store";
import { Logo } from "@/components/rafty/Logo";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/create", labelKey: "nav.create", icon: Sparkles },
  { to: "/posts", labelKey: "nav.posts", icon: Images },
  { to: "/templates", labelKey: "nav.templates", icon: LayoutTemplate },
  { to: "/brand", labelKey: "nav.brand", icon: Palette },
] as const;

/** Business chrome. One account, one business, so there is no switcher. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user, business, t, signOut } = useRafty();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/auth", replace: true });
    else if (!business || !business.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [ready, user, business, navigate]);

  if (!ready || !user || !business || !business.onboarded) {
    return <div className="page-bg min-h-screen" />;
  }

  const statusLabel = t(`status.${business.status}`);

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
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-bold">{business.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{statusLabel}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label={t("nav.signOut")}
              onClick={() => {
                signOut();
                navigate({ to: "/", replace: true });
              }}
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
