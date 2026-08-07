import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { RaftyIntro } from "@/components/marketing/RaftyIntro";
import { MiniDemo } from "@/components/marketing/MiniDemo";
import { demoPosts } from "@/lib/rafty/demo";
import { BUSINESS_TYPE_NAMES, BUSINESS_TYPES } from "@/lib/rafty/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rafty | Branded posts, created in minutes" },
      {
        name: "description",
        content:
          "Rafty helps any business create professional branded content quickly and consistently. Pick a template, add your details, download a finished post.",
      },
      { property: "og:title", content: "Rafty | Branded posts, created in minutes" },
      {
        property: "og:description",
        content:
          "Create professional branded content quickly and consistently, no design skills required.",
      },
      { property: "og:url", content: "https://rafty.webdoagency.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rafty.webdoagency.com/" }],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <RaftyIntro />
      <MarketingLayout>
        <Hero />
        <Examples />
        <QuickStarts />
        <DemoSection />
        <FinalCta />
      </MarketingLayout>
    </>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div>
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            For businesses of every kind
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Create professional branded content, quickly and consistently.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            One image, a few details, a finished post. Rafty keeps every post
            on brand so you never start from a blank canvas again.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/auth">
                Try for free
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-xl">
              <Link to="/gallery">Explore templates</Link>
            </Button>
          </div>
          <p className="card-soft mt-7 max-w-xl p-4 text-sm text-muted-foreground">
            Complete a short onboarding, then create one post free while your
            business is reviewed for approval.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1 mt-8">
            <PostCanvas
              template={demoPosts[1]!.template}
              content={demoPosts[1]!.content}
              brand={demoPosts[1]!.brand}
              businessName={demoPosts[1]!.businessName}
              businessType={demoPosts[1]!.businessType}
              className="rounded-2xl shadow-xl"
            />
          </div>
          <div className="col-span-1">
            <PostCanvas
              template={demoPosts[0]!.template}
              content={demoPosts[0]!.content}
              brand={demoPosts[0]!.brand}
              businessName={demoPosts[0]!.businessName}
              businessType={demoPosts[0]!.businessType}
              className="rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Examples() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h2 className="font-display text-2xl font-extrabold">Made with Rafty</h2>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Every example below was generated with a real Rafty template. Your
        posts will carry your own logo, colors and fonts.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {demoPosts.map((d) => (
          <div key={d.template.id} className="card-soft overflow-hidden p-2">
            <PostCanvas
              template={d.template}
              content={d.content}
              brand={d.brand}
              businessName={d.businessName}
              businessType={d.businessType}
              className="rounded-xl"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickStarts() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-2xl font-extrabold">
        Quick-start styles for five business types
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Rafty works for any business. These five give you a head start with
        fields and layouts already tuned for how they sell.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BUSINESS_TYPES.map((type) => (
          <li
            key={type}
            className="card-soft flex items-center gap-2 p-4 text-sm font-semibold"
          >
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
            {BUSINESS_TYPE_NAMES[type]}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DemoSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="card-soft p-6 sm:p-9">
        <h2 className="font-display text-2xl font-extrabold">Try a tiny piece of it</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Change the headline and accent color to see how fast a post can
          look different, without touching a design tool.
        </p>
        <div className="mt-7">
          <MiniDemo />
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="brand-gradient flex flex-col items-start gap-4 rounded-3xl px-6 py-10 text-primary-foreground sm:px-10">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
          Your next post is one image away.
        </h2>
        <Button asChild size="lg" variant="secondary" className="rounded-xl">
          <Link to="/auth">Try for free</Link>
        </Button>
      </div>
    </section>
  );
}
