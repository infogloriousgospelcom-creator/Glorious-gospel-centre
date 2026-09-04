import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllGiving, listAllGivingCategories } from "@/services/admin/giving.read";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Giving · Admin", robots: { index: false, follow: false } };
function formatKES(cents: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(cents / 100);
}
export default async function AdminGivingPage() {
  await requireAdmin();
  const [txs, categories] = await Promise.all([listAllGiving(), listAllGivingCategories()]);
  return (
    <>
      <AdminSubnav active="/admin/giving" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Giving</h1>
            <p className="text-sm text-ink-muted">{txs.length} recent transactions · {categories.length} categories.</p>
          </div>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="heading-3">Categories</h2>
              </CardHeader>
              <div className="px-6 pb-6">
                {categories.length === 0 ? (
                  <EmptyState title="No categories" description="Seed the giving_categories table." />
                ) : (
                  <ul className="space-y-2 text-sm">
                    {categories.map((c) => (
                      <li key={c.id} className="flex items-center justify-between">
                        <span className="font-medium text-ink">{c.label}</span>
                        <Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="heading-3">Recent activity</h2>
              </CardHeader>
              <div className="px-6 pb-6">
                {txs.length === 0 ? (
                  <EmptyState title="No transactions yet" description="Submissions from /give will appear here." />
                ) : (
                  <p className="text-sm text-ink-muted">
                    Latest {txs.length} transactions. Use Supabase SQL for full
                    financial reports.
                  </p>
                )}
              </div>
            </Card>
          </div>
          {txs.length > 0 ? (
            <Card>
              <ul className="divide-y divide-brand-100">
                {txs.slice(0, 50).map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={
                          t.status === "SUCCESS" ? "success" :
                          t.status === "FAILED" || t.status === "CANCELLED" ? "danger" :
                          t.status === "PROCESSING" ? "warning" : "neutral"
                        }>{t.status}</Badge>
                        <span className="text-sm font-medium text-ink">{t.category_label ?? "Uncategorised"}</span>
                      </div>
                      <p className="text-xs text-ink-muted">{t.phone ?? "—"} · {new Date(t.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink">{formatKES(t.amount_cents, t.currency)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
