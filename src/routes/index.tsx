import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/rafty/Logo";
import { PostCanvas } from "@/components/rafty/PostCanvas";
import { demoPosts } from "@/lib/rafty/demo";
import { BUSINESS_TYPES } from "@/lib/rafty/constants";
import { useRafty } from "@/lib/rafty/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rafty Content | Branded posts in seconds" },
      {
        name: "description",
        content:
          "Rafty Content turns one image and a few details into a finished branded social post. Templates control the design.",
      },
      { property: "og:title", content: "Rafty Content | Branded posts in seconds" },
      {
        property: "og:description",
        content: "One image, a few details, a finished branded post. Try one post for free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { t, user, business } = useRafty();
  const appHref = user ? (business?.onboarded ? "/create" : "/onboarding") : "/auth";

  return (
    <div className="page-bg min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6">
        <Logo height={28} />
        <span className="hidden text-sm text-muted-foreground sm:inline">@raftycontent</span>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden rounded-xl sm:inline-flex">
            <Link to="/templates">{t("landing.cta2")}</Link>
          </Button>

          <Button asChild className="rounded-xl">
            <Link to={appHref}>{t("landing.cta")}</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              {t("landing.hero")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {t("landing.sub")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl">
                <Link to={appHref}>
                  {t("landing.cta")}
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/templates">{t("landing.cta2")}</Link>
              </Button>
            </div>
            <p className="card-soft mt-7 max-w-xl p-4 text-sm text-muted-foreground">
              {t("landing.trial")}
            </p>
          </div>

          <div className="relative">
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
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="font-display text-xl font-extrabold">{t("landing.examples")}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
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

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="font-display text-xl font-extrabold">{t("landing.typesTitle")}</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BUSINESS_TYPES.map((type) => (
            <li key={type} className="card-soft flex items-center gap-2 p-4 text-sm font-semibold">
              <Check className="size-4 shrink-0 text-primary" />
              {t(`type.${type}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <div className="brand-gradient flex flex-col items-start gap-4 rounded-3xl px-6 py-10 text-primary-foreground sm:px-10">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
            {t("landing.finalTitle")}
          </h2>
          <Button asChild size="lg" variant="secondary" className="rounded-xl">
            <Link to={appHref}>{t("landing.finalCta")}</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Rafty Content | @raftycontent</p>
      </section>
    </div>
  );
}
