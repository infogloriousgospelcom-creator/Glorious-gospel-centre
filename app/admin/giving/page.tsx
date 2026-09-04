import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllGivingFiltered, type AdminTransactionDetail } from "@/services/admin/giving.read";
import { GivingFilters } from "./_components/GivingFilters";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Giving · Admin", robots: { index: false, follow: false } };

function formatKES(cents: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(cents / 100);
}
const STATUSES = ["all", "PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED"] as const;

export default async function AdminGivingPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await requireAdmin();
  const current = STATUSES.includes((searchParams.status ?? "all") as typeof STATUSES[number])
    ? (searchParams.status ?? "all")
    : "all";
  const search = searchParams.q ?? "";

  const [rows, all] = await Promise.all([
    listAllGivingFiltered({ status: current, search, actorId: session.userId }),
    current === "all" && !search
      ? Promise.resolve([] as Array<AdminTransactionDetail & { category_label?: string }>)
      : listAllGivingFiltered({ status: "all", actorId: session.userId }),
  ]);

  const counts: Record<string, number> = { all: all.length, PENDING: 0, PROCESSING: 0, SUCCESS: 0, FAILED: 0, CANCELLED: 0 };
  for (const r of all) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }
  if (current === "all" && !search) {
    counts.all = rows.length;
    for (const r of rows) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
  }

  return (
    <>
      <AdminSubnav active="/admin/giving" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Giving</h1>
            <p className="text-sm text-ink-muted">
              {rows.length} shown · {counts.all} total. All reads and status changes are audit-logged.
            </p>
          </div>

          <GivingFilters current={current} counts={counts} />

          {rows.length === 0 ? (
            <EmptyState
              title="No transactions match"
              description="Submissions from /give will appear here."
            />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/admin/giving/${t.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-brand-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            tone={
                              t.status === "SUCCESS" ? "success" :
                              t.status === "FAILED" || t.status === "CANCELLED" ? "danger" :
                              t.status === "PROCESSING" ? "warning" : "neutral"
                            }
                          >
                            {t.status}
                          </Badge>
                          <span className="text-sm font-medium text-ink">{t.category_label ?? "Uncategorised"}</span>
                          {t.admin_notes ? <Badge tone="warning">Overridden</Badge> : null}
                        </div>
                        <p className="text-xs text-ink-muted">
                          {t.phone ?? "—"} · {new Date(t.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-ink">{formatKES(t.amount_cents, t.currency)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
