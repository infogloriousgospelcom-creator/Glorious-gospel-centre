import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { SectionReveal } from "@/components/motion/SectionReveal";

const steps = [
  {
    href: "/visit",
    pathway: "I'm New",
    label: "Plan Your Visit",
    description: "Service times, location, and what to expect.",
  },
  {
    href: "/prayer",
    pathway: "I Need Prayer",
    label: "Submit a prayer request",
    description: "Share a confidential need with our prayer team.",
  },
  {
    href: "/sermons",
    pathway: "I Want to Grow",
    label: "Discover sermons",
    description: "Watch and listen to teaching from the Word.",
  },
  {
    href: "/ministries",
    pathway: "I Want to Serve",
    label: "Explore ministries",
    description: "Find a place to belong, grow, and serve.",
  },
  {
    href: "/give",
    pathway: "I Want to Give",
    label: "Support the work",
    description: "Partner with the Gospel through your giving.",
  },
] as const;

export function NextStepSection() {
  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Next steps</SectionEyebrow>
            <SectionTitle>What&apos;s your next step?</SectionTitle>
            <SectionLead>
              Choose one simple pathway — we are glad you are here.
            </SectionLead>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <ul className="mx-auto grid max-w-4xl gap-0 sm:grid-cols-2">
            {steps.map((step) => (
              <li
                key={step.href}
                className="border-t border-border sm:odd:border-r sm:odd:pr-8 sm:even:pl-8"
              >
                <Link
                  href={step.href}
                  className="group flex min-h-touch flex-col justify-center py-5 transition-colors duration-ui ease-smooth"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                    {step.pathway}
                  </span>
                  <span className="mt-1 font-display text-base font-semibold text-brand-900 group-hover:text-brand-700">
                    {step.label}
                    <span
                      aria-hidden="true"
                      className="ml-2 inline-block transition-transform duration-ui ease-smooth group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </span>
                  <span className="mt-1 text-sm text-ink-muted">{step.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionReveal>
      </Container>
    </Section>
  );
}
