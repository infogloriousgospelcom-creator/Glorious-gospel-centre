import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requirePermission } from "@/services/auth";
import { listRecentAuditLogs } from "@/services/admin/audit.read";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit log · Admin", robots: { index: false, follow: false } };

export default async function AdminAuditLogPage() {
  await requirePermission("audit.view");
  const rows = await listRecentAuditLogs(200);
  return (
    <>
      <AdminSubnav active="/admin/audit" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Audit log</h1>
            <p className="text-sm text-ink-muted">Last 200 events · prayer reads, status changes, deletes, and more.</p>
          </div>
          <div className="mb-4">
            <Alert tone="info" title="Confidential data access">
              Every read of a prayer request is logged with the actor, IP hash,
              and the filter criteria. This is required for compliance with
              confidential-data handling.
            </Alert>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No audit events yet" description="Activity will appear here as admins use the system." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={r.id} className="px-5 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={
                        r.action.startsWith("prayer") ? "info" :
                        r.action.includes("delete") ? "danger" :
                        r.action.includes("status") ? "warning" : "neutral"
                      }>{r.action}</Badge>
                      {r.entity_type ? <Badge tone="neutral">{r.entity_type}</Badge> : null}
                      <span className="text-xs text-ink-muted">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      actor: {r.actor_email ?? "anonymous"} · ip: {r.ip_hash ? r.ip_hash.slice(0, 10) + "…" : "—"}
                    </p>
                    {Object.keys(r.metadata).length > 0 ? (
                      <pre className="mt-1 overflow-x-auto rounded bg-surface-inset p-2 text-xs text-ink-muted">
                        {JSON.stringify(r.metadata, null, 2)}
                      </pre>
                    ) : null}
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
