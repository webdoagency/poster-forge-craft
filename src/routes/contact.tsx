import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Rafty | Request a demo" },
      {
        name: "description",
        content: "Tell us about your business and request a quick Rafty demo. We will get back to you.",
      },
      { property: "og:title", content: "Contact Rafty | Request a demo" },
      { property: "og:description", content: "Request a quick demo of Rafty for your business." },
      { property: "og:url", content: "https://rafty.webdoagency.com/contact" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rafty.webdoagency.com/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thanks, that is on its way.", {
      description: "Someone from Rafty will get in touch with you soon.",
    });
  }

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-2xl px-4 pb-16 pt-14 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Request a demo
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Tell us a little about your business. This form does not store your
          information, it simply lets us know you want to talk.
        </p>

        <div className="card-soft mt-8 p-6 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-start gap-2 py-6">
              <h2 className="font-display text-xl font-bold">Message sent</h2>
              <p className="text-sm text-muted-foreground">
                Thanks for reaching out. Someone from Rafty will get in touch
                with you soon.
              </p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setSubmitted(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <Label htmlFor="contact-name">Name</Label>
                <Input id="contact-name" required className="mt-2 rounded-xl" placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  required
                  className="mt-2 rounded-xl"
                  placeholder="you@business.com"
                />
              </div>
              <div>
                <Label htmlFor="contact-business">Business</Label>
                <Input id="contact-business" className="mt-2 rounded-xl" placeholder="Business name" />
              </div>
              <div>
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  className="mt-2 rounded-xl"
                  rows={4}
                  placeholder="What would you like to see in the demo?"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl">
                Request a demo
              </Button>
            </form>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}
