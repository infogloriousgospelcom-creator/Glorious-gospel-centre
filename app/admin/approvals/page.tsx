import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listPendingContent } from "@/services/admin/approvals.read";
import { ApprovalQueue } from "./_components/ApprovalQueue";
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
            <p className="text-sm text-ink-muted">{rows.length} item(s) awaiting review. Every change is recorded in <code>approval_history</code> and <code>audit_logs</code>.</p>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Nothing pending" description="No content is awaiting approval." />
          ) : (
            <Card>
              <ApprovalQueue items={rows} />
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
void Badge;
