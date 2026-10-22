import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { TestimonyCard } from "@/components/testimonies/TestimonyCard";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { getApprovedTestimonies } from "@/services/testimonies";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Stories of Grace",
  description:
    "Read stories of God's faithfulness from Glorious Gospel Centre Church — and be encouraged to trust Him.",
  path: "/testimonies",
  keywords: ["testimonies", "stories of grace", "GGCC", "faith"],
});

export default async function TestimoniesPage() {
  const testimonies = await getApprovedTestimonies(50);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Stories of Grace"
          title="God is still working"
          description="These stories are shared by people connected to GGCC and published only after careful review. May they encourage you to trust God."
        >
          <LinkButton href="/testimonies/share">Share Your Story</LinkButton>
          <LinkButton href="/prayer" variant="secondary">
            Prayer Center
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            {testimonies.length === 0 ? (
              <EmptyState
                title="Stories will appear here"
                description="Stories of God's faithfulness will appear here as they are shared and approved. You are welcome to share yours for review."
              >
                <LinkButton href="/testimonies/share">Share Your Story</LinkButton>
              </EmptyState>
            ) : (
              <SectionReveal>
                <ul className="mx-auto grid max-w-3xl gap-10">
                  {testimonies.map((t) => (
                    <TestimonyCard key={t.id} testimony={t} />
                  ))}
                </ul>
              </SectionReveal>
            )}
          </Container>
        </Section>

        <ContextualNextSteps
          title="Be encouraged — then take a step"
          description="Pray, grow in the Word, or join us in person."
          actions={[
            { href: "/prayer", label: "Request Prayer" },
            { href: "/sermons", label: "Explore Sermons", variant: "secondary" },
            { href: "/visit", label: "Plan Your Visit", variant: "ghost" },
          ]}
          surface="muted"
        />
      </main>
      <Footer />
    </>
  );
}
