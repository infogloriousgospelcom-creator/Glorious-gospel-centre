import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { SermonsFilters } from "./_components/SermonsFilters";
import { Pagination } from "./_components/Pagination";
import { listSermonsPaged, SERMONS_PAGE_SIZE } from "@/services/sermons";
import { listAllSermonSeries, listAllSermonCategories } from "@/services/sermons";
import { formatDuration } from "@/lib/media";

// searchParams make this page dynamic by definition; we rely on the
// pagination/filter UI being client-side. Sermon listings themselves
// are mutated through admin actions, which call revalidatePath().
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sermons",
  description: "Sermon archive — listen, watch, and grow from the Word.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SermonsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; series?: string; page?: string };
}) {
  const page = Number(searchParams.page ?? "1");
  const search = searchParams.q ?? "";
  const category = searchParams.category ?? "all";
  const seriesId = searchParams.series ?? null;

  const [paged, categories, series] = await Promise.all([
    listSermonsPaged(page, { search, category, seriesId }),
    listAllSermonCategories(),
    listAllSermonSeries(),
  ]);

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Sermons</SectionEyebrow>
              <SectionTitle>Word for today and every day</SectionTitle>
              <SectionLead>
                Browse our sermon library. Listen, watch, and let God&apos;s Word
                transform your everyday.
              </SectionLead>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <SermonsFilters
              categories={categories}
              series={series}
              defaultSearch={search}
              defaultCategory={category}
              defaultSeriesId={seriesId}
            />

            <p className="mb-6 text-sm text-ink-muted" aria-live="polite">
              {paged.totalCount === 0
                ? "No sermons found."
                : `Showing ${paged.items.length} of ${paged.totalCount} sermon${paged.totalCount === 1 ? "" : "s"}.`}
            </p>

            {paged.items.length === 0 ? (
              <EmptyState
                title="No sermons match your filters"
                description="Try clearing the search or selecting a different category or series."
              />
            ) : (
              <>
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
                <Pagination
                  currentPage={paged.page}
                  totalPages={paged.totalPages}
                  basePath="/sermons"
                  query={{ q: search, category, series: seriesId }}
                />
              </>
            )}

            {series.length > 0 ? (
              <div className="mt-16 border-t border-brand-100 pt-10">
                <h2 className="heading-3 mb-6">Browse by series</h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {series.map((sr) => (
                    <li key={sr.id}>
                      <Link
                        href={`/sermons/series/${sr.slug}`}
                        className="block rounded-2xl border border-brand-100 bg-surface px-4 py-3 text-sm font-medium text-ink shadow-soft transition-shadow hover:shadow-elevated"
                      >
                        {sr.title}
                        {sr.start_date ? (
                          <span className="ml-2 text-xs font-normal text-ink-muted">
                            ({new Date(sr.start_date).getFullYear()})
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-10 text-center text-xs text-ink-muted">
              {SERMONS_PAGE_SIZE} sermons per page.
            </p>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
