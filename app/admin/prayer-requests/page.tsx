import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listPrayerRequestsAudited, countPrayerRequestsByStatus } from "@/services/admin/prayer.audited";
import { PrayerFilters } from "./_components/PrayerFilters";
import { PrayerRow } from "./_components/PrayerRow";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prayer requests · Admin", robots: { index: false, follow: false } };

const STATUSES = ["all", "NEW", "READ", "RESPONDED", "ARCHIVED"] as const;

export default async function AdminPrayerRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await requireAdmin();
  const current = STATUSES.includes((searchParams.status ?? "all") as typeof STATUSES[number])
    ? (searchParams.status ?? "all")
    : "all";
  const search = searchParams.q ?? "";

  const [rows, counts] = await Promise.all([
    listPrayerRequestsAudited({
      actorId: session.userId,
      status: current,
      search,
    }),
    // Counts come from a non-audited aggregate so the page render
    // does not write a second audit-log row. Only the explicit
    // filtered list read is recorded for compliance.
    countPrayerRequestsByStatus(),
  ]);

  return (
    <>
      <AdminSubnav active="/admin/prayer-requests" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Prayer requests</h1>
            <p className="text-sm text-ink-muted">
              {rows.length} shown · {counts.all ?? 0} total. Every view is logged in
              <code className="ml-1 rounded bg-surface-inset px-1.5 py-0.5 text-xs">audit_logs</code>.
            </p>
          </div>

          <PrayerFilters current={current} counts={counts} />

          {rows.length === 0 ? (
            <EmptyState
              title="No prayer requests match"
              description="Try a different filter or clear the search."
            />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <PrayerRow key={r.id} row={r} />
                ))}
              </ul>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
