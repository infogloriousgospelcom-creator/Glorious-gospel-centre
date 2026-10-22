import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { requirePermission } from "@/services/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import {
  countTestimoniesByStatus,
  listTestimoniesForAdmin,
} from "@/services/admin/testimonies.read";
import { TestimonyFilters } from "./_components/TestimonyFilters";
import { TestimonyRow } from "./_components/TestimonyRow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Testimonies · Admin",
  robots: { index: false, follow: false },
};

const STATUSES = ["all", "PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as const;

export default async function AdminTestimoniesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await requirePermission("testimonies.manage");
  const current = STATUSES.includes(
    (searchParams.status ?? "all") as (typeof STATUSES)[number],
  )
    ? (searchParams.status ?? "all")
    : "all";
  const search = searchParams.q ?? "";

  const [rows, counts] = await Promise.all([
    listTestimoniesForAdmin({ status: current, search }),
    countTestimoniesByStatus(),
  ]);

  await writeAuditLog({
    actorId: session.userId,
    action: "testimony.read.list",
    entityType: "testimony",
    entityId: null,
    metadata: { status: current, search, count: rows.length },
    ipHash: getClientIpHash(),
  });

  return (
    <Section>
      <Container>
        <div className="mb-6">
          <h1 className="heading-1">Stories of Grace</h1>
          <p className="text-sm text-ink-muted">
            Review testimony submissions before they appear publicly. Contact details are
            private to authorized moderators.
          </p>
        </div>

        <Suspense fallback={null}>
          <TestimonyFilters current={current} counts={counts} />
        </Suspense>

        {rows.length === 0 ? (
          <EmptyState
            title="No testimonies match"
            description="Try a different filter, or wait for new submissions from /testimonies/share."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <TestimonyRow key={r.id} row={r} />
              ))}
            </ul>
          </Card>
        )}
      </Container>
    </Section>
  );
}
