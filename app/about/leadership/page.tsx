import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { LeaderGrid } from "@/components/about/CmsPageView";
import { getAllPublishedLeaders } from "@/services/pages";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Leadership",
  description:
    "Meet the pastors, elders, and ministry leaders serving Glorious Gospel Centre Church.",
  path: "/about/leadership",
  keywords: ["leadership", "pastors", "church staff", "elders"],
});

export default async function LeadershipPage() {
  const leaders = await getAllPublishedLeaders();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Leadership"
          title="Meet our team"
          description="Pastors, elders, and ministry leaders who serve our church family."
        >
          <LinkButton href="/visit" variant="secondary">
            Plan Your Visit
          </LinkButton>
        </PageHeader>
        <AboutSubnav active="/about/leadership" />
        <Section>
          <Container>
            <LeaderGrid leaders={leaders} />
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
