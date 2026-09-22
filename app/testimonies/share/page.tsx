import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { TestimonyShareForm } from "./_components/TestimonyShareForm";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Share Your Story",
  description:
    "Share a Story of Grace with Glorious Gospel Centre Church. Submissions are reviewed before publication.",
  path: "/testimonies/share",
  noindex: true,
  keywords: ["share testimony", "stories of grace", "GGCC"],
});

export default function ShareTestimonyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Stories of Grace"
          title="Share your story"
          description="Tell how God has been faithful in your life. Every submission is reviewed by the church before anything is published."
        >
          <LinkButton href="/testimonies" variant="secondary">
            Read Stories
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <SectionReveal>
                <div className="border-t border-border pt-6">
                  <SectionEyebrow>Submit</SectionEyebrow>
                  <SectionTitle className="text-left">Your Story of Grace</SectionTitle>
                  <SectionLead className="mx-0">
                    Write in your own words. Keep the focus on God&apos;s goodness. Moderators
                    may lightly edit for clarity before publication.
                  </SectionLead>
                  <div className="mt-8">
                    <TestimonyShareForm />
                  </div>
                </div>
              </SectionReveal>

              <SectionReveal delay={0.1}>
                <aside className="space-y-8 lg:pt-6">
                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Before you share
                    </h2>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-muted">
                      <li>Publication is not automatic or guaranteed.</li>
                      <li>You may publish anonymously.</li>
                      <li>Contact details stay private to authorized administrators.</li>
                      <li>Avoid sharing other people&apos;s private information without care.</li>
                    </ul>
                  </div>
                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Prefer to pray first?
                    </h2>
                    <p className="mt-2 text-sm text-ink-muted">
                      The Prayer Center is always open for confidential requests.
                    </p>
                    <div className="mt-4">
                      <LinkButton href="/prayer" variant="secondary">
                        Go to Prayer Center
                      </LinkButton>
                    </div>
                  </div>
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
