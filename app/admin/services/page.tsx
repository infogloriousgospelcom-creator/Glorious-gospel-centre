import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllServices } from "@/services/admin/services.read";
import { DAYS_OF_WEEK } from "@/types/content";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Services · Admin", robots: { index: false, follow: false } };
export default async function AdminServicesPage() {
  await requireAdmin();
  const rows = await listAllServices();
  return (
    <>
      <AdminSubnav active="/admin/services" />
      <Section>
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="heading-1">Services</h1>
              <p className="text-sm text-ink-muted">Weekly schedule.</p>
            </div>
            <Link href="/admin/services/new"><Button>New service</Button></Link>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No services yet" description="Click 'New service' to add one." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{r.status}</Badge>
                        <Badge tone="brand">{DAYS_OF_WEEK[r.day_of_week]}</Badge>
                      </div>
                      <Link href={`/admin/services/${r.id}`} className="mt-1 block text-base font-medium text-ink hover:underline">{r.name}</Link>
                      <p className="text-xs text-ink-muted">{r.start_time}{r.end_time ? `–${r.end_time}` : ""}{r.location ? ` · ${r.location}` : ""}</p>
                    </div>
                    <Link href={`/admin/services/${r.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-800">Edit →</Link>
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
