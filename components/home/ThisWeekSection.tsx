import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import Link from "next/link";
import { getPublishedServices, getUpcomingEvents } from "@/services/content";
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
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export async function ThisWeekSection() {
  const [allServices, events] = await Promise.all([
    getPublishedServices(),
    getUpcomingEvents(3),
  ]);

  const services = [...allServices].sort((a, b) => {
    const da = a.day_of_week === 0 ? 7 : a.day_of_week;
    const db = b.day_of_week === 0 ? 7 : b.day_of_week;
    return da - db || a.start_time.localeCompare(b.start_time);
  });

  return (
    <Section className="bg-surface-muted">
      <Container>
        <SectionReveal>
          <div className="mb-10 text-center">
            <SectionEyebrow>This week</SectionEyebrow>
            <SectionTitle>At Glorious Gospel Centre Church</SectionTitle>
          </div>
        </SectionReveal>

        <div className="grid gap-8 lg:grid-cols-2">
          <SectionReveal delay={0.1}>
            <div>
              <h3 className="heading-3 mb-4">Weekly services</h3>
              {services.length === 0 ? (
                <EmptyState
                  title="Service times coming soon"
                  description="Add weekly services in the admin to populate this section."
                />
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
                  {services.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="font-medium text-brand-900">{s.name}</p>
                        {s.location ? (
                          <p className="text-xs text-ink-muted">{s.location}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-brand-700">
                          {dayName(s.day_of_week)}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {formatTime(s.start_time)}
                          {s.end_time ? `–${formatTime(s.end_time)}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 text-right">
                <Link
                  href="/services"
                  className="text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
                >
                  Full schedule →
                </Link>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.2}>
            <div>
              <h3 className="heading-3 mb-4">Upcoming events</h3>
              {events.length === 0 ? (
                <EmptyState
                  title="No upcoming events"
                  description="Schedule an event in the admin to see it here."
                />
              ) : (
                <div className="grid gap-4">
                  {events.map((e) => (
                    <Card key={e.id} hoverable>
                      <CardHeader>
                        <p className="eyebrow">
                          {formatEventDate(e.starts_at)}
                          {e.location ? ` · ${e.location}` : ""}
                        </p>
                        <CardTitle>{e.title}</CardTitle>
                      </CardHeader>
                      {e.short_description ? (
                        <CardBody>
                          <p className="text-sm text-ink-muted">
                            {e.short_description}
                          </p>
                        </CardBody>
                      ) : null}
                      <CardFooter>
                        <span className="text-xs text-ink-muted">
                          {e.registration_required ? "Registration required" : "Open to all"}
                        </span>
                        <Link
                          href={`/events/${e.slug}`}
                          className="text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
                        >
                          Details →
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </SectionReveal>
        </div>
      </Container>
    </Section>
  );
}
