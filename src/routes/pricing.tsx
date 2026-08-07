import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Rafty pricing | Simple plans for branded content" },
      {
        name: "description",
        content:
          "Three straightforward Rafty plans built around post creation, templates, brand kit and support. Monthly or annual, save 20 percent yearly.",
      },
      { property: "og:title", content: "Rafty pricing | Simple plans for branded content" },
      {
        property: "og:description",
        content: "Three plans, clear features, no payment surprises.",
      },
      { property: "og:url", content: "https://rafty.webdoagency.com/pricing" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rafty.webdoagency.com/pricing" }],
  }),
  component: PricingPage,
});

type Plan = {
  name: string;
  monthly: number;
  tagline: string;
  featured?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 50,
    tagline: "For a single business finding its rhythm.",
    features: [
      "Unlimited post creation",
      "Access to global templates",
      "One brand kit",
      "Email support",
    ],
  },
  {
    name: "Studio",
    monthly: 99,
    tagline: "For teams publishing regularly across channels.",
    featured: true,
    features: [
      "Everything in Starter",
      "Priority template access",
      "2 custom template requests / month",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    monthly: 150,
    tagline: "For agencies managing several brands.",
    features: [
      "Everything in Studio",
      "Multiple brand kits",
      "5 custom template requests / month",
      "Dedicated support",
    ],
  },
];

function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-4xl px-4 pb-6 pt-14 text-center sm:px-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Simple pricing, no surprises
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Three plans built around what Rafty actually does: post creation,
          templates, your brand kit and support.
        </p>

        <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2">
          <span className={cn("text-sm font-medium", !annual && "text-foreground", annual && "text-muted-foreground")}>
            Monthly
          </span>
          <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Toggle annual pricing" />
          <span className={cn("text-sm font-medium", annual && "text-foreground", !annual && "text-muted-foreground")}>
            Annual
          </span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            Save 20%
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const effectiveMonthly = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
            return (
              <div
                key={plan.name}
                className={cn(
                  "card-soft flex flex-col gap-6 p-6",
                  plan.featured && "border-2 border-primary shadow-lift",
                )}
              >
                {plan.featured ? (
                  <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                ) : null}
                <div>
                  <h2 className="font-display text-xl font-extrabold">{plan.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                </div>
                <div>
                  <span className="font-display text-4xl font-extrabold">
                    &euro;{effectiveMonthly}
                  </span>
                  <span className="text-sm text-muted-foreground"> / month</span>
                  {annual ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Billed annually at &euro;{effectiveMonthly * 12}
                    </p>
                  ) : null}
                </div>
                <ul className="flex flex-1 flex-col gap-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  variant={plan.featured ? "default" : "outline"}
                  className="rounded-xl"
                >
                  <Link to="/auth">Try for free</Link>
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need something different?{" "}
          <Link to="/contact" className="font-medium text-primary hover:underline">
            Talk to us
          </Link>
          .
        </p>
      </section>
    </MarketingLayout>
  );
}
