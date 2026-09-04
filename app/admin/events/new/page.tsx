import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { EventForm } from "../_components/EventForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New event · Admin",
  robots: { index: false, follow: false },
};

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <>
      <AdminSubnav active="/admin/events" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/admin/events"
              className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← All events
            </Link>
            <Card>
              <CardHeader>
                <CardTitle>New event</CardTitle>
                <CardDescription>
                  Create a public event. Mark as Published when ready.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <EventForm />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
