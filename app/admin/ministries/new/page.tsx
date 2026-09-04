import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { MinistryForm } from "../_components/MinistryForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New ministry · Admin", robots: { index: false, follow: false } };

export default async function NewMinistryPage() {
  await requireAdmin();
  return (
    <>
      <AdminSubnav active="/admin/ministries" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/ministries" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All ministries</Link>
            <Card>
              <CardHeader>
                <CardTitle>New ministry</CardTitle>
                <CardDescription>Create a ministry listing on the public site.</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6"><MinistryForm /></div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
