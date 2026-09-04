import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { AlbumForm } from "../_components/GalleryForms";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New album · Admin", robots: { index: false, follow: false } };
export default async function NewAlbumPage() {
  await requireAdmin();
  return (
    <>
      <AdminSubnav active="/admin/gallery" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/gallery" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All albums</Link>
            <Card>
              <CardHeader>
                <CardTitle>New album</CardTitle>
                <CardDescription>Add a public photo album.</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <Alert tone="info" title="Uploading photos">
                  Phase 16 ships the album + item management. Direct uploads to
                  Supabase Storage will be wired in Phase 21 (Performance) — for
                  now, upload via the Supabase dashboard and reference files
                  by their storage path.
                </Alert>
                <div className="mt-6"><AlbumForm /></div>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
