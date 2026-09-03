import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { CmsPageView } from "@/components/about/CmsPageView";
import { getPublishedPage } from "@/services/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vision & Mission",
  description: "Our vision and mission as a church family.",
};

export default async function VisionMissionPage() {
  const page = await getPublishedPage("about-vision-mission");
  return (
    <>
      <Navbar />
      <main id="main">
        <AboutSubnav active="/about/vision-mission" />
        <CmsPageView page={page} fallbackTitle="Vision & Mission" />
      </main>
      <Footer />
    </>
  );
}
