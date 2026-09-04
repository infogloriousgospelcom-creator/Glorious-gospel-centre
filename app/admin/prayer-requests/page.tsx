import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listPrayerRequestsAudited } from "@/services/admin/prayer.audited";
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

  const rows = await listPrayerRequestsAudited({
    actorId: session.userId,
    status: current,
    search,
  });

  // Counts for chips. We need an unfiltered list to count per status.
  const all = current === "all" && !search
    ? rows
    : await listPrayerRequestsAudited({ actorId: session.userId, status: "all" });
  const counts: Record<string, number> = { all: all.length, NEW: 0, READ: 0, RESPONDED: 0, ARCHIVED: 0 };
  for (const r of all) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }

  return (
    <>
      <AdminSubnav active="/admin/prayer-requests" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Prayer requests</h1>
            <p className="text-sm text-ink-muted">
              {rows.length} shown · {all.length} total. Every view is logged in
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
