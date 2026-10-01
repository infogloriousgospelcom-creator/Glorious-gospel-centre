import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { requireAdmin } from "@/services/auth";
import { LeaderForm } from "@/components/admin/LeaderForm";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New pastor · Admin", robots: { index: false, follow: false } };
export default async function NewPastorPage() {
  await requireAdmin();
  return (
    <>
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/admin/pastors" className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All pastors</Link>
            <Card>
              <CardHeader>
                <CardTitle>New pastor</CardTitle>
                <CardDescription>Add a pastor to the Pastors page.</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <LeaderForm
                  initial={{ category: "PASTOR" }}
                  createLabel="Create pastor"
                  photoLabel="Pastor photo"
                />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
