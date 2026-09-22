import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { TestimonyCard } from "@/components/testimonies/TestimonyCard";
import { getApprovedTestimonies } from "@/services/testimonies";

/**
 * Compact homepage band — only renders when approved stories exist.
 */
export async function StoriesOfGraceHomeSection() {
  const testimonies = await getApprovedTestimonies(2);
  if (testimonies.length === 0) return null;

  return (
    <Section className="bg-surface-muted">
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Stories of Grace</SectionEyebrow>
            <SectionTitle>God is still working</SectionTitle>
            <SectionLead>
              Recent stories shared by our church family — reviewed and published with care.
            </SectionLead>
          </div>
        </SectionReveal>
        <SectionReveal delay={0.08}>
          <ul className="mx-auto grid max-w-3xl gap-8">
            {testimonies.map((t) => (
              <TestimonyCard key={t.id} testimony={t} />
            ))}
          </ul>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="/testimonies">More Stories</LinkButton>
            <LinkButton href="/testimonies/share" variant="secondary">
              Share Your Story
            </LinkButton>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
