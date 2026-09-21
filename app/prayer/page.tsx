import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { PrayerRequestForm } from "./_components/PrayerRequestForm";
import { buildPageMetadata } from "@/lib/seo";
import { SectionReveal } from "@/components/motion/SectionReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Prayer Request",
  description:
    "Submit a confidential prayer request to our prayer team. Every request is reviewed and prayed over by a staff member.",
  path: "/prayer",
  keywords: ["prayer request", "confidential prayer", "prayer team"],
});

export default function PrayerPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Prayer"
          title="How can we pray for you?"
          description="We believe in the power of prayer. Share your request and our prayer team will lift it up. All submissions are kept confidential."
        >
          <LinkButton href="/contact" variant="secondary">
            Contact the church
          </LinkButton>
          <LinkButton href="/visit" variant="ghost">
            Plan Your Visit
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
              <SectionReveal>
                <Card>
                  <CardHeader>
                    <CardTitle>Submit a prayer request</CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    <PrayerRequestForm />
                  </div>
                </Card>
              </SectionReveal>

              <SectionReveal delay={0.12}>
                <aside className="space-y-8">
                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Confidentiality
                    </h2>
                    <p className="mt-2 text-sm text-ink-muted">
                      Your prayer request is reviewed only by authorized members of our prayer
                      team. We never share your personal details publicly.
                    </p>
                  </div>
                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Need immediate help?
                    </h2>
                    <p className="mt-2 text-sm text-ink-muted">
                      If you are in crisis or require urgent pastoral care, please contact our
                      office directly during business hours. For emergencies, dial your local
                      emergency number.
                    </p>
                  </div>
                  <blockquote className="border-l-2 border-accent-400 pl-5">
                    <p className="font-display text-lg font-semibold text-brand-900">
                      &ldquo;The prayer of a righteous person is powerful and effective.&rdquo;
                    </p>
                    <footer className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                      James 5:16
                    </footer>
                  </blockquote>
                </aside>
              </SectionReveal>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
