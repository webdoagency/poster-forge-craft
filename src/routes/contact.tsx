import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { usePrefersReducedMotion } from "@/components/marketing/usePrefersReducedMotion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Book a demo with Rafty" },
      {
        name: "description",
        content: "Tell us about your business and we will get in touch to show you Rafty and talk through pricing.",
      },
      { property: "og:title", content: "Book a demo with Rafty" },
      { property: "og:description", content: "Tell us about your business and we will get in touch." },
      { property: "og:url", content: "https://rafty.webdoagency.com/contact" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rafty.webdoagency.com/contact" }],
  }),
  component: ContactPage,
});

const CONTACT_EMAIL = "hello@webdoagency.com";

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [message, setMessage] = useState("");
  const reduced = usePrefersReducedMotion();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Demo request${business ? ` – ${business}` : ""}`,
  )}&body=${encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nBusiness: ${business}\n\n${message}`,
  )}`;

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Book a demo
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            Tell us a little about your business. This form does not submit
            anywhere on its own, it prepares an email to us so nothing gets
            lost.
          </p>
        </motion.div>

        <div className="mt-10">
          {submitted ? (
            <motion.div
              className="flex flex-col items-start gap-3 border-t border-border pt-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-display text-xl font-bold">Thanks, almost there</h2>
              <p className="text-sm text-muted-foreground">
                Send the message below and we will get back to you personally,
                usually within a day.
              </p>
              <a
                href={mailtoHref}
                className="mt-2 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Open my email to send it
              </a>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Edit my message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 border-t border-border pt-8">
              <div>
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 rounded-xl"
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 rounded-xl"
                  placeholder="you@business.com"
                />
              </div>
              <div>
                <Label htmlFor="contact-business">Business</Label>
                <Input
                  id="contact-business"
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  className="mt-2 rounded-xl"
                  placeholder="Business name"
                />
              </div>
              <div>
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 rounded-xl"
                  rows={4}
                  placeholder="What would you like to see in the demo?"
                />
              </div>
              <Button type="submit" size="lg" className="mt-2 rounded-full">
                Continue
              </Button>
              <p className="text-xs text-muted-foreground">
                Prefer email directly? Write to{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}
