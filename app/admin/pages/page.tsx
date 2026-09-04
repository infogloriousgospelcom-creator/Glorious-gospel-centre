import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllPages } from "@/services/admin/pages.read";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pages · Admin", robots: { index: false, follow: false } };
export default async function AdminPagesPage() {
  await requireAdmin();
  const rows = await listAllPages();
  return (
    <>
      <AdminSubnav active="/admin/pages" />
      <Section>
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="heading-1">Pages</h1>
              <p className="text-sm text-ink-muted">CMS pages (About, Our Story, etc.).</p>
            </div>
            <Link href="/admin/pages/new"><Button>New page</Button></Link>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No pages yet" description="Click 'New page' to create your first one." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{r.status}</Badge>
                        <code className="rounded bg-surface-inset px-2 py-0.5 text-xs">/{r.slug}</code>
                      </div>
                      <Link href={`/admin/pages/${r.id}`} className="mt-1 block text-base font-medium text-ink hover:underline">{r.title}</Link>
                      <p className="truncate text-xs text-ink-muted">{r.excerpt ?? ""}</p>
                    </div>
                    <Link href={`/admin/pages/${r.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-800">Edit →</Link>
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
