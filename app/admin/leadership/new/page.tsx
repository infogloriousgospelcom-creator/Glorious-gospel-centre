import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { LeaderForm } from "../_components/LeaderForm";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New leader · Admin", robots: { index: false, follow: false } };
export default async function NewLeaderPage() {
  await requireAdmin();
  return (
    <>
      <AdminSubnav active="/admin/leadership" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/leadership" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All leaders</Link>
            <Card>
              <CardHeader>
                <CardTitle>New leader</CardTitle>
                <CardDescription>Add a pastor, elder, or ministry leader.</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6"><LeaderForm /></div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
