import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllLeaders } from "@/services/admin/leaders.read";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leadership · Admin", robots: { index: false, follow: false } };

export default async function AdminLeadershipPage() {
  await requireAdmin();
  const rows = await listAllLeaders();
  return (
    <>
      <AdminSubnav active="/admin/leadership" />
      <Section>
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="heading-1">Leadership</h1>
              <p className="text-sm text-ink-muted">Pastors, elders, and ministry leaders.</p>
            </div>
            <Link href="/admin/leadership/new"><Button>New leader</Button></Link>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No leaders yet" description="Click 'New leader' to add the first one." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{r.status}</Badge>
                        {r.is_featured ? <Badge tone="accent">Featured</Badge> : null}
                      </div>
                      <Link href={`/admin/leadership/${r.id}`} className="mt-1 block text-base font-medium text-ink hover:underline">
                        {r.full_name}
                        {r.title ? <span className="ml-2 text-xs text-ink-muted">· {r.title}</span> : null}
                      </Link>
                    </div>
                    <Link href={`/admin/leadership/${r.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-800">Edit →</Link>
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
