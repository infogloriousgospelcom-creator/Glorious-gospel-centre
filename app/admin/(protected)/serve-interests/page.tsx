import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { requirePermission } from "@/services/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import {
  countServeInterestsByStatus,
  listMinistriesForServeFilter,
  listServeInterestsForAdmin,
} from "@/services/admin/serve-interests.read";
import { SERVE_INTEREST_STATUSES } from "@/lib/ministry-serve-interest";
import { ServeInterestFilters } from "./_components/ServeInterestFilters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Serve interests · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminServeInterestsPage({
  searchParams,
}: {
  searchParams: { status?: string; ministry?: string };
}) {
  const session = await requirePermission("serve_interests.manage");
  const status = SERVE_INTEREST_STATUSES.includes(
    (searchParams.status ?? "all") as (typeof SERVE_INTEREST_STATUSES)[number],
  )
    ? (searchParams.status as string)
    : searchParams.status === "all"
      ? "all"
      : "all";
  const ministryId = searchParams.ministry ?? "all";

  const [rows, counts, ministries] = await Promise.all([
    listServeInterestsForAdmin({ status, ministryId }),
    countServeInterestsByStatus(),
    listMinistriesForServeFilter(),
  ]);

  await writeAuditLog({
    actorId: session.userId,
    action: "serve_interest.read.list",
    entityType: "ministry_serve_interest",
    entityId: null,
    metadata: { status, ministry_id: ministryId === "all" ? null : ministryId, count: rows.length },
    ipHash: getClientIpHash(),
  });

  return (
    <Section>
      <Container>
        <div className="mb-6">
          <h1 className="heading-1">Serve interests</h1>
          <p className="text-sm text-ink-muted">
            Review congregant interest in serving. Staff notes are private and never shown on the
            public site or member account.
          </p>
        </div>

        <Suspense fallback={null}>
          <ServeInterestFilters
            currentStatus={status}
            currentMinistry={ministryId}
            counts={counts}
            ministries={ministries}
          />
        </Suspense>

        {rows.length === 0 ? (
          <EmptyState
            title="No serve interests match"
            description="Try a different status or ministry filter."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/admin/serve-interests/${row.id}`}
                    className="flex min-h-touch flex-col gap-1 px-5 py-4 transition-colors hover:bg-brand-50/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-display font-semibold text-brand-900">
                        {row.member_full_name?.trim() || "Member"}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {row.ministry_name ?? "General serving"} ·{" "}
                        {new Date(row.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge tone={row.status === "NEW" ? "warning" : "neutral"}>{row.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Container>
    </Section>
  );
}
