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
          <div className="mx-auto max-w-2xl">
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
                <div className="mt-6">
                  <LinkButton href="/services" size="sm">
                    View Service Schedule
                  </LinkButton>
                </div>
              </div>
            </SectionReveal>
          </div>
        )}
      </Container>
    </Section>
  );
}
