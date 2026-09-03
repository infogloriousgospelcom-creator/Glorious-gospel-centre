import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LeaderGrid } from "@/components/about/CmsPageView";
import { getAllPublishedLeaders } from "@/services/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leadership",
  description: "Meet the pastors and leaders serving Glorious Gospel Centre.",
};

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
