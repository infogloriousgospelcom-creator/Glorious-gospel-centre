import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { getAllPublishedMinistries } from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Ministries",
    description:
      "Explore the ministries of Glorious Gospel Centre — find a place to belong, serve, and grow.",
    path: "/ministries",
    keywords: ["ministries", "church groups", "serve", "fellowship"],
  });
}

export const dynamic = "force-dynamic";

export default async function MinistriesPage() {
  const ministries = await getAllPublishedMinistries();

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Get involved</SectionEyebrow>
              <SectionTitle>Our ministries</SectionTitle>
              <SectionLead>
                Find a place to belong, serve, and grow. Each ministry exists to
                strengthen our church family and serve our community.
              </SectionLead>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            {ministries.length === 0 ? (
              <EmptyState
                title="Ministries coming soon"
                description="Add ministries in the admin to populate this section."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ministries.map((m) => (
                  <Link key={m.id} href={`/ministries/${m.slug}`} className="group">
                    <Card className="flex h-full flex-col transition-shadow group-hover:shadow-elevated">
                      <div
                        className="aspect-[4/3] bg-gradient-to-br from-brand-100 to-accent-100"
                        aria-hidden="true"
                      >
                        {m.hero_image ? (
                          <img
                            src={m.hero_image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <CardHeader>
                        <CardTitle>{m.name}</CardTitle>
                        {m.short_description ? (
                          <CardDescription>{m.short_description}</CardDescription>
                        ) : null}
                      </CardHeader>
                      {m.meeting_info ? (
                          <CardBody>
                            <p className="text-xs uppercase tracking-wider text-ink-muted">
                              Meetings
                            </p>
                            <p className="mt-1 text-sm text-ink">{m.meeting_info}</p>
                          </CardBody>
                        ) : null}
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}