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
import { getMinistryForAdmin } from "@/services/admin/ministries.read";
import { deleteMinistry } from "@/services/admin/ministries";
import { MinistryForm } from "../_components/MinistryForm";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params: _params }: { params: { id: string } }): Promise<Metadata> {
  return { title: "Edit ministry · Admin", robots: { index: false, follow: false } };
}

export default async function EditMinistryPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const row = await getMinistryForAdmin(params.id);
  if (!row) notFound();
  const id = params.id;
  async function deleteAction() {
    "use server";
    const res = await deleteMinistry(id);
    if (!res.ok) throw new Error(res.message);
  }
  return (
    <>
      <AdminSubnav active="/admin/ministries" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/ministries" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All ministries</Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit ministry</CardTitle>
                  <Badge>{row.status}</Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <MinistryForm
                  initial={{
                    id: row.id, slug: row.slug, name: row.name,
                    short_description: row.short_description, description: row.description,
                    hero_image: row.hero_image, meeting_info: row.meeting_info,
                    contact_email: row.contact_email, contact_phone: row.contact_phone,
                    sort_order: row.sort_order, status: row.status,
                  }}
                />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">Deleting a ministry removes its public page.</Alert>
                    <div className="mt-3 flex justify-end"><Button type="submit" variant="danger">Delete ministry</Button></div>
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
