import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { SundayServicesSection } from "@/components/home/SundayServicesSection";
import { AttendWatchSection } from "@/components/home/AttendWatchSection";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { NextStepSection } from "@/components/home/NextStepSection";
import { MinistriesSection } from "@/components/home/MinistriesSection";
import { LatestSermonSection } from "@/components/home/LatestSermonSection";
import { UpcomingEventsSection } from "@/components/home/UpcomingEventsSection";
import { PrayerCtaSection } from "@/components/home/PrayerCtaSection";
import { ScriptureBandSection } from "@/components/home/ScriptureBandSection";
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
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <SundayServicesSection />
        <AttendWatchSection />
        <WelcomeSection />
        <NextStepSection />
        <MinistriesSection />
        <LatestSermonSection />
        <UpcomingEventsSection />
        <PrayerCtaSection />
        <ScriptureBandSection />
        <GivingCtaSection />
      </main>
      <Footer />
      <span className="sr-only">
        Visit {siteUrl("/events")} for upcoming events.
      </span>
    </>
  );
}
