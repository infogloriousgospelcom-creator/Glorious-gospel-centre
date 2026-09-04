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
import { getLeaderForAdmin } from "@/services/admin/leaders.read";
import { deleteLeader } from "@/services/admin/leaders";
import { LeaderForm } from "../_components/LeaderForm";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params: _ }: { params: { id: string } }): Promise<Metadata> {
  return { title: "Edit leader · Admin", robots: { index: false, follow: false } };
}
export default async function EditLeaderPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const row = await getLeaderForAdmin(params.id);
  if (!row) notFound();
  const id = params.id;
  async function deleteAction() {
    "use server";
    const res = await deleteLeader(id);
    if (!res.ok) throw new Error(res.message);
  }
  return (
    <>
      <AdminSubnav active="/admin/leadership" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/leadership" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All leaders</Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit leader</CardTitle>
                  <Badge>{row.status}</Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <LeaderForm initial={{
                  id: row.id, full_name: row.full_name, title: row.title, bio: row.bio,
                  image_url: row.image_url, email: row.email, phone: row.phone,
                  sort_order: row.sort_order, is_featured: row.is_featured, status: row.status,
                }} />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">Deleting a leader removes them from the public site.</Alert>
                    <div className="mt-3 flex justify-end"><Button type="submit" variant="danger">Delete leader</Button></div>
                  </form>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
