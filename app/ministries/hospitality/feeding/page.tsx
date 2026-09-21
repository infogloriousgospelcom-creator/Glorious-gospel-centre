import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
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
          description="The Feeding Programme is part of the Hospitality Ministry of Glorious Gospel Centre Church. It provides food and practical support to people who are experiencing need."
        />

        <Section>
          <Container>
            <div className="mx-auto max-w-3xl space-y-8">
              <article className="prose prose-brand max-w-none">
                <p className="lead">
                  A meal can meet an immediate need, but it can also create an opportunity to show
                  someone that they are seen, valued and cared for.
                </p>

                <h2 className="heading-3">What We Do</h2>
                <p>The programme focuses on:</p>
                <ul className="list-disc list-inside space-y-2 text-ink">
                  <li>Providing meals and food support to people in need.</li>
                  <li>Reaching individuals and families experiencing hardship.</li>
                  <li>Supporting community outreach activities.</li>
                  <li>Mobilising church members to share what they have.</li>
                  <li>Encouraging generosity and practical service.</li>
                  <li>Showings the compassion of Christ through acts of care.</li>
                </ul>

                <h2 className="heading-3">Serving Our Community</h2>
                <p>
                  The Feeding Programme gives members of the church an opportunity to serve in a
                  practical way.
                </p>
                <p>
                  Some may contribute food or financial support. Others may volunteer their time during
                  preparation, distribution or outreach activities.
                </p>
                <p>
                  The goal is simple: to help meet practical needs while demonstrating the love of
                  Christ.
                </p>
              </article>

              <div className="pt-6 border-t border-border">
                <h3 className="heading-4 mb-4">Get Involved</h3>
                <p className="text-ink-muted mb-6">
                  You can support the Feeding Programme through:
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                    <p className="font-display text-base font-semibold text-brand-900">Giving</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      Help provide food and other resources needed for the programme.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                    <p className="font-display text-base font-semibold text-brand-900">Volunteering</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      Take part in preparation, distribution and outreach activities.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                    <p className="font-display text-base font-semibold text-brand-900">Prayer</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      Pray for the people being served and for the ministry team.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Link href="/give">
                    <Button variant="primary">Give to the programme</Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="secondary">Volunteer to serve</Button>
                  </Link>
                  <Link href="/prayer">
                    <Button variant="ghost">Pray for provision</Button>
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
              <SectionTitle>We serve because caring for people is part of living out the Gospel.</SectionTitle>
              <SectionLead>
                Every act of giving and serving is an opportunity to show Christ&apos;s love in a practical way.
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
