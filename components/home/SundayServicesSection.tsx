import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { getPublishedServices } from "@/services/content";
import { dayName } from "@/types/content";
import { SectionReveal } from "@/components/motion/SectionReveal";

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

export async function SundayServicesSection() {
  const all = await getPublishedServices();
  const sunday = all
    .filter((s) => s.day_of_week === 0)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const midweek = all
    .filter((s) => s.day_of_week !== 0)
    .sort((a, b) => {
      const da = a.day_of_week === 0 ? 7 : a.day_of_week;
      const db = b.day_of_week === 0 ? 7 : b.day_of_week;
      return da - db || a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 4);

  return (
    <Section id="sunday-services" className="bg-surface-muted">
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Gather with us</SectionEyebrow>
            <SectionTitle>Sunday services</SectionTitle>
            <SectionLead>
              Come as you are — we gather to worship Jesus, hear the Word, and pray together.
            </SectionLead>
          </div>
        </SectionReveal>

        {sunday.length === 0 && all.length === 0 ? (
          <EmptyState
            title="Service times coming soon"
            description="Add weekly services in the admin to populate this section."
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <SectionReveal delay={0.08}>
              <div>
                <h3 className="heading-3 mb-4">This Sunday</h3>
                {sunday.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    Sunday times will appear here once published.{" "}
                    <Link href="/services" className="brand-link">
                      View service schedule
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="divide-y divide-border border-y border-border">
                    {sunday.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-baseline justify-between gap-4 py-4"
                      >
                        <div>
                          <p className="font-medium text-brand-900">{s.name}</p>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {dayName(s.day_of_week)}
                            {s.location ? ` · ${s.location}` : ""}
                          </p>
                          {s.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                              {s.description}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-brand-700">
                          {formatTime(s.start_time)}
                          {s.end_time ? ` – ${formatTime(s.end_time)}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <LinkButton href="/services" size="sm">
                    View Service Schedule
                  </LinkButton>
                  <LinkButton href="/visit" variant="secondary" size="sm">
                    Plan Your Visit
                  </LinkButton>
                </div>
              </div>
            </SectionReveal>

            <SectionReveal delay={0.16}>
              <div>
                <h3 className="heading-3 mb-4">During the week</h3>
                {midweek.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    Midweek gatherings are listed on our{" "}
                    <Link href="/services" className="brand-link">
                      services page
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {midweek.map((s) => (
                      <li key={s.id} className="flex justify-between gap-3 text-sm">
                        <span className="text-ink">
                          <span className="font-medium text-brand-800">
                            {dayName(s.day_of_week)}
                          </span>
                          {" · "}
                          {s.name}
                        </span>
                        <span className="shrink-0 text-ink-muted">
                          {formatTime(s.start_time)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-5">
                  <Link
                    href="/services"
                    className="text-sm font-semibold text-brand-700 transition-colors duration-ui ease-smooth hover:text-brand-800"
                  >
                    Full weekly schedule →
                  </Link>
                </p>
              </div>
            </SectionReveal>
          </div>
        )}
      </Container>
    </Section>
  );
}
