import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { LeaderGrid } from "@/components/about/CmsPageView";
import { getAllPublishedPastors } from "@/services/pages";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Pastors",
  description:
    "Meet the pastors who shepherd, teach, and care for Glorious Gospel Centre Church.",
  path: "/about/pastors",
  keywords: ["pastors", "pastoral team", "church pastors", "ministry leaders"],
});

export default async function PastorsPage() {
  const pastors = await getAllPublishedPastors();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Pastors"
          title="Meet our pastors"
          description="The pastors who shepherd, teach, and care for our church family."
        >
          <LinkButton href="/visit" variant="secondary">
            Plan Your Visit
          </LinkButton>
        </PageHeader>
        <AboutSubnav active="/about/pastors" />
        <Section>
          <Container>
            <LeaderGrid
              leaders={pastors}
              emptyTitle="Pastors coming soon"
              emptyDescription="Add pastors in the admin to introduce them here."
            />
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
