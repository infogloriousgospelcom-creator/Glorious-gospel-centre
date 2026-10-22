import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Legal"
          title={page?.title ?? "Privacy Policy"}
          description={
            page?.excerpt ??
            "How we collect, use, and protect personal information shared through this website."
          }
        />
        <CmsPageView page={page} fallbackTitle="Privacy Policy" hideTitle />
      </main>
      <Footer />
    </>
  );
}
