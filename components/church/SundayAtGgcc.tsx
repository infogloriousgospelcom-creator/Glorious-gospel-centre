import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";

const phases = [
  {
    title: "Before you come",
    body: "Find our location, check Sunday service times, and decide whether to attend in person or join online.",
  },
  {
    title: "When you arrive",
    body: "Come as you are. A greeter can help you find a seat and point you to Children's Ministry or Youth if you are visiting with family.",
  },
  {
    title: "During the service",
    body: "Expect prayer, praise, and teaching from Scripture — a gathering centered on Jesus, open to first-time guests.",
  },
  {
    title: "After the service",
    body: "Take a moment to meet someone new, explore a ministry, request prayer, or simply say hello.",
  },
] as const;

/**
 * First-time Sunday orientation — factual GGCC visitor guidance only.
 */
export function SundayAtGgcc() {
  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>I&apos;m new here</SectionEyebrow>
            <SectionTitle>Your Sunday at GGCC</SectionTitle>
            <SectionLead>
              A simple walkthrough so your first visit feels clear and welcoming.
            </SectionLead>
          </div>
        </SectionReveal>

        <ol className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
          {phases.map((phase, i) => (
            <SectionReveal key={phase.title} delay={0.05 * (i + 1)}>
              <li className="border-t border-border pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-brand-900">
                  {phase.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
                  {phase.body}
                </p>
              </li>
            </SectionReveal>
          ))}
        </ol>

        <SectionReveal delay={0.2}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="#service-times">See service times</LinkButton>
            <LinkButton href="/livestream" variant="secondary">
              Watch Online
            </LinkButton>
            <LinkButton href="/ministries" variant="ghost">
              Explore Ministries
            </LinkButton>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
