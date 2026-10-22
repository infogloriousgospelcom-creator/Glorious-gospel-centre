import Link from "next/link";
import Image from "next/image";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { getPublishedGalleryAlbums } from "@/services/content";
import { SectionReveal } from "@/components/motion/SectionReveal";

export async function GallerySection() {
  const albums = await getPublishedGalleryAlbums(6);

  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <SectionEyebrow>Life together</SectionEyebrow>
              <SectionTitle>Gallery</SectionTitle>
            </div>
            <Link
              href="/gallery"
              className="text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
            >
              View all →
            </Link>
          </div>
        </SectionReveal>

        {albums.length === 0 ? (
          <EmptyState
            title="Gallery coming soon"
            description="Photos from worship, events, and outreach will appear here."
          />
        ) : (
          <SectionReveal delay={0.1}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {albums.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/gallery/${a.slug}`}
                  className={`group relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated ${
                    i % 2 === 0
                      ? "from-brand-100 to-brand-50"
                      : "from-brand-50 to-brand-100"
                  }`}
                >
                  {a.cover_image ? (
                    <Image
                      src={a.cover_image}
                      alt={a.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-900/85 to-transparent p-3 text-xs font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {a.title}
                  </div>
                </Link>
              ))}
            </div>
          </SectionReveal>
        )}
      </Container>
    </Section>
  );
}
