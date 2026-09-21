import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";

/**
 * Conceptual fellowship invitation only — no Connect Groups listings or data.
 */
export function ConnectAtGgcc() {
  return (
    <Section>
      <Container width="prose" className="text-center">
        <SectionReveal>
          <SectionEyebrow>Community</SectionEyebrow>
          <SectionTitle>Connect at GGCC</SectionTitle>
          <SectionLead className="mx-auto">
            Faith grows in relationship — through Sunday worship, ministries, prayer, and
            everyday fellowship. Explore a ministry that fits where you are, or speak with us
            about taking a next step.
          </SectionLead>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="/ministries">Explore Ministries</LinkButton>
            <LinkButton href="/contact" variant="secondary">
              Contact Us
            </LinkButton>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
