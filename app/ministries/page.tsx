import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { getAllPublishedMinistries } from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { MinistryDiscovery } from "@/components/ministries/MinistryDiscovery";
import { ServeAtGgcc } from "@/components/ministries/ServeAtGgcc";
import { ConnectAtGgcc } from "@/components/ministries/ConnectAtGgcc";
import { topLevelMinistries } from "@/lib/ministries";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Ministries",
    description:
      "Where can I belong or serve at Glorious Gospel Centre Church? Explore ministries for families, worship, and outreach.",
    path: "/ministries",
    keywords: ["ministries", "church groups", "serve", "fellowship", "GGCC"],
  });
}

export const dynamic = "force-dynamic";

export default async function MinistriesPage() {
  const ministries = await getAllPublishedMinistries();
  const topLevel = topLevelMinistries(ministries);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Discover · Connect · Serve"
          title="Where can I belong or serve?"
          description="Find a ministry that fits your season of life — grow in faith, build community, and participate in the work of the Gospel at GGCC."
        >
          <LinkButton href="/serve">Serve at GGCC</LinkButton>
          <LinkButton href="/visit" variant="secondary">
            Plan Your Visit
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <SectionReveal>
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <SectionEyebrow>Our ministries</SectionEyebrow>
                <SectionTitle>Find your place in the church family</SectionTitle>
                <SectionLead>
                  From children and youth to worship, prayer, hospitality, and outreach —
                  every ministry exists to strengthen our church and serve our community.
                </SectionLead>
              </div>
            </SectionReveal>

            {topLevel.length === 0 ? (
              <EmptyState
                title="Ministries coming soon"
                description="Add ministries in the admin to populate this section."
              />
            ) : (
              <MinistryDiscovery ministries={ministries} />
            )}
          </Container>
        </Section>

        <ConnectAtGgcc />

        <ServeAtGgcc />

        <ContextualNextSteps
          title="Ready for a next step?"
          description="Explore how to serve, plan a visit, or reach out with a question."
          actions={[
            { href: "/serve", label: "Serve at GGCC" },
            { href: "/visit", label: "Plan Your Visit", variant: "secondary" },
            { href: "/contact", label: "Contact Us", variant: "ghost" },
          ]}
          surface="muted"
        />
      </main>
      <Footer />
    </>
  );
}
