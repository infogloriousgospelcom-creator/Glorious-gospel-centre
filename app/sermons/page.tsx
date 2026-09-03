import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { SermonsFilters } from "./_components/SermonsFilters";
import { getAllPublishedSermons } from "@/services/content";
import { formatDuration } from "@/lib/media";
import type { SermonItem } from "@/types/content";

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

function applyFilters(
  sermons: SermonItem[],
  search: string,
  category: string,
): SermonItem[] {
  const q = search.trim().toLowerCase();
  return sermons.filter((s) => {
    if (category !== "all" && (s.category ?? "").toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    if (!q) return true;
    const haystack = `${s.title} ${s.speaker ?? ""} ${s.scripture ?? ""} ${s.description ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

export default async function SermonsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const sermons = await getAllPublishedSermons();
  const categories = Array.from(
    new Set(sermons.map((s) => s.category).filter((c): c is string => Boolean(c))),
  ).sort();

  const search = searchParams.q ?? "";
  const category = searchParams.category ?? "all";
  const filtered = applyFilters(sermons, search, category);

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
              defaultSearch={search}
              defaultCategory={category}
            />

            {filtered.length === 0 ? (
              <EmptyState
                title={sermons.length === 0 ? "Sermons coming soon" : "No sermons match your filters"}
                description={
                  sermons.length === 0
                    ? "Sermons will appear here once published through the admin."
                    : "Try clearing the search or selecting a different category."
                }
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => {
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
                          <div className="flex items-center gap-2">
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
