import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { SectionReveal } from "@/components/motion/SectionReveal";

const journey = [
  {
    key: "COME",
    title: "Come",
    body: "Discover GGCC and plan your visit — in Kitengela or online.",
    href: "/visit",
  },
  {
    key: "CONNECT",
    title: "Connect",
    body: "Find a ministry or reach out — we would love to walk with you.",
    href: "/ministries",
  },
  {
    key: "GROW",
    title: "Grow",
    body: "Engage with sermons and teaching from the Word.",
    href: "/sermons",
  },
  {
    key: "SERVE",
    title: "Serve",
    body: "Explore ways to participate in the life of the church.",
    href: "/ministries",
  },
  {
    key: "GIVE",
    title: "Give",
    body: "Partner with the work of the Gospel through your giving.",
    href: "/give",
  },
  {
    key: "GO",
    title: "Go",
    body: "Invite someone and take the hope of Christ into everyday life.",
    href: "/visit#invite",
  },
] as const;

/**
 * Public informational pathway — no accounts, tracking, or progress storage.
 */
export function JourneyPathway({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Section className={compact ? undefined : "bg-surface-muted"}>
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Your journey</SectionEyebrow>
            <SectionTitle>Come · Connect · Grow · Serve · Give · Go</SectionTitle>
            <SectionLead>
              A simple pathway for life with GGCC — choose the step that fits where you are today.
            </SectionLead>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.08}>
          <ol className="mx-auto grid max-w-5xl gap-0 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((step, index) => (
              <li key={step.key} className="border-t border-border px-0 py-0 sm:px-4">
                <Link
                  href={step.href}
                  className="group flex min-h-touch flex-col justify-center py-5 transition-colors duration-ui ease-smooth"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
                    {String(index + 1).padStart(2, "0")} · {step.key}
                  </span>
                  <span className="mt-1 font-display text-lg font-semibold text-brand-900 group-hover:text-brand-700">
                    {step.title}
                    <span
                      aria-hidden="true"
                      className="ml-2 inline-block transition-transform duration-ui ease-smooth group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </span>
                  <span className="mt-1 text-sm text-ink-muted">{step.body}</span>
                </Link>
              </li>
            ))}
          </ol>
        </SectionReveal>
      </Container>
    </Section>
  );
}
