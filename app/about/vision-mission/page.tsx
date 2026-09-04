import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { CmsPageView } from "@/components/about/CmsPageView";
import { getPublishedPage } from "@/services/pages";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("about-vision-mission");
  return buildPageMetadata({
    title: page?.seo_title ?? "Vision & Mission",
    description:
      page?.seo_description ?? "Our vision and mission as a church family.",
    path: "/about/vision-mission",
    image: page?.seo_og_image ?? page?.hero_image ?? null,
    imageAlt: page?.title ?? "Vision & Mission",
    keywords: ["vision", "mission", "church purpose"],
  });
}

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