import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSermonSeriesBySlug, listSermonsPaged } from "@/services/sermons";
import { formatDuration } from "@/lib/media";
import {
  buildPageMetadata,
  buildBreadcrumbSchema,
  plainText,
  siteUrl,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const series = await getSermonSeriesBySlug(params.slug);
  if (!series) {
    return buildPageMetadata({
      title: "Series",
      description: "Sermon series",
      path: `/sermons/series/${params.slug}`,
      noindex: true,
    });
  }
  return buildPageMetadata({
    title: series.title,
    description: series.description
      ? plainText(series.description, 200)
      : `Sermon series: ${series.title} from Glorious Gospel Centre.`,
    path: `/sermons/series/${series.slug}`,
    image: series.hero_image,
    imageAlt: `${series.title} sermon series`,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SeriesDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const series = await getSermonSeriesBySlug(params.slug);
  if (!series) notFound();

  const paged = await listSermonsPaged(1, { seriesId: series.id });

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: siteUrl("/") },
    { name: "Sermons", url: siteUrl("/sermons") },
    { name: series.title, url: siteUrl(`/sermons/series/${series.slug}`) },
  ]);

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl">
              <Link
                href="/sermons"
                className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                ← All sermons
              </Link>
              <SectionEyebrow>Series</SectionEyebrow>
              <h1 className="heading-1 mb-4 text-balance">{series.title}</h1>
              {series.description ? (
                <p className="lead text-balance">{series.description}</p>
              ) : null}
              {series.start_date ? (
                <p className="mt-4 text-sm text-ink-muted">
                  Began {formatDate(series.start_date)}
                </p>
              ) : null}
            </div>
          </Container>
        </Section>

        {series.hero_image ? (
          <Container>
            <img
              src={series.hero_image}
              alt=""
              className="aspect-[21/9] w-full rounded-2xl object-cover shadow-elevated"
            />
          </Container>
        ) : null}

        <Section>
          <Container>
            <h2 className="heading-3 mb-6">
              {paged.totalCount} sermon{paged.totalCount === 1 ? "" : "s"} in this series
            </h2>

            {paged.items.length === 0 ? (
              <EmptyState
                title="No sermons in this series yet"
                description="Once sermons are published and tagged with this series, they will appear here."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paged.items.map((s) => {
                  const duration = formatDuration(s.duration_seconds);
                  return (
                    <Link key={s.id} href={`/sermons/${s.slug}`} className="group">
                      <Card className="flex h-full flex-col transition-shadow group-hover:shadow-elevated">
                        <div className="aspect-video overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-accent-700" aria-hidden="true">
                          {s.thumbnail_url ? (
                            <img
                              src={s.thumbnail_url}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : null}
                        </div>
                        <CardHeader>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="brand">{formatDate(s.preached_on)}</Badge>
                            {s.category ? <Badge tone="accent">{s.category}</Badge> : null}
                            {duration ? <Badge>{duration}</Badge> : null}
                          </div>
                          <CardTitle className="line-clamp-2">{s.title}</CardTitle>
                          {s.speaker ? (
                            <CardDescription>{s.speaker}</CardDescription>
                          ) : null}
                        </CardHeader>
                        {s.description ? (
                          <CardBody>
                            <p className="line-clamp-3 text-sm text-ink-muted">{s.description}</p>
                          </CardBody>
                        ) : null}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </Container>
        </Section>
        <JsonLd data={breadcrumb} />
      </main>
      <Footer />
    </>
  );
}
