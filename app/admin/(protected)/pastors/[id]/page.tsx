import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { requireAdmin } from "@/services/auth";
import { getLeaderForAdmin } from "@/services/admin/leaders.read";
import { deleteLeader } from "@/services/admin/leaders";
import { LeaderForm } from "@/components/admin/LeaderForm";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params: _ }: { params: { id: string } }): Promise<Metadata> {
  return { title: "Edit pastor · Admin", robots: { index: false, follow: false } };
}
export default async function EditPastorPage({ params }: { params: { id: string } }) {
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
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/pastors" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All pastors</Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit pastor</CardTitle>
                  <Badge>{row.status}</Badge>
                  <Badge tone="accent">{row.category === "PASTOR" ? "Pastor" : "Leadership"}</Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                {row.category !== "PASTOR" ? (
                  <div className="mb-5">
                    <Alert tone="warning" title="Not on the Pastors page">
                      This person is categorised as Leadership. Set the category to Pastor to show
                      them on the Pastors page.
                    </Alert>
                  </div>
                ) : null}
                <LeaderForm
                  initial={{
                    id: row.id, full_name: row.full_name, title: row.title, bio: row.bio,
                    image_url: row.image_url, email: row.email, phone: row.phone,
                    sort_order: row.sort_order, is_featured: row.is_featured,
                    category: row.category, status: row.status,
                  }}
                  createLabel="Create pastor"
                  photoLabel="Pastor photo"
                />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">Deleting a pastor removes them from the public site.</Alert>
                    <div className="mt-3 flex justify-end"><Button type="submit" variant="danger">Delete pastor</Button></div>
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
