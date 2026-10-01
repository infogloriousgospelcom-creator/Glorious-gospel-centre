import { Container, Section } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { getActiveAnnouncements } from "@/services/content";
import { announcementExcerpt } from "@/lib/announcements";

/**
 * Public Church Notices. Hidden when none are published and in-window.
 * Same source as /account — not a personal inbox.
 */
export async function ChurchNoticesSection() {
  const announcements = await getActiveAnnouncements();
  if (announcements.length === 0) return null;

  return (
    <Section className="bg-surface-muted">
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <SectionEyebrow>This week</SectionEyebrow>
            <SectionTitle>Church Notices</SectionTitle>
          </div>
        </SectionReveal>
        <SectionReveal delay={0.06}>
          <ul className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
            {announcements.map((a) => (
              <li key={a.id} className="py-4">
                <div className="flex flex-wrap items-center gap-2">
                  {a.is_pinned ? <Badge tone="brand">Pinned</Badge> : null}
                  <p className="font-display text-base font-semibold text-brand-900">
                    {a.title}
                  </p>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {announcementExcerpt(a.body)}
                </p>
              </li>
            ))}
          </ul>
        </SectionReveal>
      </Container>
    </Section>
  );
}
