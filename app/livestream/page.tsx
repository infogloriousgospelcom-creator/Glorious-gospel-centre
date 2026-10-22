import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import {
  getActiveSocialLinks,
  getPublishedServices,
  groupServicesByDay,
} from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";
import type { SocialLink } from "@/types/content";
import { SectionReveal } from "@/components/motion/SectionReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Watch Online",
  description:
    "Watch Glorious Gospel Centre Church online — join worship and teaching through our livestream platforms, or catch up with sermons anytime.",
  path: "/livestream",
  keywords: ["watch online", "livestream", "church online", "youtube", "facebook"],
});

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

function getStreamingPlatforms(socials: SocialLink[]) {
  return socials.filter((s) =>
    ["facebook", "youtube", "instagram", "tiktok"].some((p) =>
      s.platform.toLowerCase().includes(p),
    ),
  );
}

export default async function LivestreamPage() {
  const [socials, services] = await Promise.all([
    getActiveSocialLinks(),
    getPublishedServices(),
  ]);

  const platforms = getStreamingPlatforms(socials);
  const byDay = groupServicesByDay(services);
  const sunday = byDay.find((g) => g.day === 0);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Watch Online"
          title="Join us from wherever you are"
          description="Participate in worship and teaching through our online platforms. We do not show a fake live status — open a platform below when a service is streaming."
        >
          <LinkButton href="/sermons" variant="secondary">
            Browse sermons
          </LinkButton>
          <LinkButton href="/visit">Plan an in-person visit</LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <SectionReveal>
              <div className="mx-auto mb-10 max-w-2xl text-center">
                <SectionEyebrow>Platforms</SectionEyebrow>
                <SectionTitle>Where to watch</SectionTitle>
                <SectionLead>
                  Open a platform to follow along when we are streaming.
                </SectionLead>
              </div>
            </SectionReveal>

            {platforms.length === 0 ? (
              <EmptyState
                title="Streaming links coming soon"
                description="Once Facebook, YouTube, or other platforms are added in church settings, they will appear here."
              />
            ) : (
              <SectionReveal delay={0.08}>
                <ul className="mx-auto grid max-w-3xl gap-0 sm:grid-cols-2">
                  {platforms.map((platform) => (
                    <li
                      key={platform.id}
                      className="border-t border-border sm:odd:border-r sm:odd:pr-8 sm:even:pl-8"
                    >
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex min-h-touch flex-col justify-center py-5 transition-colors duration-ui ease-smooth"
                      >
                        <span className="font-display text-lg font-semibold capitalize text-brand-900 group-hover:text-brand-700">
                          {platform.platform}
                          <span aria-hidden="true" className="ml-2 inline-block transition-transform duration-ui group-hover:translate-x-0.5">
                            →
                          </span>
                        </span>
                        <span className="mt-1 text-sm text-ink-muted">
                          Open {platform.platform} in a new tab
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </SectionReveal>
            )}
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <SectionReveal>
                <div>
                  <SectionEyebrow>Schedule</SectionEyebrow>
                  <SectionTitle>Typical streaming times</SectionTitle>
                  <SectionLead>
                    We usually stream Sunday gatherings. Confirm the latest times on our services
                    page.
                  </SectionLead>
                  {sunday && sunday.services.length > 0 ? (
                    <ul className="mt-6 divide-y divide-border border-y border-border">
                      {sunday.services.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-baseline justify-between gap-4 py-3 text-sm"
                        >
                          <span className="font-medium text-brand-900">{s.name}</span>
                          <span className="shrink-0 text-brand-700">
                            {formatTime(s.start_time)}
                            {s.end_time ? ` – ${formatTime(s.end_time)}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-6 text-sm text-ink-muted">
                      Sunday times will appear here once published.
                    </p>
                  )}
                  <p className="mt-5">
                    <Link
                      href="/services"
                      className="text-sm font-semibold text-brand-700 transition-colors duration-ui ease-smooth hover:text-brand-800"
                    >
                      Full weekly schedule →
                    </Link>
                  </p>
                </div>
              </SectionReveal>

              <SectionReveal delay={0.1}>
                <div>
                  <SectionEyebrow>Catch up</SectionEyebrow>
                  <SectionTitle>Missed a service?</SectionTitle>
                  <SectionLead>
                    Past messages are available in our sermon archive anytime.
                  </SectionLead>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <LinkButton href="/sermons">Browse sermons</LinkButton>
                    <LinkButton href="/contact" variant="secondary">
                      Contact support
                    </LinkButton>
                  </div>
                </div>
              </SectionReveal>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
