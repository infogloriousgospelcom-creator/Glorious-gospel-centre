import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionReveal } from "@/components/motion/SectionReveal";

export function GivingCtaSection() {
  return (
    <Section className="relative overflow-hidden bg-brand-800 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-400/10 blur-3xl"
      />
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <SectionReveal>
            <div>
              <p className="eyebrow mb-3 text-accent-400">Generosity</p>
              <h2 className="heading-2 mb-4 text-white text-balance">
                Partner with our ministry
              </h2>
              <p className="lead mb-6 max-w-2xl text-brand-100">
                Your tithes, offerings, and designated gifts enable the work of
                the Gospel in our church and beyond. Every gift matters.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/give">
                  <Button variant="accent">Give now</Button>
                </Link>
                <Link href="/about">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Why we give
                  </Button>
                </Link>
              </div>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.15}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-brand-50 backdrop-blur">
              <p className="font-display text-lg font-semibold text-white">
                Ways to give
              </p>
              <ul className="mt-3 space-y-2">
                <li>· Tithe</li>
                <li>· Offering</li>
                <li>· Missions</li>
                <li>· Other designated giving</li>
              </ul>
              <p className="mt-4 text-xs text-brand-100">
                Payment options (M-Pesa, bank, online) are configured in the
                admin settings.
              </p>
            </div>
          </SectionReveal>
        </div>
      </Container>
    </Section>
  );
}
