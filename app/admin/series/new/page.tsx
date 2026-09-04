import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { SeriesForm } from "../_components/SeriesForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New series · Admin",
  robots: { index: false, follow: false },
};

export default async function NewSeriesPage() {
  await requireAdmin();
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
                <CardTitle>New sermon series</CardTitle>
                <CardDescription>
                  Group related sermons under a common theme.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <SeriesForm />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
