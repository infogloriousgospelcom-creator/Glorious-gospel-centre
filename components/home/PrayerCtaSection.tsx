import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";

export function PrayerCtaSection() {
  return (
    <Section className="bg-accent-50">
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-700">
              Prayer
            </p>
            <h2 className="heading-2 mb-4 text-balance">
              How can we pray with you?
            </h2>
            <p className="lead mb-6 max-w-xl text-balance">
              We believe in the power of prayer. Share your prayer request and
              our prayer team will lift it up. All requests are kept confidential.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/prayer"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-accent-600 px-5 text-sm font-medium text-white transition-colors hover:bg-accent-700"
              >
                Submit a prayer request
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-accent-300 bg-white px-5 text-sm font-medium text-accent-800 transition-colors hover:bg-accent-50"
              >
                Contact us
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-soft">
            <p className="font-serif text-2xl font-semibold text-ink">
              &ldquo;The prayer of a righteous person is powerful and effective.&rdquo;
            </p>
            <p className="mt-3 text-sm text-ink-muted">James 5:16</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
