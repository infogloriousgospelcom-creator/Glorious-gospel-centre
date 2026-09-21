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
  title: "Orphans & Vulnerable Persons",
  description:
    "GGCC's ministry to orphans and vulnerable children — providing care, encouragement, and practical support through the Hospitality Ministry.",
  path: "/ministries/hospitality/orphans",
  keywords: ["orphans", "vulnerable children", "hospitality ministry", "community care", "GGCC"],
});

export default async function OrphansVulnerablesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Hospitality Ministry"
          title="Orphans & Vulnerable Persons"
          description="Part of the Hospitality Ministry of Glorious Gospel Centre Church. We care for children and people who are facing difficult circumstances and seek practical ways to stand with them."
        >
          <LinkButton href="/ministries/hospitality" variant="secondary">
            Hospitality Ministry
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <div className="mx-auto max-w-3xl space-y-8">
              <article className="prose prose-brand max-w-none">
                <p className="lead">
                  We believe that people in vulnerable situations should not be forgotten. Through the
                  support of the church, we seek to offer care, encouragement and practical assistance
                  while showing the love of Christ.
                </p>

                <h2 className="heading-3">What We Do</h2>
                <p>The ministry focuses on:</p>
                <ul className="list-disc list-inside space-y-2 text-ink">
                  <li>Caring for orphans and vulnerable children.</li>
                  <li>Identifying practical needs where the church can help.</li>
                  <li>Providing support and encouragement.</li>
                  <li>Standing with vulnerable individuals and families.</li>
                  <li>Creating a caring church community where people know they are valued.</li>
                  <li>
                    Encouraging church members to participate through prayer, giving and volunteering.
                  </li>
                </ul>

                <h2 className="heading-3">Our Heart</h2>
                <p>
                  We want those we serve to experience genuine care and dignity. Sometimes support may
                  involve meeting a practical need. At other times, it may mean encouragement, prayer or
                  simply being present.
                </p>
                <p>
                  Our desire is to care for people in a way that reflects the compassion of Jesus Christ.
                </p>
              </article>

              <div className="border-t border-border pt-6">
                <h3 className="heading-4 mb-4">Get Involved</h3>
                <p className="mb-6 text-ink-muted">
                  Members of Glorious Gospel Centre Church can support this ministry through prayer,
                  giving, and volunteering when opportunities arise.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <LinkButton href="/prayer">Pray for this ministry</LinkButton>
                  <LinkButton href="/give" variant="secondary">
                    Give support
                  </LinkButton>
                  <LinkButton href="/contact" variant="ghost">
                    Contact us to learn more
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
              <SectionTitle>We believe every person matters</SectionTitle>
              <SectionLead>
                We want to be a church that remembers those who need care and support.
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
          description="Learn about the Feeding Programme, serve with Hospitality, or plan a visit."
          actions={[
            { href: "/ministries/hospitality/feeding", label: "Feeding Programme" },
            { href: "/serve", label: "Serve at GGCC", variant: "secondary" },
            { href: "/visit", label: "Plan Your Visit", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}
