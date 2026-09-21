import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionReveal } from "@/components/motion/SectionReveal";

export function PrayerCtaSection() {
  return (
    <Section className="bg-accent-50">
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <SectionReveal>
            <div>
              <p className="eyebrow mb-3 text-accent-700">Prayer</p>
              <h2 className="heading-2 mb-4 text-balance">
                How can we pray with you?
              </h2>
              <p className="lead mb-6 max-w-xl text-balance">
                We believe in the power of prayer. Share your prayer request and
                our prayer team will lift it up. All requests are kept confidential.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/prayer">
                  <Button variant="accent">Submit a prayer request</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="secondary" className="border-accent-200 text-accent-700 hover:bg-accent-50/60">
                    Contact us
                  </Button>
                </Link>
              </div>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.15}>
            <div className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-border">
              <p className="font-display text-2xl font-semibold text-brand-900">
                &ldquo;The prayer of a righteous person is powerful and effective.&rdquo;
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                James 5:16
              </p>
            </div>
          </SectionReveal>
        </div>
      </Container>
    </Section>
  );
}
