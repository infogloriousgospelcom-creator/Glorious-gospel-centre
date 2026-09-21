import { Container, Section } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";

export function PrayerCtaSection() {
  return (
    <Section className="bg-accent-50">
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <SectionReveal>
            <div>
              <p className="eyebrow mb-3 text-accent-700">Prayer Center</p>
              <h2 className="heading-2 mb-4 text-balance">
                You&apos;re not alone. Bring your prayer to God.
              </h2>
              <p className="lead mb-6 max-w-xl text-balance">
                Share a confidential prayer request with our prayer team, or join us as we
                seek God together.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <LinkButton href="/prayer" variant="accent">
                  Request Prayer
                </LinkButton>
                <LinkButton href="/prayer#prayer-request" variant="ghost">
                  Go to the form
                </LinkButton>
              </div>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.12}>
            <blockquote className="border-l-2 border-accent-400 pl-6">
              <p className="font-display text-xl font-semibold leading-snug text-brand-900 sm:text-2xl">
                &ldquo;The prayer of a righteous person is powerful and effective.&rdquo;
              </p>
              <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                James 5:16
              </footer>
            </blockquote>
          </SectionReveal>
        </div>
      </Container>
    </Section>
  );
}
