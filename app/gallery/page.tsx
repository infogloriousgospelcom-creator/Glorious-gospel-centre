import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { GalleryFilters } from "./_components/GalleryFilters";
import { GalleryPagination } from "./_components/GalleryPagination";
import { GALLERY_PAGE_SIZE, listAlbumsPaged, listAllAlbumCategories } from "@/services/gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photo albums from worship, events, outreach, and church life.",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const page = Number(searchParams.page ?? "1");
  const category = searchParams.category ?? "all";
  const [paged, categories] = await Promise.all([
    listAlbumsPaged(page, category),
    listAllAlbumCategories(),
  ]);

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Gallery</SectionEyebrow>
              <SectionTitle>Moments from our life together</SectionTitle>
              <SectionLead>
                Photos from worship, events, outreach, and the everyday life of
                our church family.
              </SectionLead>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <GalleryFilters categories={categories} defaultCategory={category} />

            <p className="mb-6 text-sm text-ink-muted" aria-live="polite">
              {paged.totalCount === 0
                ? "No albums found."
                : `Showing ${paged.items.length} of ${paged.totalCount} album${paged.totalCount === 1 ? "" : "s"}.`}
            </p>

            {paged.items.length === 0 ? (
              <EmptyState
                title={categories.length === 0 ? "Gallery coming soon" : "No albums match your filter"}
                description={
                  categories.length === 0
                    ? "Photo albums will appear here once published through the admin."
                    : "Try selecting a different category."
                }
              />
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paged.items.map((a) => {
                    const date = formatDate(a.event_date);
                    return (
                      <Link key={a.id} href={`/gallery/${a.slug}`} className="group">
                        <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-elevated">
                          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-200 to-accent-200" aria-hidden="true">
                            {a.cover_image ? (
                              <img
                                src={a.cover_image}
                                alt={a.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : null}
                            {date ? (
                              <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-medium text-white">
                                {date}
                              </span>
                            ) : null}
                          </div>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              {a.category ? <Badge tone="accent">{a.category}</Badge> : null}
                            </div>
                            <CardTitle>{a.title}</CardTitle>
                            {a.description ? (
                              <CardDescription className="line-clamp-2">{a.description}</CardDescription>
                            ) : null}
                          </CardHeader>
                          <CardBody>
                            <p className="text-sm font-medium text-brand-700">View album →</p>
                          </CardBody>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
                <GalleryPagination
                  currentPage={paged.page}
                  totalPages={paged.totalPages}
                  category={category}
                />
              </>
            )}

            <p className="mt-10 text-center text-xs text-ink-muted">
              {GALLERY_PAGE_SIZE} albums per page.
            </p>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
