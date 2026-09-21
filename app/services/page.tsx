import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { getPublishedServices, groupServicesByDay } from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";
import { SectionReveal } from "@/components/motion/SectionReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Services",
  description:
    "Weekly service schedule for Glorious Gospel Centre Church — Sunday worship, mid-week gatherings, and prayer meetings.",
  path: "/services",
  keywords: ["church services", "worship schedule", "sunday service", "bible study"],
});

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

export default async function ServicesPage() {
  const services = await getPublishedServices();
  const byDay = groupServicesByDay(services);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Weekly schedule"
          title="Join us in worship"
          description="We gather throughout the week for prayer, teaching, and worship. All are welcome to participate."
        >
          <LinkButton href="/visit">Plan Your Visit</LinkButton>
          <LinkButton href="/livestream" variant="secondary">
            Watch Online
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            {services.length === 0 ? (
              <EmptyState
                title="Service schedule coming soon"
                description="Weekly services will appear here once added through the admin."
              />
            ) : (
              <SectionReveal>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {byDay.map(({ day, label, services: dayServices }) => (
                    <article key={day} className="border-t border-accent-400/70 pt-4">
                      <h2 className="font-display text-lg font-semibold text-brand-900">{label}</h2>
                      <ul className="mt-3 divide-y divide-border border-y border-border">
                        {dayServices.map((s) => (
                          <li key={s.id} className="flex items-start justify-between gap-4 py-3">
                            <div>
                              <p className="font-medium text-brand-900">{s.name}</p>
                              {s.description ? (
                                <p className="mt-1 text-sm text-ink-muted">{s.description}</p>
                              ) : null}
                              {s.location ? (
                                <p className="mt-1 text-xs text-ink-muted">{s.location}</p>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-brand-700">
                                {formatTime(s.start_time)}
                              </p>
                              {s.end_time ? (
                                <p className="text-xs text-ink-muted">
                                  until {formatTime(s.end_time)}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </SectionReveal>
            )}

            {services.length > 0 ? (
              <p className="mt-10 text-center text-xs text-ink-muted">
                Schedule typically repeats weekly. Special services and one-time events appear on the{" "}
                <Link href="/events" className="brand-link">
                  events page
                </Link>
                .
              </p>
            ) : null}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
