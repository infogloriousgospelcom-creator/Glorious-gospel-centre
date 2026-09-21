import { Container, Section } from "@/components/ui/Container";
import { SectionReveal } from "@/components/motion/SectionReveal";

export function ScriptureBandSection() {
  return (
    <Section spacing="compact" className="bg-brand-900 text-brand-50">
      <Container>
        <SectionReveal>
          <blockquote className="mx-auto max-w-3xl text-center">
            <p
              className="text-xl italic leading-snug text-white sm:text-2xl md:text-3xl"
              style={{ fontFamily: "var(--font-display-serif), Georgia, serif" }}
            >
              &ldquo;If God be for us, who can be against us?&rdquo;
            </p>
            <footer className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">
              Romans 8:31
            </footer>
          </blockquote>
        </SectionReveal>
      </Container>
    </Section>
  );
}
