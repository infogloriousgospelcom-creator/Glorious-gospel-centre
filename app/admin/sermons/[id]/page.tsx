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
import { getSermonForAdmin, listAllSeriesOptions } from "@/services/admin/sermons.read";
import { deleteSermon } from "@/services/admin/sermons";
import { SermonForm } from "../_components/SermonForm";
import { ApprovalHistoryPanel } from "@/components/admin/ApprovalHistoryPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: _params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return { title: "Edit sermon · Admin", robots: { index: false, follow: false } };
}

export default async function EditSermonPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const [row, seriesOptions] = await Promise.all([
    getSermonForAdmin(params.id),
    listAllSeriesOptions(),
  ]);
  if (!row) notFound();
  const id = params.id;

  async function deleteAction() {
    "use server";
    const res = await deleteSermon(id);
    if (!res.ok) throw new Error(res.message);
  }

  return (
    <>
      <AdminSubnav active="/admin/sermons" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/admin/sermons"
              className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← All sermons
            </Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit sermon</CardTitle>
                  <Badge>{row.status}</Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <SermonForm
                  seriesOptions={seriesOptions}
                  initial={{
                    id: row.id,
                    slug: row.slug,
                    title: row.title,
                    description: row.description,
                    speaker: row.speaker,
                    preached_on: row.preached_on,
                    scripture: row.scripture,
                    category: row.category,
                    thumbnail_url: row.thumbnail_url,
                    video_url: row.video_url,
                    audio_url: row.audio_url,
                    livestream_url: row.livestream_url,
                    duration_seconds: row.duration_seconds,
                    series_id: row.series_id,
                    status: row.status,
                  }}
                />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">
                      Deleting a sermon removes it from the public library
                      and any series.
                    </Alert>
                    <div className="mt-3 flex justify-end">
                      <Button type="submit" variant="danger">
                        Delete sermon
                      </Button>
                    </div>
                  </form>
                </div>
                <ApprovalHistoryPanel entityType="sermons" entityId={row.id} />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
