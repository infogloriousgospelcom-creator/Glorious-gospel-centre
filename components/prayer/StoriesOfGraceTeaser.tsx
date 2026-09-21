import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";

/**
 * Conceptual encouragement only — no testimony database or fabricated stories.
 */
export function StoriesOfGraceTeaser() {
  return (
    <Section>
      <Container width="prose" className="text-center">
        <SectionReveal>
          <SectionEyebrow>Encourage</SectionEyebrow>
          <SectionTitle>God is still working</SectionTitle>
          <SectionLead className="mx-auto">
            Across GGCC, people continue to trust God in every season. Strengthen your faith
            through the Word, worship, and community — and know that prayer is never wasted.
          </SectionLead>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="/sermons">Explore Sermons</LinkButton>
            <LinkButton href="/visit" variant="secondary">
              Plan Your Visit
            </LinkButton>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
