import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { CmsPageView } from "@/components/about/CmsPageView";
import { getPublishedPage } from "@/services/pages";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("about-story");
  return buildPageMetadata({
    title: page?.seo_title ?? "Our Story",
    description:
      page?.seo_description ??
      "The story of Glorious Gospel Centre — how God brought this church into being.",
    path: "/about/story",
    image: page?.seo_og_image ?? page?.hero_image ?? null,
    imageAlt: page?.title ?? "Our Story",
    keywords: ["church story", "history", "about"],
  });
}

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