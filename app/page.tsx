import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { ThisWeekSection } from "@/components/home/ThisWeekSection";
import { MinistriesSection } from "@/components/home/MinistriesSection";
import { LatestSermonSection } from "@/components/home/LatestSermonSection";
import { PrayerCtaSection } from "@/components/home/PrayerCtaSection";
import { GallerySection } from "@/components/home/GallerySection";
import { OutreachSection } from "@/components/home/OutreachSection";
import { GivingCtaSection } from "@/components/home/GivingCtaSection";
import { getSiteSettings } from "@/services/content";
import { buildPageMetadata, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: settings.seo_default_title ?? "Home",
    description:
      settings.seo_default_description ??
      "Welcome to Glorious Gospel Centre Church — worship, community, teaching, and outreach.",
    path: "/",
    image: settings.seo_default_og_image ?? null,
    imageAlt: `${settings.church_name} church`,
    keywords: ["church kenya", "worship", "sermons", "ministries", "prayer"],
  });
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <HeroSection />
        <WelcomeSection />
        <ThisWeekSection />
        <MinistriesSection />
        <LatestSermonSection />
        <PrayerCtaSection />
        <GallerySection />
        <OutreachSection />
        <GivingCtaSection />
      </main>
      <Footer />
      <span className="sr-only">
        Visit {siteUrl("/events")} for upcoming events.
      </span>
    </>
  );
}