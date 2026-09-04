import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
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
      <Navbar />
      <main id="main">
        <AboutSubnav active="/about/leadership" />
        <Section>
          <Container>
            <div className="mb-10 text-center">
              <SectionEyebrow>Leadership</SectionEyebrow>
              <SectionTitle>Meet our team</SectionTitle>
              <SectionLead>
                Pastors, elders, and ministry leaders who serve our church family.
              </SectionLead>
            </div>
            <LeaderGrid leaders={leaders} />
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
