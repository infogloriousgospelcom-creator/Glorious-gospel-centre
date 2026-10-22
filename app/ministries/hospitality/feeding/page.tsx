import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Feeding Programme",
  description:
    "GGCC's Feeding Programme — providing meals and practical support to people in need through the Hospitality Ministry.",
  path: "/ministries/hospitality/feeding",
  keywords: ["feeding programme", "food support", "hospitality ministry", "community outreach", "GGCC"],
});

export default async function FeedingProgrammePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Hospitality Ministry"
          title="Feeding Programme"
          description="Part of the Hospitality Ministry of Glorious Gospel Centre Church. It provides food and practical support to people who are experiencing need."
        >
          <LinkButton href="/ministries/hospitality" variant="secondary">
            Hospitality Ministry
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <div className="mx-auto max-w-3xl space-y-12">
              <article className="space-y-12 text-base leading-8 tracking-normal text-ink sm:text-lg sm:leading-9">
                <p className="text-lg leading-9 text-ink-muted sm:text-xl sm:leading-10">
                  A meal can meet an immediate need, but it can also create an opportunity to show
                  someone that they are seen, valued and cared for.
                </p>

                <div className="space-y-5">
                  <h2 className="heading-3">What We Do</h2>
                  <p className="text-ink-muted">The programme focuses on:</p>
                  <ul className="list-disc space-y-3 pl-6 text-ink">
                    <li>Providing meals and food support to people in need.</li>
                    <li>Reaching individuals and families experiencing hardship.</li>
                    <li>Supporting community outreach activities.</li>
                    <li>Mobilising church members to share what they have.</li>
                    <li>Encouraging generosity and practical service.</li>
                    <li>Showing the compassion of Christ through acts of care.</li>
                  </ul>
                </div>

                <div className="space-y-5">
                  <h2 className="heading-3">Serving Our Community</h2>
                  <p className="text-ink-muted">
                    The Feeding Programme gives members of the church an opportunity to serve in a
                    practical way.
                  </p>
                  <p className="text-ink-muted">
                    Some may contribute food or financial support. Others may volunteer their time during
                    preparation, distribution or outreach activities.
                  </p>
                  <p className="text-ink-muted">
                    The goal is simple: to help meet practical needs while demonstrating the love of
                    Christ.
                  </p>
                </div>
              </article>

              <div className="border-t border-border pt-8">
                <h3 className="heading-4 mb-4">Get Involved</h3>
                <p className="mb-6 leading-8 text-ink-muted">
                  You can support the Feeding Programme through giving, volunteering, and prayer.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <LinkButton href="/give">Give to the programme</LinkButton>
                  <LinkButton href="/contact" variant="secondary">
                    Contact us to serve
                  </LinkButton>
                  <LinkButton href="/prayer" variant="ghost">
                    Pray for provision
                  </LinkButton>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Hospitality Ministry</SectionEyebrow>
              <SectionTitle>
                We serve because caring for people is part of living out the Gospel.
              </SectionTitle>
              <SectionLead>
                Every act of giving and serving is an opportunity to show Christ&apos;s love in a
                practical way.
              </SectionLead>
              <div className="mt-6">
                <LinkButton href="/ministries/hospitality" variant="secondary">
                  Back to Hospitality Ministry
                </LinkButton>
              </div>
            </div>
          </Container>
        </Section>

        <ContextualNextSteps
          title="Continue exploring"
          description="Learn about Orphans & Vulnerable Persons, serve with Hospitality, or plan a visit."
          actions={[
            { href: "/ministries/hospitality/orphans", label: "Orphans & Vulnerable Persons" },
            { href: "/serve?ministry=feeding-programme", label: "Express Interest", variant: "secondary" },
            { href: "/visit", label: "Plan Your Visit", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}
