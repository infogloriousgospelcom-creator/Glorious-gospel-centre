import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { getTransactionForAdmin } from "@/services/admin/giving.read";
import { StatusOverride } from "../_components/StatusOverride";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params: _ }: { params: { id: string } }): Promise<Metadata> {
  return { title: "Transaction · Admin", robots: { index: false, follow: false } };
}

function formatKES(cents: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(cents / 100);
}

export default async function GivingTransactionPage({ params }: { params: { id: string } }) {
  const session = await requireAdmin();
  const tx = await getTransactionForAdmin({ id: params.id, actorId: session.userId });
  if (!tx) notFound();

  return (
    <>
      <AdminSubnav active="/admin/giving" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl space-y-6">
            <Link href="/admin/giving" className="inline-block text-sm font-medium text-brand-700 hover:text-brand-800">← All transactions</Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Transaction</CardTitle>
                  <Badge
                    tone={
                      tx.status === "SUCCESS" ? "success" :
                      tx.status === "FAILED" || tx.status === "CANCELLED" ? "danger" :
                      tx.status === "PROCESSING" ? "warning" : "neutral"
                    }
                  >
                    {tx.status}
                  </Badge>
                  {tx.admin_notes ? <Badge tone="warning">Overridden</Badge> : null}
                </div>
              </CardHeader>
              <div className="px-6 pb-6 space-y-4 text-sm">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-ink-muted">Amount</dt>
                    <dd className="text-base font-semibold text-ink">{formatKES(tx.amount_cents, tx.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Category</dt>
                    <dd className="text-ink">{tx.category_label ?? "Uncategorised"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Provider</dt>
                    <dd className="text-ink">{tx.provider}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">External reference</dt>
                    <dd className="break-all font-mono text-xs text-ink">{tx.external_reference ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Phone</dt>
                    <dd className="text-ink">{tx.phone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Created</dt>
                    <dd className="text-ink">{new Date(tx.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Updated</dt>
                    <dd className="text-ink">{new Date(tx.updated_at).toLocaleString()}</dd>
                  </div>
                </dl>
                {tx.admin_notes ? (
                  <div className="rounded-2xl border border-warning-600/30 bg-warning-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-warning-700">Admin note</p>
                    <p className="mt-1 text-sm text-ink">{tx.admin_notes}</p>
                  </div>
                ) : null}
                <details className="rounded-2xl border border-brand-100 bg-surface p-3">
                  <summary className="cursor-pointer text-xs font-medium text-ink-muted">Raw provider callback (debug)</summary>
                  <pre className="mt-2 overflow-x-auto rounded bg-surface-inset p-2 text-xs text-ink-muted">
                    {JSON.stringify(tx.raw_callback, null, 2)}
                  </pre>
                </details>
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Override status</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <StatusOverride id={tx.id} currentStatus={tx.status} />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
