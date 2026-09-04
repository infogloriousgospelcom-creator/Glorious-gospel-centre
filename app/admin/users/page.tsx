import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { Alert } from "@/components/ui/Alert";
import { requireAdmin } from "@/services/auth";
import { listAdminUsers } from "@/services/admin/users.read";
import { AdminToggle } from "./_components/AdminToggle";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admins · Admin", robots: { index: false, follow: false } };
export default async function AdminUsersPage() {
  await requireAdmin();
  const rows = await listAdminUsers();
  return (
    <>
      <AdminSubnav active="/admin/users" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Administrators</h1>
            <p className="text-sm text-ink-muted">Manage admin access.</p>
          </div>
          <div className="mb-4">
            <Alert tone="info" title="Adding administrators">
              The first SUPER_ADMIN must be created via the Supabase dashboard
              (see <code>FIRST_ADMIN.md</code>). To add additional admins with
              existing Supabase Auth users, run the same SQL with a different
              email and role.
            </Alert>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No admins yet" description="Create the first SUPER_ADMIN via the dashboard." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.role_keys.map((rk) => <Badge key={rk} tone="brand">{rk}</Badge>)}
                        {!r.is_active ? <Badge tone="warning">Disabled</Badge> : null}
                      </div>
                      <p className="mt-1 text-base font-medium text-ink">{r.full_name ?? r.email}</p>
                      <p className="text-xs text-ink-muted">{r.email}</p>
                    </div>
                    <AdminToggle id={r.id} isActive={r.is_active} />
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
