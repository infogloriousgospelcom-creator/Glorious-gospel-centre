import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow } from "@/components/ui/Section";
import { getSermonSeriesBySlug, listSermonsPaged } from "@/services/sermons";
import { formatDuration } from "@/lib/media";

export const revalidate = 300;

const loadSeries = cache((slug: string) => getSermonSeriesBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const series = await loadSeries(params.slug);
  if (!series) return { title: "Series" };
  return {
    title: series.title,
    description: series.description ?? `Sermon series: ${series.title}.`,
  };
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
  const series = await loadSeries(params.slug);
  if (!series) notFound();

  const paged = await listSermonsPaged(1, { seriesId: series.id });

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
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl shadow-elevated">
              <Image
                src={series.hero_image}
                alt=""
                fill
                sizes="(min-width: 1280px) 1280px, 100vw"
                priority
                className="object-cover"
              />
            </div>
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
                        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-accent-700" aria-hidden="true">
                          {s.thumbnail_url ? (
                            <Image
                              src={s.thumbnail_url}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              loading="lazy"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
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
      </main>
      <Footer />
    </>
  );
}
