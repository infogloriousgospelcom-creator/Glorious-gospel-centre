import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllMinistries } from "@/services/admin/ministries.read";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ministries · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminMinistriesPage() {
  await requireAdmin();
  const rows = await listAllMinistries();
  return (
    <>
      <AdminSubnav active="/admin/ministries" />
      <Section>
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="heading-1">Ministries</h1>
              <p className="text-sm text-ink-muted">Manage ministry listings.</p>
            </div>
            <Link href="/admin/ministries/new">
              <Button>New ministry</Button>
            </Link>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No ministries yet" description="Click 'New ministry' to create your first one." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{r.status}</Badge>
                        {r.contact_email ? <Badge tone="accent">Has contact</Badge> : null}
                      </div>
                      <Link href={`/admin/ministries/${r.id}`} className="mt-1 block text-base font-medium text-ink hover:underline">{r.name}</Link>
                      <p className="truncate text-xs text-ink-muted">{r.short_description ?? r.description ?? ""}</p>
                    </div>
                    <Link href={`/admin/ministries/${r.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-800">Edit →</Link>
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
