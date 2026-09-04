import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllAlbums } from "@/services/admin/gallery.read";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery · Admin", robots: { index: false, follow: false } };
export default async function AdminGalleryPage() {
  await requireAdmin();
  const rows = await listAllAlbums();
  return (
    <>
      <AdminSubnav active="/admin/gallery" />
      <Section>
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="heading-1">Gallery</h1>
              <p className="text-sm text-ink-muted">Manage photo albums.</p>
            </div>
            <Link href="/admin/gallery/new"><Button>New album</Button></Link>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No albums yet" description="Click 'New album' to create your first one." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{r.status}</Badge>
                        {r.category ? <Badge tone="accent">{r.category}</Badge> : null}
                        <code className="rounded bg-surface-inset px-2 py-0.5 text-xs">/{r.slug}</code>
                      </div>
                      <Link href={`/admin/gallery/${r.id}`} className="mt-1 block text-base font-medium text-ink hover:underline">{r.title}</Link>
                      <p className="truncate text-xs text-ink-muted">{r.description ?? ""}</p>
                    </div>
                    <Link href={`/admin/gallery/${r.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-800">Edit →</Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
