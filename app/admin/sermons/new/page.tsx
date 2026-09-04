import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllSeriesOptions } from "@/services/admin/sermons.read";
import { SermonForm } from "../_components/SermonForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New sermon · Admin",
  robots: { index: false, follow: false },
};

export default async function NewSermonPage() {
  await requireAdmin();
  const seriesOptions = await listAllSeriesOptions();
  return (
    <>
      <AdminSubnav active="/admin/sermons" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/admin/sermons"
              className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← All sermons
            </Link>
            <Card>
              <CardHeader>
                <CardTitle>New sermon</CardTitle>
                <CardDescription>
                  Add a sermon to the library. Set status to Published when ready.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <SermonForm seriesOptions={seriesOptions} />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
