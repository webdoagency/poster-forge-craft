import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/rafty/Logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <Logo height={22} />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Professional branded content, created quickly and consistently.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground sm:justify-end">
            <Link to="/how-it-works" className="hover:text-foreground">
              How it works
            </Link>
            <Link to="/gallery" className="hover:text-foreground">
              Templates
            </Link>
            <Link to="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link to="/contact" className="hover:text-foreground">
              Book a demo
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Powered by{" "}
            <a
              href="https://webdoagency.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Webdo Agency
            </a>
            . Need a website too?{" "}
            <a
              href="https://webdoagency.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              We build those as well.
            </a>
          </p>
          <p className="text-muted-foreground/70">Anexio Group LLC</p>
        </div>
      </div>
    </footer>
  );
}
