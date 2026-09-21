import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionEyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
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
      <Navbar />
      <main id="main">
        <PageHeader
          eyebrow="Ministry"
          title="Hospitality Ministry"
          description="The Hospitality Ministry of Glorious Gospel Centre Church exists to show the love of Christ through practical care. We support orphans, vulnerable children, families, and those experiencing food insecurity."
        />

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
                <p>
                  The ministry operates through two key areas:
                </p>
              </article>

              <div className="grid gap-6 sm:grid-cols-2">
                <Link href="/ministries/hospitality/orphans" className="group">
                  <div className="rounded-2xl border border-border bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
                    <SectionEyebrow className="text-accent-400">Area of Focus</SectionEyebrow>
                    <h3 className="mt-3 font-display text-xl font-semibold text-brand-900 group-hover:text-brand-700 transition-colors">
                      Orphans & Vulnerables
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                      Caring for orphans, vulnerable children, and individuals or families facing
                      difficult circumstances. We offer practical support, encouragement, and
                      the dignity of knowing they are valued.
                    </p>
                    <span className="mt-4 inline-block text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800">
                      Learn more &rarr;
                    </span>
                  </div>
                </Link>

                <Link href="/ministries/hospitality/feeding" className="group">
                  <div className="rounded-2xl border border-border bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
                    <SectionEyebrow className="text-accent-400">Area of Focus</SectionEyebrow>
                    <h3 className="mt-3 font-display text-xl font-semibold text-brand-900 group-hover:text-brand-700 transition-colors">
                      Feeding Programme
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                      Providing meals and food support to people experiencing need. A meal can meet
                      an immediate need, but it also creates an opportunity to show someone they are
                      seen and cared for.
                    </p>
                    <span className="mt-4 inline-block text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800">
                      Learn more &rarr;
                    </span>
                  </div>
                </Link>
              </div>

              <div className="pt-6 border-t border-border">
                <div className="flex flex-wrap gap-4">
                  <Link href="/ministries">
                    <Button variant="secondary">All Ministries</Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="ghost">Contact us</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
