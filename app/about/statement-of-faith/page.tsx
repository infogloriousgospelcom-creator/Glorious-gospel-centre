import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { CmsPageView } from "@/components/about/CmsPageView";
import { getPublishedPage } from "@/services/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statement of Faith",
  description: "What we believe about God, Scripture, and the Gospel of Jesus Christ.",
};

export default async function StatementOfFaithPage() {
  const page = await getPublishedPage("about-statement-of-faith");
  return (
    <>
      <Navbar />
      <main id="main">
        <AboutSubnav active="/about/statement-of-faith" />
        <CmsPageView page={page} fallbackTitle="Statement of Faith" />
      </main>
      <Footer />
    </>
  );
}
