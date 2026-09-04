import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllPrayerRequests } from "@/services/admin/prayer.read";
import { PrayerRow } from "./_components/PrayerRow";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prayer requests · Admin", robots: { index: false, follow: false } };
export default async function AdminPrayerRequestsPage() {
  await requireAdmin();
  const rows = await listAllPrayerRequests();
  return (
    <>
      <AdminSubnav active="/admin/prayer-requests" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Prayer requests</h1>
            <p className="text-sm text-ink-muted">{rows.length} total. Only prayer ministers and admins can see this page.</p>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No prayer requests" description="New submissions will appear here." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => <PrayerRow key={r.id} row={r} />)}
              </ul>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
