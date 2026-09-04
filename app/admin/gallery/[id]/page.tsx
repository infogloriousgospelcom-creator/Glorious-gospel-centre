import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { getAlbumForAdmin, listAlbumItemsForAdmin, publicStorageUrl } from "@/services/admin/gallery.read";
import { deleteAlbum } from "@/services/admin/gallery";
import { AlbumForm, GalleryItemForm, GalleryItemDelete } from "../_components/GalleryForms";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params: _ }: { params: { id: string } }): Promise<Metadata> {
  return { title: "Edit album · Admin", robots: { index: false, follow: false } };
}
export default async function EditAlbumPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const [album, items] = await Promise.all([
    getAlbumForAdmin(params.id),
    listAlbumItemsForAdmin(params.id),
  ]);
  if (!album) notFound();
  const id = params.id;
  async function deleteAction() {
    "use server";
    const res = await deleteAlbum(id);
    if (!res.ok) throw new Error(res.message);
  }
  return (
    <>
      <AdminSubnav active="/admin/gallery" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl space-y-8">
            <Link href="/admin/gallery" className="inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All albums</Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit album</CardTitle>
                  <Badge>{album.status}</Badge>
                  <code className="rounded bg-surface-inset px-2 py-0.5 text-xs">/{album.slug}</code>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <AlbumForm
                  initial={{
                    id: album.id, slug: album.slug, title: album.title, description: album.description,
                    cover_image: album.cover_image, category: album.category, event_date: album.event_date,
                    sort_order: album.sort_order, status: album.status,
                  }}
                />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">Deleting an album also removes all its photos from storage references.</Alert>
                    <div className="mt-3 flex justify-end"><Button type="submit" variant="danger">Delete album</Button></div>
                  </form>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Photos ({items.length})</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6 space-y-6">
                {items.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {items.map((it) => {
                      const url = publicStorageUrl("gallery-images", it.storage_path);
                      return (
                        <li key={it.id} className="rounded-xl border border-brand-100 bg-surface-muted p-2">
                          {url ? (
                            <img src={url} alt={it.alt_text ?? ""} className="aspect-square w-full rounded-lg object-cover" />
                          ) : (
                            <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-100 text-xs text-ink-muted">No preview</div>
                          )}
                          <p className="mt-2 truncate text-xs font-medium text-ink">{it.caption ?? it.storage_path}</p>
                          <div className="mt-1 flex items-center justify-between text-xs text-ink-muted">
                            <span className="truncate">{it.storage_path}</span>
                            <GalleryItemDelete itemId={it.id} albumId={album.id} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <div className="rounded-2xl border border-brand-100 bg-surface p-4">
                  <h3 className="mb-3 text-sm font-semibold text-ink">Add a photo</h3>
                  <GalleryItemForm albumId={album.id} />
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
