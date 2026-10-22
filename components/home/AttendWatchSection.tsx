import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";

export function AttendWatchSection() {
  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Join us</SectionEyebrow>
            <SectionTitle>Attend in person or watch online</SectionTitle>
            <SectionLead>
              Whether you are local to Kitengela or joining from afar, there is a place for you.
            </SectionLead>
          </div>
        </SectionReveal>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <SectionReveal delay={0.08}>
            <div className="border-t border-accent-400/80 pt-6">
              <h3 className="heading-3 mb-2">Attend in Person</h3>
              <p className="mb-5 text-sm leading-relaxed text-ink-muted sm:text-base">
                Come worship with us at SIZERS-KITENGELA. Find service times, parking, and what to
                expect when you arrive.
              </p>
              <LinkButton href="/visit">Plan Your Visit</LinkButton>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.14}>
            <div className="border-t border-brand-200 pt-6">
              <h3 className="heading-3 mb-2">Watch Online</h3>
              <p className="mb-5 text-sm leading-relaxed text-ink-muted sm:text-base">
                Follow GGCC online — join worship and teaching through our livestream platforms.
              </p>
              <LinkButton href="/livestream" variant="secondary">
                Watch Online
              </LinkButton>
            </div>
          </SectionReveal>
        </div>
      </Container>
    </Section>
  );
}
