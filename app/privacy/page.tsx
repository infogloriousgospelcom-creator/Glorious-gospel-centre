import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CmsPageView } from "@/components/about/CmsPageView";
import { getPublishedPage } from "@/services/pages";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("privacy");
  return buildPageMetadata({
    title: page?.seo_title ?? "Privacy Policy",
    description:
      page?.seo_description ??
      "Glorious Gospel Centre Church privacy policy — how we collect, use, and protect your personal information.",
    path: "/privacy",
    image: page?.seo_og_image ?? page?.hero_image ?? null,
    imageAlt: page?.title ?? "Privacy Policy",
    keywords: ["privacy", "privacy policy", "data protection", "personal information"],
  });
}

export default async function PrivacyPage() {
  const page = await getPublishedPage("privacy");

  return (
    <>
      <Navbar />
      <main id="main">
        <CmsPageView page={page} fallbackTitle="Privacy Policy" />
      </main>
      <Footer />
    </>
  );
}