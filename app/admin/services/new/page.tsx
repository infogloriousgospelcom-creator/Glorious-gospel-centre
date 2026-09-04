import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { ServiceForm } from "../_components/ServiceForm";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New service · Admin", robots: { index: false, follow: false } };
export default async function NewServicePage() {
  await requireAdmin();
  return (
    <>
      <AdminSubnav active="/admin/services" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/services" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All services</Link>
            <Card>
              <CardHeader><CardTitle>New service</CardTitle><CardDescription>Add a weekly service slot.</CardDescription></CardHeader>
              <div className="px-6 pb-6"><ServiceForm /></div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
