import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionEyebrow } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Hospitality Ministry",
  description:
    "GGCC's Hospitality Ministry — caring for orphans, vulnerable people, and providing food support to those in need.",
  path: "/ministries/hospitality",
  keywords: ["hospitality ministry", "community care", "orphans", "feeding programme", "GGCC"],
});

export default async function HospitalityMinistryPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Mission & Outreach"
          title="Hospitality Ministry"
          description="The Hospitality Ministry of Glorious Gospel Centre Church exists to show the love of Christ through practical care. We support orphans, vulnerable children, families, and those experiencing food insecurity."
        >
          <LinkButton href="/serve">Serve at GGCC</LinkButton>
          <LinkButton href="/give" variant="secondary">
            Give
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <div className="mx-auto max-w-3xl space-y-12">
              <article className="prose prose-brand max-w-none">
                <h2 className="heading-3">About the Ministry</h2>
                <p>
                  Hospitality is more than welcoming people into a building. It is about seeing people
                  as they are and responding with the love of Christ.
                </p>
                <p>
                  Through the Hospitality Ministry, Glorious Gospel Centre Church seeks to care for
                  those who are vulnerable, overlooked, or in need of practical support. We believe
                  that every act of kindness — whether a meal, a word of encouragement, or simply
                  being present — can reflect the compassion of Jesus.
                </p>
                <p>The ministry operates through two key areas:</p>
              </article>

              <div className="grid gap-8 sm:grid-cols-2">
                <Link
                  href="/ministries/hospitality/orphans"
                  className="group block border-t border-border pt-5"
                >
                  <SectionEyebrow>Area of focus</SectionEyebrow>
                  <h3 className="mt-2 font-display text-xl font-semibold text-brand-900 transition-colors duration-ui group-hover:text-brand-700">
                    Orphans &amp; Vulnerable Persons
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    Caring for orphans, vulnerable children, and individuals or families facing
                    difficult circumstances. We offer practical support, encouragement, and
                    the dignity of knowing they are valued.
                  </p>
                  <span className="mt-4 inline-block text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800">
                    Learn more →
                  </span>
                </Link>

                <Link
                  href="/ministries/hospitality/feeding"
                  className="group block border-t border-border pt-5"
                >
                  <SectionEyebrow>Area of focus</SectionEyebrow>
                  <h3 className="mt-2 font-display text-xl font-semibold text-brand-900 transition-colors duration-ui group-hover:text-brand-700">
                    Feeding Programme
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    Providing meals and food support to people experiencing need. A meal can meet
                    an immediate need, but it also creates an opportunity to show someone they are
                    seen and cared for.
                  </p>
                  <span className="mt-4 inline-block text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800">
                    Learn more →
                  </span>
                </Link>
              </div>
            </div>
          </Container>
        </Section>

        <ContextualNextSteps
          title="How can I participate?"
          description="Support Hospitality through prayer, giving, or by starting a conversation about serving."
          actions={[
            { href: "/serve", label: "Serve at GGCC" },
            { href: "/give", label: "Give", variant: "secondary" },
            { href: "/contact", label: "Contact Us", variant: "ghost" },
          ]}
          surface="muted"
        />
      </main>
      <Footer />
    </>
  );
}
