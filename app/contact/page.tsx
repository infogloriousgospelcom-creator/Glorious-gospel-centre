import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
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

const PLACEHOLDER = "[To be provided]";

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
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-white to-brand-50/60">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Contact</SectionEyebrow>
              <SectionTitle>We&apos;d love to hear from you</SectionTitle>
              <SectionLead>
                Questions, prayer needs, or just want to say hello? Use the form
                below or reach us directly through any of the channels listed.
              </SectionLead>
            </div>
          </Container>
        </Section>

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

              <SectionReveal delay={0.15}>
              <aside className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Phone &amp; email</CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-2 text-sm">
                    <p>
                      <span className="text-ink-muted">Phone: </span>
                      {settings.phone ? (
                        <a className="text-brand-700 transition-colors hover:text-brand-800" href={`tel:${settings.phone.replace(/\s+/g, "")}`}>
                          {settings.phone}
                        </a>
                      ) : (
                        <span className="text-ink-subtle">{PLACEHOLDER}</span>
                      )}
                    </p>
                    {settings.whatsapp ? (
                      <p>
                        <span className="text-ink-muted">WhatsApp: </span>
                        <a
                          className="text-brand-700 transition-colors hover:text-brand-800"
                          href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {settings.whatsapp}
                        </a>
                      </p>
                    ) : null}
                    <p>
                      <span className="text-ink-muted">Email: </span>
                      {settings.email ? (
                        <a className="text-brand-700 transition-colors hover:text-brand-800" href={`mailto:${settings.email}`}>
                          {settings.email}
                        </a>
                      ) : (
                        <span className="text-ink-subtle">{PLACEHOLDER}</span>
                      )}
                    </p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Location &amp; hours</CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-2 text-sm">
                    <p className="whitespace-pre-line text-ink">
                      {settings.address ?? PLACEHOLDER}
                    </p>
                    {settings.office_hours ? (
                      <p>
                        <span className="text-ink-muted">Office hours: </span>
                        <span className="text-brand-900">{settings.office_hours}</span>
                      </p>
                    ) : null}
                  </CardBody>
                </Card>

                {socials.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Follow us</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <ul className="space-y-1.5 text-sm">
                        {socials.map((s) => (
                          <li key={s.id}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-700 capitalize transition-colors hover:text-brand-800"
                            >
                              {s.platform}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>
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
              <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
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
      </main>
      <Footer />
    </>
  );
}