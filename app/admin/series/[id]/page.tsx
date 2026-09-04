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
import { getSeriesForAdmin } from "@/services/admin/series.read";
import { deleteSeries } from "@/services/admin/series";
import { SeriesForm } from "../_components/SeriesForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: _params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return { title: "Edit series · Admin", robots: { index: false, follow: false } };
}

export default async function EditSeriesPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const row = await getSeriesForAdmin(params.id);
  if (!row) notFound();
  const id = params.id;

  async function deleteAction() {
    "use server";
    const res = await deleteSeries(id);
    if (!res.ok) throw new Error(res.message);
  }

  return (
    <>
      <AdminSubnav active="/admin/series" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/admin/series"
              className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← All series
            </Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit series</CardTitle>
                  <Badge>{row.status}</Badge>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <SeriesForm
                  initial={{
                    id: row.id,
                    slug: row.slug,
                    title: row.title,
                    description: row.description,
                    hero_image: row.hero_image,
                    start_date: row.start_date,
                    end_date: row.end_date,
                    sort_order: row.sort_order,
                    status: row.status,
                  }}
                />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">
                      Deleting a series detaches its sermons (they remain
                      available) but removes the series page from the public
                      site.
                    </Alert>
                    <div className="mt-3 flex justify-end">
                      <Button type="submit" variant="danger">
                        Delete series
                      </Button>
                    </div>
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
