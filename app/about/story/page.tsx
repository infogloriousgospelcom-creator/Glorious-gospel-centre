import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { CmsPageView } from "@/components/about/CmsPageView";
import { getPublishedPage } from "@/services/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story",
  description: "The story of Glorious Gospel Centre — how God brought this church into being.",
};

export default async function StoryPage() {
  const page = await getPublishedPage("about-story");
  return (
    <>
      <Navbar />
      <main id="main">
        <AboutSubnav active="/about/story" />
        <CmsPageView page={page} fallbackTitle="Our Story" />
      </main>
      <Footer />
    </>
  );
}
