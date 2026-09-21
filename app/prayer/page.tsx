import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { PrayerRequestForm } from "./_components/PrayerRequestForm";
import { PrayerEncouragement } from "@/components/prayer/PrayerEncouragement";
import { PrayerWays } from "@/components/prayer/PrayerWays";
import { PrayerCategoryHints } from "@/components/prayer/PrayerCategoryHints";
import { StoriesOfGraceTeaser } from "@/components/prayer/StoriesOfGraceTeaser";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { buildPageMetadata } from "@/lib/seo";
import { getPublishedServices } from "@/services/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Prayer Center",
  description:
    "You're not alone. Bring your prayer to God — submit a confidential prayer request to Glorious Gospel Centre Church, or join us as we pray together.",
  path: "/prayer",
  keywords: ["prayer request", "prayer center", "confidential prayer", "intercessory", "GGCC"],
});

export default async function PrayerPage() {
  const services = await getPublishedServices();
  const intercessoryServices = services.filter((s) =>
    /intercess/i.test(s.name),
  );

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Prayer Center"
          title="You're not alone. Bring your prayer to God."
          description="Share a confidential request with our prayer team, join the church in prayer, or reach out when you need pastoral support. Every need matters."
        >
          <LinkButton href="#prayer-request">Submit a Prayer Request</LinkButton>
          <LinkButton href="/visit" variant="secondary">
            Visit Us
          </LinkButton>
        </PageHeader>

        <PrayerEncouragement />

        <PrayerWays intercessoryServices={intercessoryServices} />

        <Section id="prayer-request" className="bg-surface-muted scroll-mt-24">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <SectionReveal>
                <div className="border-t border-border pt-6">
                  <SectionEyebrow>Confidential</SectionEyebrow>
                  <SectionTitle className="text-left">Submit a prayer request</SectionTitle>
                  <SectionLead className="mx-0">
                    Tell us how we can pray. Your request is reviewed by authorized prayer
                    team members — it is never listed publicly on this website.
                  </SectionLead>
                  <div className="mt-8">
                    <PrayerRequestForm />
                  </div>
                </div>
              </SectionReveal>

              <SectionReveal delay={0.1}>
                <aside className="space-y-8 lg:pt-6">
                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Confidentiality
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      Prayer requests are stored securely and visible only to staff with
                      prayer-team access. We do not publish names, contact details, or
                      request text on the public site.
                    </p>
                  </div>

                  <PrayerCategoryHints />

                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Need immediate help?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      If you are in crisis or need urgent pastoral care, please{" "}
                      <a href="/contact" className="brand-link font-medium">
                        contact the church
                      </a>{" "}
                      directly. For emergencies, dial your local emergency number.
                    </p>
                  </div>

                  <blockquote className="border-l-2 border-accent-400 pl-5">
                    <p className="font-display text-lg font-semibold text-brand-900">
                      &ldquo;Cast all your anxiety on him because he cares for you.&rdquo;
                    </p>
                    <footer className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                      1 Peter 5:7
                    </footer>
                  </blockquote>
                </aside>
              </SectionReveal>
            </div>
          </Container>
        </Section>

        <StoriesOfGraceTeaser />

        <ContextualNextSteps
          title="Take the next step"
          description="Prayer is part of a wider journey — grow in the Word, find community, and worship with us."
          actions={[
            { href: "/sermons", label: "Watch a Sermon" },
            { href: "/ministries", label: "Find a Ministry", variant: "secondary" },
            { href: "/services", label: "Attend a Service", variant: "ghost" },
          ]}
          surface="muted"
        />
      </main>
      <Footer />
    </>
  );
}
