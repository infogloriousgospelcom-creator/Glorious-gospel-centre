import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow } from "@/components/ui/Section";
import Link from "next/link";
import { getAllPublishedEvents, getEventBySlug } from "@/services/content";
import { EventRegistrationForm } from "@/app/events/_components/EventRegistrationForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return { title: "Event" };
  return {
    title: event.title,
    description: event.short_description ?? `Details about ${event.title}.`,
  };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  void getAllPublishedEvents;

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl">
              <Link
                href="/events"
                className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                ← All events
              </Link>
              <SectionEyebrow>Event</SectionEyebrow>
              <h1 className="heading-1 mb-4 text-balance">{event.title}</h1>
              {event.short_description ? (
                <p className="lead text-balance">{event.short_description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="brand">{formatDateTime(event.starts_at)}</Badge>
                {event.location ? <Badge tone="accent">{event.location}</Badge> : null}
                {event.registration_required ? (
                  <Badge tone="warning">Registration required</Badge>
                ) : null}
              </div>
            </div>
          </Container>
        </Section>

        {event.poster_url ? (
          <Container>
            <img
              src={event.poster_url}
              alt=""
              className="aspect-[21/9] w-full rounded-2xl object-cover shadow-elevated"
            />
          </Container>
        ) : null}

        <Section>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
              <div>
                <h2 className="heading-2 mb-4">About this event</h2>
                {event.description ? (
                  <div className="prose max-w-none text-ink">
                    {event.description.split(/\n{2,}/).map((p, i) => (
                      <p key={i} className="mb-4 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Details coming soon"
                    description="More information will be added through the admin."
                  />
                )}
                {event.speaker ? (
                  <p className="mt-6 text-sm text-ink-muted">
                    <span className="font-semibold text-ink">Speaker: </span>
                    {event.speaker}
                  </p>
                ) : null}
              </div>

              <aside>
                {event.registration_required ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Register</CardTitle>
                    </CardHeader>
                    <div className="px-6 pb-6">
                      <EventRegistrationForm eventId={event.id} />
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Attending</CardTitle>
                    </CardHeader>
                    <div className="px-6 pb-6">
                      <p className="text-sm text-ink-muted">
                        No registration required. Just come along.
                      </p>
                      {event.ends_at ? (
                        <p className="mt-2 text-xs text-ink-muted">
                          Ends: {formatDateTime(event.ends_at)}
                        </p>
                      ) : null}
                    </div>
                  </Card>
                )}
              </aside>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
