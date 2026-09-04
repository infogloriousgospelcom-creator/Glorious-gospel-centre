import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listPendingContent } from "@/services/admin/approvals.read";
import { ApprovalActions } from "./_components/ApprovalActions";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Approvals · Admin", robots: { index: false, follow: false } };
export default async function AdminApprovalsPage() {
  await requireAdmin();
  const rows = await listPendingContent();
  return (
    <>
      <AdminSubnav active="/admin/approvals" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Approval queue</h1>
            <p className="text-sm text-ink-muted">Content awaiting review across all types.</p>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Nothing pending" description="No content is awaiting approval." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={`${r.table}:${r.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <Badge tone="warning">{r.table}</Badge>
                      <p className="mt-1 text-base font-medium text-ink">{r.title}</p>
                      <p className="text-xs text-ink-muted">Submitted {new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <ApprovalActions table={r.table} id={r.id} />
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
