import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { SectionEyebrow, SectionTitle, SectionLead, EmptyState } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { getActiveSocialLinks } from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";
import type { SocialLink } from "@/types/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Livestream",
  description:
    "Watch Glorious Gospel Centre Church services live — Sunday worship, mid-week Bible study, and special events streamed on Facebook and YouTube.",
  path: "/livestream",
  keywords: ["livestream", "live service", "watch online", "facebook live", "youtube live"],
});

function getStreamingPlatforms(socials: SocialLink[]) {
  const platforms = socials.filter((s) =>
    ["facebook", "youtube", "instagram", "tiktok"].some((p) =>
      s.platform.toLowerCase().includes(p)
    )
  );
  return platforms;
}

export default async function LivestreamPage() {
  const socials = await getActiveSocialLinks();

  const streamingPlatforms = getStreamingPlatforms(socials);
  const hasConfiguredStreams = streamingPlatforms.length > 0;

  return (
    <>
      <Navbar />
      <main id="main">
        <PageHeader
          eyebrow="Watch Live"
          title="Livestream Services"
          description="Join us for worship wherever you are. Our services are streamed live on multiple platforms so you can participate from home, work, or anywhere with an internet connection."
        />

        <Section>
          <Container>
            <div className="mx-auto max-w-4xl">
              {hasConfiguredStreams ? (
                <>
                  <div className="mb-10">
                    <h2 className="heading-3 mb-4 text-center">Available Platforms</h2>
                    <p className="lead text-center text-ink-muted mb-8">
                      Click a platform below to watch our live services:
                    </p>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {streamingPlatforms.map((platform) => (
                        <Card key={platform.id} hoverable className="h-full">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700"
                                aria-hidden="true"
                              >
                                {platform.platform.toLowerCase().includes("facebook") && (
                                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                  </svg>
                                )}
                                {platform.platform.toLowerCase().includes("youtube") && (
                                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                  </svg>
                                )}
                                {platform.platform.toLowerCase().includes("instagram") && (
                                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.127-1.28-.14-1.688-.14-4.948 0-3.259.013-3.667.071-4.947.197-4.354 2.617-6.78 6.98-6.98 1.28-.058 1.688-.071 4.947-.071zM12 6.865a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 1.802a3.333 3.333 0 1 0 0 6.666 3.333 3.333 0 0 0 0-6.666zm5.338-3.213a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
                                  </svg>
                                )}
                                {!platform.platform.toLowerCase().includes("facebook") &&
                                  !platform.platform.toLowerCase().includes("youtube") &&
                                  !platform.platform.toLowerCase().includes("instagram") && (
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.043 20.948l-4.115-3.745V11.45c0-1.533.344-2.56 2.115-2.56h2.366V7.166c-.375-.055-1.484-.17-2.748-.17-2.745 0-3.76 2.082-3.76 4.167V15h4.176l-.553 4.303H10.83V24h4.213z" />
                                    </svg>
                                  )}
                              </div>
                              <div>
                                <CardTitle className="capitalize">{platform.platform}</CardTitle>
                                <CardDescription>Live services & events</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardBody>
                            <a
                              href={platform.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-full h-11 rounded-md bg-brand-700 text-white text-sm font-semibold transition-colors hover:bg-brand-800"
                            >
                              Watch Live
                            </a>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Livestream platforms not yet configured"
                  description="Our services are streamed on Facebook and YouTube. Once the streaming links are added in the admin settings, they will appear here."
                />
              )}

              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="heading-3 mb-4 text-center">Service Schedule</h3>
                <p className="lead text-center text-ink-muted mb-8">
                  Our regular services are streamed live. Check the schedule below:
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sunday Worship</CardTitle>
                      <CardDescription>Main weekly service</CardDescription>
                    </CardHeader>
                    <CardBody>
                      <p className="text-sm text-ink-muted">Sundays · 9:00 AM & 11:30 AM</p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Mid-Week Bible Study</CardTitle>
                      <CardDescription>Weekly teaching</CardDescription>
                    </CardHeader>
                    <CardBody>
                      <p className="text-sm text-ink-muted">Wednesdays · 7:00 PM</p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Youth Service</CardTitle>
                      <CardDescription>Friday evening</CardDescription>
                    </CardHeader>
                    <CardBody>
                      <p className="text-sm text-ink-muted">Fridays · 6:00 PM</p>
                    </CardBody>
                  </Card>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-border text-center">
                <h3 className="heading-4 mb-4">Missed a Service?</h3>
                <p className="text-ink-muted mb-6">
                  All past sermons are available in our sermon archive.
                </p>
                <Link href="/sermons">
                    <Button variant="secondary">Browse Sermons</Button>
                  </Link>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="text-center">
              <SectionEyebrow>Connect</SectionEyebrow>
              <SectionTitle>Having trouble accessing the livestream?</SectionTitle>
              <SectionLead>
                Contact our media team for technical support or questions about our online services.
              </SectionLead>
              <div className="mt-6">
                <Link href="/contact">
                  <Button variant="primary">Contact Support</Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}