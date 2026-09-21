import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { ContactForm } from "./_components/ContactForm";
import { getSiteSettings, getActiveSocialLinks } from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";
import { SectionReveal } from "@/components/motion/SectionReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description:
    "Get in touch with Glorious Gospel Centre Church — phone, email, location, office hours, and contact form.",
  path: "/contact",
  keywords: ["contact", "church address", "phone", "email"],
});

export default async function ContactPage() {
  const [settings, socials] = await Promise.all([
    getSiteSettings(),
    getActiveSocialLinks(),
  ]);

  const mapEmbed =
    settings.google_maps_url && /^https?:\/\//.test(settings.google_maps_url)
      ? settings.google_maps_url
      : null;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Contact"
          title="We'd love to hear from you"
          description="Questions, prayer needs, or just want to say hello? Use the form below or reach us directly."
        >
          <LinkButton href="/visit" variant="secondary">
            Plan Your Visit
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
              <SectionReveal>
                <Card>
                  <CardHeader>
                    <CardTitle>Send us a message</CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    <ContactForm />
                  </div>
                </Card>
              </SectionReveal>

              <SectionReveal delay={0.12}>
                <aside className="space-y-8">
                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Phone &amp; email
                    </h2>
                    <div className="mt-3 space-y-2 text-sm">
                      {settings.phone ? (
                        <p>
                          <span className="text-ink-muted">Phone: </span>
                          <a
                            className="brand-link"
                            href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                          >
                            {settings.phone}
                          </a>
                        </p>
                      ) : null}
                      {settings.whatsapp ? (
                        <p>
                          <span className="text-ink-muted">WhatsApp: </span>
                          <a
                            className="brand-link"
                            href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {settings.whatsapp}
                          </a>
                        </p>
                      ) : null}
                      {settings.email ? (
                        <p>
                          <span className="text-ink-muted">Email: </span>
                          <a className="brand-link" href={`mailto:${settings.email}`}>
                            {settings.email}
                          </a>
                        </p>
                      ) : null}
                      {!settings.phone && !settings.email && !settings.whatsapp ? (
                        <p className="text-ink-muted">
                          Contact details will appear here once published.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Location &amp; hours
                    </h2>
                    {settings.address ? (
                      <p className="mt-3 whitespace-pre-line text-sm text-ink">
                        {settings.address}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-ink-muted">
                        Address will appear here once published.
                      </p>
                    )}
                    {settings.office_hours ? (
                      <p className="mt-2 text-sm">
                        <span className="text-ink-muted">Office hours: </span>
                        <span className="text-brand-900">{settings.office_hours}</span>
                      </p>
                    ) : null}
                  </div>

                  {socials.length > 0 ? (
                    <div className="border-t border-border pt-5">
                      <h2 className="font-display text-base font-semibold text-brand-900">
                        Follow us
                      </h2>
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {socials.map((s) => (
                          <li key={s.id}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="brand-link capitalize"
                            >
                              {s.platform}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </aside>
              </SectionReveal>
            </div>
          </Container>
        </Section>

        {mapEmbed ? (
          <Section className="bg-surface-muted">
            <Container>
              <h2 className="heading-2 mb-6 text-center">Find us</h2>
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-white">
                <iframe
                  title="Church location"
                  src={mapEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full"
                />
              </div>
            </Container>
          </Section>
        ) : null}

        <Section>
          <Container width="prose" className="text-center">
            <SectionReveal>
              <p className="eyebrow mb-3">Next steps</p>
              <h2 className="heading-2 mb-4">While you are here</h2>
              <p className="lead mb-8">
                Plan a visit, join us online, or share a prayer need — we are glad you reached out.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <LinkButton href="/visit">Plan Your Visit</LinkButton>
                <LinkButton href="/livestream" variant="secondary">
                  Watch Online
                </LinkButton>
                <LinkButton href="/prayer" variant="ghost">
                  Request Prayer
                </LinkButton>
              </div>
            </SectionReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
