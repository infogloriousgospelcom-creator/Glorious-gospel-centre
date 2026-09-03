import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { getPublishedGalleryAlbums } from "@/services/content";

export async function GallerySection() {
  const albums = await getPublishedGalleryAlbums(6);

  return (
    <Section>
      <Container>
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <SectionEyebrow>Life together</SectionEyebrow>
            <SectionTitle>Gallery</SectionTitle>
          </div>
          <Link
            href="/gallery"
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            View all →
          </Link>
        </div>

        {albums.length === 0 ? (
          <EmptyState
            title="Gallery coming soon"
            description="Photos from worship, events, and outreach will appear here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {albums.map((a, i) => (
              <Link
                key={a.id}
                href={`/gallery/${a.slug}`}
                className={`group relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${
                  i % 2 === 0
                    ? "from-brand-200 to-accent-200"
                    : "from-accent-200 to-brand-100"
                }`}
              >
                {a.cover_image ? (
                  <img
                    src={a.cover_image}
                    alt={a.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {a.title}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
