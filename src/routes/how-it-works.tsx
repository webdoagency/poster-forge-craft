import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Image, LayoutTemplate, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { MiniDemo } from "@/components/marketing/MiniDemo";
import { usePrefersReducedMotion } from "@/components/marketing/usePrefersReducedMotion";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Rafty works | From one image to a branded post" },
      {
        name: "description",
        content:
          "See the five simple steps to go from your business details and one image to a finished, on-brand social post with Rafty.",
      },
      { property: "og:title", content: "How Rafty works | From one image to a branded post" },
      {
        property: "og:description",
        content: "Five steps, one finished branded post. No design skills needed.",
      },
      { property: "og:url", content: "https://rafty.webdoagency.com/how-it-works" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rafty.webdoagency.com/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    icon: Building2,
    title: "Tell Rafty about your business",
    body: "Name, business type and a few basics so Rafty understands how you present yourself.",
  },
  {
    icon: Image,
    title: "Upload one image and add your information",
    body: "A single photo plus your offer details is all the content Rafty needs to start.",
  },
  {
    icon: LayoutTemplate,
    title: "Choose a template",
    body: "Pick from a curated set of layouts tuned to your business type, or explore the full library.",
  },
  {
    icon: Sparkles,
    title: "Generate your branded post",
    body: "Rafty lays out your image, text and brand colors into a finished design in seconds.",
  },
  {
    icon: Download,
    title: "Download and save",
    body: "Export your post ready for any platform, and keep a record inside your account.",
  },
];

function HowItWorksPage() {
  const reduced = usePrefersReducedMotion();

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-4xl px-4 pb-8 pt-14 text-center sm:px-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Five steps to your first post
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          No design software, no learning curve. Rafty turns what you already
          have into something you would pay a designer for.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-6 top-2 bottom-2 hidden w-px bg-border sm:block"
          />
          <ol className="flex flex-col gap-6">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                className="relative flex gap-5"
                initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : index * 0.06 }}
              >
                <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-soft">
                  <step.icon className="size-5" />
                </span>
                <div className="card-soft flex-1 p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Step {index + 1}
                  </div>
                  <h2 className="mt-1 font-display text-lg font-bold">{step.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="card-soft p-6 sm:p-9">
          <h2 className="font-display text-2xl font-extrabold">See step four in action</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Change the headline and accent color below to feel how the
            generate step works.
          </p>
          <div className="mt-7">
            <MiniDemo />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
        <div className="brand-gradient flex flex-col items-start gap-4 rounded-3xl px-6 py-10 text-primary-foreground sm:px-10">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
            Ready to make your first post?
          </h2>
          <Button asChild size="lg" variant="secondary" className="rounded-xl">
            <Link to="/auth">
              Try for free
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
