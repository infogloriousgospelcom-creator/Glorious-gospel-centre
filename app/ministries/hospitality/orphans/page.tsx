import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Orphans & Vulnerables",
  description:
    "GGCC's ministry to orphans and vulnerable children — providing care, encouragement, and practical support through the Hospitality Ministry.",
  path: "/ministries/hospitality/orphans",
  keywords: ["orphans", "vulnerable children", "hospitality ministry", "community care", "GGCC"],
});

export default async function OrphansVulnerablesPage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <PageHeader
          eyebrow="Hospitality Ministry"
          title="Orphans & Vulnerables"
          description="The Orphans & Vulnerables ministry is part of the Hospitality Ministry of Glorious Gospel Centre Church. We care for children and people who are facing difficult circumstances and seek practical ways to stand with them."
        />

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
                  <li>Encouraging church members to participate through prayer, giving and volunteering.</li>
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

              <div className="pt-6 border-t border-border">
                <h3 className="heading-4 mb-4">Get Involved</h3>
                <p className="text-ink-muted mb-6">
                  Members of Glorious Gospel Centre Church can support this ministry through:
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                    <p className="font-display text-base font-semibold text-brand-900">Prayer</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      Pray for the children, families and individuals being served.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                    <p className="font-display text-base font-semibold text-brand-900">Giving</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      Contribute towards practical needs and ministry activities.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                    <p className="font-display text-base font-semibold text-brand-900">Volunteering</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      Give your time and skills when opportunities arise.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Link href="/prayer">
                    <Button variant="primary">Pray for this ministry</Button>
                  </Link>
                  <Link href="/give">
                    <Button variant="secondary">Give support</Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="ghost">Volunteer or learn more</Button>
                  </Link>
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
                <Link href="/ministries/hospitality">
                  <Button variant="secondary">Back to Hospitality Ministry</Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
