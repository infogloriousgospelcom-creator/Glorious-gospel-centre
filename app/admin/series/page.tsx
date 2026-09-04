import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllSeries } from "@/services/admin/series.read";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Series · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSeriesPage() {
  await requireAdmin();
  const rows = await listAllSeries();
  return (
    <>
      <AdminSubnav active="/admin/series" />
      <Section>
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="heading-1">Sermon series</h1>
              <p className="text-sm text-ink-muted">Group related sermons.</p>
            </div>
            <Link href="/admin/series/new">
              <Button>New series</Button>
            </Link>
          </div>
          {rows.length === 0 ? (
            <EmptyState
              title="No series yet"
              description="Click 'New series' to create your first one."
            />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <Badge>{r.status}</Badge>
                      <Link
                        href={`/admin/series/${r.id}`}
                        className="mt-1 block text-base font-medium text-ink hover:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {r.start_date ? `Started ${r.start_date}` : "No start date"}
                        {r.end_date ? ` · ended ${r.end_date}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/admin/series/${r.id}`}
                      className="text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      Edit →
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
