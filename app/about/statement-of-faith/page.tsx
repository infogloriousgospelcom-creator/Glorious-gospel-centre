import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { CmsPageView } from "@/components/about/CmsPageView";
import { getPublishedPage } from "@/services/pages";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("about-statement-of-faith");
  return buildPageMetadata({
    title: page?.seo_title ?? "Statement of Faith",
    description:
      page?.seo_description ??
      "What we believe about God, Scripture, and the Gospel of Jesus Christ.",
    path: "/about/statement-of-faith",
    image: page?.seo_og_image ?? page?.hero_image ?? null,
    imageAlt: page?.title ?? "Statement of Faith",
    keywords: ["statement of faith", "beliefs", "doctrine", "theology"],
  });
}

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