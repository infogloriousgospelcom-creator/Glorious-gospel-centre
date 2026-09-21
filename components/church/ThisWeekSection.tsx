import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead, EmptyState } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  getPublishedServices,
  getUpcomingEvents,
  groupServicesByDay,
} from "@/services/content";
import { dayName } from "@/types/content";
import { SectionReveal } from "@/components/motion/SectionReveal";

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Weekly rhythm from existing services + upcoming events — no new calendar DB.
 */
export async function ThisWeekSection() {
  const [services, events] = await Promise.all([
    getPublishedServices(),
    getUpcomingEvents(3),
  ]);
  const byDay = groupServicesByDay(services);

  return (
    <Section className="bg-surface-muted">
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>This week</SectionEyebrow>
            <SectionTitle>This week at GGCC</SectionTitle>
            <SectionLead>
              Here is what is happening at Glorious Gospel Centre Church this week.
            </SectionLead>
          </div>
        </SectionReveal>

        {services.length === 0 && events.length === 0 ? (
          <EmptyState
            title="Schedule coming soon"
            description="Weekly services and events will appear here once published."
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-2">
            <SectionReveal delay={0.08}>
              <div>
                <h3 className="heading-3 mb-4">Weekly gatherings</h3>
                {byDay.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    Service times will appear once published.{" "}
                    <Link href="/services" className="brand-link">
                      View services
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="space-y-5">
                    {byDay.map(({ day, label, services: dayServices }) => (
                      <li key={day}>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                          {label || dayName(day)}
                        </p>
                        <ul className="mt-2 divide-y divide-border border-y border-border">
                          {dayServices.map((s) => (
                            <li
                              key={s.id}
                              className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
                            >
                              <span className="font-medium text-brand-900">{s.name}</span>
                              <span className="shrink-0 text-ink-muted">
                                {formatTime(s.start_time)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-5">
                  <LinkButton href="/services" variant="ghost" size="sm" className="px-0">
                    Full service schedule →
                  </LinkButton>
                </p>
              </div>
            </SectionReveal>

            <SectionReveal delay={0.14}>
              <div>
                <h3 className="heading-3 mb-4">Upcoming events</h3>
                {events.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    No upcoming events are listed right now.{" "}
                    <Link href="/events" className="brand-link">
                      Browse events
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="divide-y divide-border border-y border-border">
                    {events.map((e) => (
                      <li key={e.id}>
                        <Link
                          href={`/events/${e.slug}`}
                          className="group flex min-h-touch flex-col justify-center gap-1 py-4 transition-colors duration-ui ease-smooth"
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                            {formatEventDate(e.starts_at)}
                            {e.location ? ` · ${e.location}` : ""}
                          </span>
                          <span className="font-display text-base font-semibold text-brand-900 group-hover:text-brand-700">
                            {e.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-5">
                  <LinkButton href="/events" variant="ghost" size="sm" className="px-0">
                    View all events →
                  </LinkButton>
                </p>
              </div>
            </SectionReveal>
          </div>
        )}
      </Container>
    </Section>
  );
}
