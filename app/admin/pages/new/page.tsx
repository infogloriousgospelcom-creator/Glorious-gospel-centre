import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { PageForm } from "../_components/PageForm";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New page · Admin", robots: { index: false, follow: false } };
export default async function NewPagePage() {
  await requireAdmin();
  return (
    <>
      <AdminSubnav active="/admin/pages" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/pages" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All pages</Link>
            <Card>
              <CardHeader>
                <CardTitle>New page</CardTitle>
                <CardDescription>Create a public CMS page.</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6"><PageForm /></div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
