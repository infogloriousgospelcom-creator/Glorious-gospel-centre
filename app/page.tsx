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
import { StoriesOfGraceHomeSection } from "@/components/home/StoriesOfGraceHomeSection";
import { ScriptureBandSection } from "@/components/home/ScriptureBandSection";
import { GivingCtaSection } from "@/components/home/GivingCtaSection";
import { ThisWeekSection } from "@/components/church/ThisWeekSection";
import { InviteSomeone } from "@/components/church/InviteSomeone";
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

export default async function HomePage() {
  const settings = await getSiteSettings();
  const churchName = settings.church_name?.trim() || "Glorious Gospel Centre Church";

  return (
    <>
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <SundayServicesSection />
        <AttendWatchSection />
        <ThisWeekSection />
        <WelcomeSection />
        <NextStepSection />
        <InviteSomeone inviteUrl={siteUrl("/visit")} churchName={churchName} />
        <MinistriesSection />
        <LatestSermonSection />
        <UpcomingEventsSection />
        <PrayerCtaSection />
        <StoriesOfGraceHomeSection />
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
