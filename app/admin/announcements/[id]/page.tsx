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
import { getAnnouncementForAdmin } from "@/services/admin/announcements.read";
import { deleteAnnouncement } from "@/services/admin/announcements";
import { AnnouncementForm } from "../_components/AnnouncementForm";
import { ApprovalHistoryPanel } from "@/components/admin/ApprovalHistoryPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: _params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return { title: "Edit announcement · Admin", robots: { index: false, follow: false } };
}

export default async function EditAnnouncementPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const row = await getAnnouncementForAdmin(params.id);
  if (!row) notFound();
  const id = params.id;

  async function deleteAction() {
    "use server";
    const res = await deleteAnnouncement(id);
    if (!res.ok) {
      // The page will re-render with the error.
      throw new Error(res.message);
    }
  }

  return (
    <>
      <AdminSubnav active="/admin/announcements" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/admin/announcements"
              className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← All announcements
            </Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit announcement</CardTitle>
                  {row.is_pinned ? <Badge tone="accent">Pinned</Badge> : null}
                  <Badge>{row.status}</Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <AnnouncementForm
                  initial={{
                    id: row.id,
                    title: row.title,
                    body: row.body,
                    starts_at: row.starts_at,
                    ends_at: row.ends_at,
                    is_pinned: row.is_pinned,
                    status: row.status,
                  }}
                />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">
                      Deleting an announcement is permanent. The homepage and
                      dashboard will stop showing it immediately.
                    </Alert>
                    <div className="mt-3 flex justify-end">
                      <Button type="submit" variant="danger">
                        Delete announcement
                      </Button>
                    </div>
                  </form>
                </div>
                <ApprovalHistoryPanel entityType="announcements" entityId={row.id} />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
