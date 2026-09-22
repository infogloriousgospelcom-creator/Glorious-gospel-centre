import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { requirePermission } from "@/services/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import {
  countConnectGroupsByStatus,
  listConnectGroupsForAdmin,
} from "@/services/admin/connect-groups.read";
import { ConnectGroupFilters } from "./_components/ConnectGroupFilters";
import { ConnectGroupRow } from "./_components/ConnectGroupRow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Connect Groups · Admin",
  robots: { index: false, follow: false },
};

const STATUSES = ["all", "DRAFT", "OPEN", "FULL", "CLOSED", "ARCHIVED"] as const;

export default async function AdminConnectGroupsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await requirePermission("connect_groups.manage");
  const current = STATUSES.includes(
    (searchParams.status ?? "all") as (typeof STATUSES)[number],
  )
    ? (searchParams.status ?? "all")
    : "all";

  const [rows, counts] = await Promise.all([
    listConnectGroupsForAdmin({ status: current, search: searchParams.q ?? "" }),
    countConnectGroupsByStatus(),
  ]);

  await writeAuditLog({
    actorId: session.userId,
    action: "connect_group.read.list",
    entityType: "connect_group",
    entityId: null,
    metadata: { status: current, count: rows.length },
    ipHash: getClientIpHash(),
  });

  return (
    <Section>
      <Container>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="heading-1">Connect Groups</h1>
            <p className="text-sm text-ink-muted">
              Publish discovery information for fellowship groups. Membership joining is not
              enabled yet — use Contact for interest.
            </p>
          </div>
          <LinkButton href="/admin/connect-groups/new">New group</LinkButton>
        </div>

        <Suspense fallback={null}>
          <ConnectGroupFilters current={current} counts={counts} />
        </Suspense>

        {rows.length === 0 ? (
          <EmptyState
            title="No connect groups yet"
            description="Create a group to begin the public Connect discovery experience."
          >
            <Link
              href="/admin/connect-groups/new"
              className="text-sm font-semibold text-brand-700"
            >
              Create a group
            </Link>
          </EmptyState>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <ConnectGroupRow key={r.id} row={r} />
              ))}
            </ul>
          </Card>
        )}
      </Container>
    </Section>
  );
}
