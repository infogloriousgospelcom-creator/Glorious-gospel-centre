import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { AnnouncementForm } from "../_components/AnnouncementForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New announcement · Admin",
  robots: { index: false, follow: false },
};

export default async function NewAnnouncementPage() {
  await requireAdmin();
  return (
    <>
      <AdminSubnav active="/admin/announcements" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/admin/announcements"
              className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← All announcements
            </Link>
            <Card>
              <CardHeader>
                <CardTitle>New announcement</CardTitle>
                <CardDescription>
                  Create a public announcement. Mark as Published when ready.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <AnnouncementForm />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
