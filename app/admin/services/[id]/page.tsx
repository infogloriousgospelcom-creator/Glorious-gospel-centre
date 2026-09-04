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
import { getServiceForAdmin } from "@/services/admin/services.read";
import { deleteService } from "@/services/admin/services";
import { ServiceForm } from "../_components/ServiceForm";
import { DAYS_OF_WEEK } from "@/types/content";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params: _ }: { params: { id: string } }): Promise<Metadata> {
  return { title: "Edit service · Admin", robots: { index: false, follow: false } };
}
export default async function EditServicePage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const row = await getServiceForAdmin(params.id);
  if (!row) notFound();
  const id = params.id;
  async function deleteAction() {
    "use server";
    const res = await deleteService(id);
    if (!res.ok) throw new Error(res.message);
  }
  return (
    <>
      <AdminSubnav active="/admin/services" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/services" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All services</Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit service</CardTitle>
                  <Badge>{row.status}</Badge>
                  <Badge tone="brand">{DAYS_OF_WEEK[row.day_of_week]}</Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <ServiceForm initial={{
                  id: row.id, name: row.name, description: row.description,
                  day_of_week: row.day_of_week, start_time: row.start_time, end_time: row.end_time,
                  location: row.location, sort_order: row.sort_order,
                  is_recurring: row.is_recurring, status: row.status,
                }} />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">Deleting a service removes it from the public schedule.</Alert>
                    <div className="mt-3 flex justify-end"><Button type="submit" variant="danger">Delete service</Button></div>
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
