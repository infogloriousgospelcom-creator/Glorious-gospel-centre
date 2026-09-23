import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";

const steps = [
  {
    title: "Find your place",
    body: "Browse ministries and notice where your interests and the church\u2019s needs meet.",
  },
  {
    title: "Discover your gifts",
    body: "God equips people in different ways — listening, welcoming, teaching, creating, caring, and more.",
  },
  {
    title: "Serve through ministry",
    body: "Join an existing ministry team and grow alongside others who love Jesus.",
  },
  {
    title: "Express interest",
    body: "Tell the church where you would like to serve. A leader will review your interest and follow up.",
  },
] as const;

/**
 * Public serve invitation. Phase K adds a structured interest form on /serve.
 */
export function ServeAtGgcc({
  variant = "section",
}: {
  variant?: "section" | "page";
}) {
  const isPage = variant === "page";

  return (
    <Section className={isPage ? undefined : "bg-surface-muted"}>
      <Container>
        <SectionReveal>
          <div className={`mx-auto mb-10 max-w-2xl ${isPage ? "text-left" : "text-center"}`}>
            <SectionEyebrow>Serve</SectionEyebrow>
            <SectionTitle>Serve at GGCC</SectionTitle>
            <SectionLead className={isPage ? "mx-0" : undefined}>
              Every ministry is an invitation to participate in the life of the church —
              discovering, connecting, and serving together.
            </SectionLead>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.08}>
          <ol className="mx-auto grid max-w-5xl gap-0 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="border-t border-border px-0 py-5 sm:px-4 sm:odd:border-r sm:odd:pr-8 sm:even:pl-8"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-brand-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </SectionReveal>

        <SectionReveal delay={0.14}>
          <div
            className={`mt-10 flex flex-col gap-3 sm:flex-row sm:items-center ${
              isPage ? "" : "justify-center"
            }`}
          >
            <LinkButton href="/serve#express-interest">Express Interest</LinkButton>
            <LinkButton href="/ministries" variant="secondary">
              Explore Ministries
            </LinkButton>
            <LinkButton href="/contact" variant="ghost">
              Contact GGCC
            </LinkButton>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
