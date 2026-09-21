import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { getUpcomingEvents } from "@/services/content";
import { SectionReveal } from "@/components/motion/SectionReveal";

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export async function UpcomingEventsSection() {
  const events = await getUpcomingEvents(3);

  return (
    <Section className="bg-surface-muted">
      <Container>
        <SectionReveal>
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <SectionEyebrow>Gatherings</SectionEyebrow>
              <SectionTitle>Upcoming events</SectionTitle>
            </div>
            <Link
              href="/events"
              className="text-sm font-semibold text-brand-700 transition-colors duration-ui ease-smooth hover:text-brand-800"
            >
              View All Events →
            </Link>
          </div>
        </SectionReveal>

        {events.length === 0 ? (
          <EmptyState
            title="No upcoming events"
            description="Nothing is scheduled here yet — check back soon, or explore past gatherings."
          />
        ) : (
          <SectionReveal delay={0.1}>
            <ul className="divide-y divide-border border-y border-border">
              {events.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.slug}`}
                    className="group flex min-h-touch flex-col gap-1 py-5 transition-colors duration-ui ease-smooth sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                        {formatEventDate(e.starts_at)}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold text-brand-900 group-hover:text-brand-700">
                        {e.title}
                      </p>
                      {e.short_description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                          {e.short_description}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-brand-700">
                      Details →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionReveal>
        )}
      </Container>
    </Section>
  );
}
