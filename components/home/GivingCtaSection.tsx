import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";

export function GivingCtaSection() {
  return (
    <Section className="bg-brand-700 text-white">
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-300">
              Generosity
            </p>
            <h2 className="heading-2 mb-4 text-white text-balance">
              Partner with our ministry
            </h2>
            <p className="lead mb-6 max-w-2xl text-brand-50">
              Your tithes, offerings, and designated gifts enable the work of
              the Gospel in our church and beyond. Every gift matters.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/give"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
              >
                Give now
              </Link>
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Why we give
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-sm text-brand-50">
            <p className="font-serif text-lg font-semibold text-white">
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
        </div>
      </Container>
    </Section>
  );
}
