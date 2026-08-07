import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/rafty/Logo";
import { Button } from "@/components/ui/button";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="brand-gradient flex flex-col items-start gap-4 rounded-3xl px-6 py-9 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h2 className="font-display text-xl font-extrabold sm:text-2xl">
              Want to see Rafty in action?
            </h2>
            <p className="mt-1 text-sm text-primary-foreground/85">
              Book a quick demo, no obligation.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="rounded-xl">
            <Link to="/contact">
              Book a quick demo
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <Logo height={22} />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Rafty helps businesses of any kind create professional branded
              content quickly and consistently.
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
              Contact
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-card-foreground">
            <span className="font-semibold">Need a website too?</span>{" "}
            <span className="text-muted-foreground">
              Webdo Agency can build it.
            </span>
          </p>
          <Link to="/contact" className="font-medium text-primary hover:underline">
            Get in touch
          </Link>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>&copy; {new Date().getFullYear()} Rafty. All rights reserved.</span>
          <span>
            Powered by <span className="font-semibold text-foreground">Webdo Agency</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
