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
import { getPageForAdmin } from "@/services/admin/pages.read";
import { deletePage } from "@/services/admin/pages";
import { PageForm } from "../_components/PageForm";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params: _ }: { params: { id: string } }): Promise<Metadata> {
  return { title: "Edit page · Admin", robots: { index: false, follow: false } };
}
export default async function EditPagePage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const row = await getPageForAdmin(params.id);
  if (!row) notFound();
  const id = params.id;
  async function deleteAction() {
    "use server";
    const res = await deletePage(id);
    if (!res.ok) throw new Error(res.message);
  }
  return (
    <>
      <AdminSubnav active="/admin/pages" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/pages" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All pages</Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit page</CardTitle>
                  <Badge>{row.status}</Badge>
                  <code className="rounded bg-surface-inset px-2 py-0.5 text-xs">/{row.slug}</code>
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <PageForm initial={{
                  id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt,
                  body: row.body, hero_image: row.hero_image,
                  seo_title: row.seo_title, seo_description: row.seo_description, seo_og_image: row.seo_og_image,
                  status: row.status,
                }} />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">Deleting a page removes it from the public site.</Alert>
                    <div className="mt-3 flex justify-end"><Button type="submit" variant="danger">Delete page</Button></div>
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
