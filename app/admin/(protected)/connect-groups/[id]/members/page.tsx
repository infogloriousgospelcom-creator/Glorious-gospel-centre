import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { requirePermission } from "@/services/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import { getConnectGroupForAdmin } from "@/services/admin/connect-groups.read";
import {
  countMembershipsByStatusForGroup,
  listMembershipsForGroupAdmin,
} from "@/services/admin/connect-group-members.read";
import { CONNECT_GROUP_MEMBER_STATUSES } from "@/lib/connect-group-members";
import { MembershipFilters } from "./_components/MembershipFilters";
import { MembershipRow } from "./_components/MembershipRow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Group memberships · Admin",
  robots: { index: false, follow: false },
};

const FILTERS = ["all", ...CONNECT_GROUP_MEMBER_STATUSES] as const;

export default async function ConnectGroupMembersAdminPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { status?: string };
}) {
  const session = await requirePermission("connect_groups.members.manage");

  const group = await getConnectGroupForAdmin(params.id);
  if (!group) notFound();

  const current = FILTERS.includes(
    (searchParams.status ?? "PENDING") as (typeof FILTERS)[number],
  )
    ? (searchParams.status ?? "PENDING")
    : "PENDING";

  const [rows, counts] = await Promise.all([
    listMembershipsForGroupAdmin({
      connectGroupId: params.id,
      status: current,
    }),
    countMembershipsByStatusForGroup(params.id),
  ]);

  await writeAuditLog({
    actorId: session.userId,
    action: "connect_group_member.read.list",
    entityType: "connect_group",
    entityId: params.id,
    metadata: { status: current, count: rows.length },
    ipHash: getClientIpHash(),
  });

  return (
    <Section>
      <Container>
        <div className="mb-6">
          <Link
            href="/admin/connect-groups"
            className="mb-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            ← Connect Groups
          </Link>
          <h1 className="heading-1">{group.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Moderate membership requests. Approve, decline, or remove members. History rows are
            preserved — members are never hard-deleted.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/admin/connect-groups/${group.id}`}
              className="font-medium text-brand-700 hover:underline"
            >
              Edit group details
            </Link>
            {group.published_at &&
            (group.status === "OPEN" ||
              group.status === "FULL" ||
              group.status === "CLOSED") ? (
              <Link
                href={`/connect/${group.slug}`}
                className="font-medium text-ink-muted hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                View public page
              </Link>
            ) : null}
          </div>
        </div>

        <Suspense fallback={null}>
          <MembershipFilters groupId={params.id} current={current} counts={counts} />
        </Suspense>

        {rows.length === 0 ? (
          <EmptyState
            title="No memberships in this filter"
            description="Pending requests appear here when congregants request to join an open published group."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <MembershipRow key={r.id} row={r} />
              ))}
            </ul>
          </Card>
        )}
      </Container>
    </Section>
  );
}
