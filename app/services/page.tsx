import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { getPublishedServices, groupServicesByDay } from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Services",
  description:
    "Weekly service schedule for Glorious Gospel Centre — Sunday worship, mid-week Bible study, youth service, and prayer meetings.",
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
  const hasRecurring = services.some((s) => s.is_recurring);

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Weekly schedule</SectionEyebrow>
              <SectionTitle>Join us in worship</SectionTitle>
              <SectionLead>
                We gather throughout the week for prayer, teaching, and worship.
                All are welcome to participate.
              </SectionLead>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            {services.length === 0 ? (
              <EmptyState
                title="Service schedule coming soon"
                description="Weekly services will appear here once added through the admin."
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {byDay.map(({ day, label, services }) => (
                  <article
                    key={day}
                    className="overflow-hidden rounded-2xl border border-brand-100 bg-surface shadow-soft"
                  >
                    <header className="border-b border-brand-100 bg-brand-50 px-5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                        Day {day + 1}
                      </p>
                      <h2 className="heading-3 text-ink">{label}</h2>
                    </header>
                    <ul className="divide-y divide-brand-100">
                      {services.map((s) => (
                        <li key={s.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-ink">{s.name}</p>
                              {s.description ? (
                                <p className="mt-1 text-sm text-ink-muted">
                                  {s.description}
                                </p>
                              ) : null}
                              {s.location ? (
                                <p className="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted">
                                  <span aria-hidden="true">📍</span> {s.location}
                                </p>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-medium text-brand-700">
                                {formatTime(s.start_time)}
                              </p>
                              {s.end_time ? (
                                <p className="text-xs text-ink-muted">
                                  until {formatTime(s.end_time)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}

            {hasRecurring ? (
              <p className="mt-10 text-center text-xs text-ink-muted">
                Schedule repeats weekly. Special services and one-time events appear on the{" "}
                <a href="/events" className="text-brand-700 hover:text-brand-800">
                  events page
                </a>
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
