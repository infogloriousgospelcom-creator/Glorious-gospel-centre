import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow } from "@/components/ui/Section";
import { getAlbumBySlug, listAlbumItems, publicStorageUrl } from "@/services/gallery";
import { AlbumItemGrid } from "../_components/AlbumItemGrid";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { album: string };
}): Promise<Metadata> {
  const album = await getAlbumBySlug(params.album);
  if (!album) return { title: "Album" };
  return {
    title: album.title,
    description: album.description ?? `Photos from ${album.title}.`,
  };
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AlbumDetailPage({
  params,
}: {
  params: { album: string };
}) {
  const album = await getAlbumBySlug(params.album);
  if (!album) notFound();
  const items = await listAlbumItems(album.id);

  const lightboxItems = items
    .map((it) => {
      const url = publicStorageUrl("gallery-images", it.storage_path) ?? it.storage_path;
      return { src: url, alt: it.alt_text ?? "", caption: it.caption };
    })
    .filter((it) => Boolean(it.src));

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl">
              <Link
                href="/gallery"
                className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                ← All albums
              </Link>
              <SectionEyebrow>Album</SectionEyebrow>
              <h1 className="heading-1 mb-4 text-balance">{album.title}</h1>
              {album.description ? (
                <p className="lead text-balance">{album.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                {album.category ? <Badge tone="accent">{album.category}</Badge> : null}
                {album.event_date ? (
                  <span>{formatDate(album.event_date)}</span>
                ) : null}
                <span>·</span>
                <span>
                  {items.length} photo{items.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </Container>
        </Section>

        {album.cover_image ? (
          <Container>
            <img
              src={album.cover_image}
              alt={album.title}
              className="aspect-[21/9] w-full rounded-2xl object-cover shadow-elevated"
            />
          </Container>
        ) : null}

        <Section>
          <Container>
            {lightboxItems.length === 0 ? (
              <EmptyState
                title="No photos yet"
                description="Once photos are uploaded via the admin and tagged to this album, they will appear here."
              />
            ) : (
              <AlbumItemGrid items={lightboxItems} />
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
