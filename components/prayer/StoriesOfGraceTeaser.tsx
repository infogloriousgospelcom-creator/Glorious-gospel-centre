import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";

/**
 * Encouragement teaser — links to moderated Stories of Grace when available.
 */
export function StoriesOfGraceTeaser() {
  return (
    <Section>
      <Container width="prose" className="text-center">
        <SectionReveal>
          <SectionEyebrow>Encourage</SectionEyebrow>
          <SectionTitle>God is still working</SectionTitle>
          <SectionLead className="mx-auto">
            Across GGCC, people continue to trust God in every season. Read approved Stories
            of Grace, or share how God has been faithful in your life for review.
          </SectionLead>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="/testimonies">Stories of Grace</LinkButton>
            <LinkButton href="/testimonies/share" variant="secondary">
              Share Your Story
            </LinkButton>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
