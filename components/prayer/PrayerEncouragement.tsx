import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { SectionReveal } from "@/components/motion/SectionReveal";

const SCRIPTURES = [
  {
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    reference: "Philippians 4:6",
  },
  {
    text: "The prayer of a righteous person is powerful and effective.",
    reference: "James 5:16",
  },
] as const;

export function PrayerEncouragement() {
  return (
    <Section className="bg-surface-muted">
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Encouragement</SectionEyebrow>
            <SectionTitle>Bring your heart to God</SectionTitle>
            <SectionLead>
              Scripture invites us to pray with honesty and hope. You are not alone —
              God hears, and the church stands with you.
            </SectionLead>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.08}>
          <ul className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
            {SCRIPTURES.map((s) => (
              <li key={s.reference} className="border-t border-border pt-5">
                <blockquote>
                  <p className="font-display text-lg font-semibold leading-snug text-brand-900 sm:text-xl">
                    &ldquo;{s.text}&rdquo;
                  </p>
                  <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                    {s.reference}
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        </SectionReveal>
      </Container>
    </Section>
  );
}
