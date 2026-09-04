import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { getAllPublishedEvents } from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Events",
  description:
    "Upcoming and recent events at Glorious Gospel Centre Church — conferences, outreach, fellowships, and special services.",
  path: "/events",
  keywords: ["church events", "conferences", "outreach", "fellowship"],
});

function formatEventDateTime(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

export default async function EventsPage() {
  const events = await getAllPublishedEvents();
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.starts_at) >= now);
  const past = events.filter((e) => new Date(e.starts_at) < now).reverse();

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Events</SectionEyebrow>
              <SectionTitle>What&apos;s coming up</SectionTitle>
              <SectionLead>
                Conferences, outreach, fellowships, and special services. Join us
                for any of these events.
              </SectionLead>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <h2 className="heading-3 mb-6">Upcoming</h2>
            {upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming events"
                description="Schedule events through the admin to see them here."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => {
                  const { day, time } = formatEventDateTime(e.starts_at);
                  return (
                    <Link key={e.id} href={`/events/${e.slug}`} className="group">
                      <Card className="flex h-full flex-col transition-shadow group-hover:shadow-elevated">
                        <div className="aspect-[4/3] bg-gradient-to-br from-brand-100 to-accent-100" aria-hidden="true">
                          {e.poster_url ? (
                            <img
                              src={e.poster_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Badge tone="brand">{day}</Badge>
                            {e.registration_required ? (
                              <Badge tone="accent">Registration</Badge>
                            ) : null}
                          </div>
                          <CardTitle>{e.title}</CardTitle>
                          {e.short_description ? (
                            <CardDescription>{e.short_description}</CardDescription>
                          ) : null}
                        </CardHeader>
                        <CardBody>
                          <p className="text-sm text-ink-muted">
                            {time}
                            {e.location ? ` · ${e.location}` : ""}
                          </p>
                        </CardBody>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </Container>
        </Section>

        {past.length > 0 ? (
          <Section className="bg-surface-muted">
            <Container>
              <h2 className="heading-3 mb-6">Past events</h2>
              <ul className="divide-y divide-brand-100 overflow-hidden rounded-2xl border border-brand-100 bg-surface shadow-soft">
                {past.slice(0, 10).map((e) => {
                  const { day } = formatEventDateTime(e.starts_at);
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/events/${e.slug}`}
                        className="flex items-center justify-between px-5 py-4 hover:bg-brand-50"
                      >
                        <div>
                          <p className="font-medium text-ink">{e.title}</p>
                          {e.location ? (
                            <p className="text-xs text-ink-muted">{e.location}</p>
                          ) : null}
                        </div>
                        <p className="text-sm text-ink-muted">{day}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Container>
          </Section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}