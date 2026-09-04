import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllEvents } from "@/services/admin/events.read";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events · Admin",
  robots: { index: false, follow: false },
};

function statusTone(s: string): "neutral" | "success" | "warning" {
  switch (s) {
    case "PUBLISHED": return "success";
    case "PENDING_APPROVAL":
    case "REJECTED": return "warning";
    default: return "neutral";
  }
}

export default async function AdminEventsPage() {
  await requireAdmin();
  const rows = await listAllEvents();
  return (
    <>
      <AdminSubnav active="/admin/events" />
      <Section>
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="heading-1">Events</h1>
              <p className="text-sm text-ink-muted">Manage church events.</p>
            </div>
            <Link href="/admin/events/new">
              <Button>New event</Button>
            </Link>
          </div>
          {rows.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Click 'New event' to create your first one."
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                        {r.registration_required ? <Badge tone="accent">Registration</Badge> : null}
                      </div>
                      <Link
                        href={`/admin/events/${r.id}`}
                        className="mt-1 block text-base font-medium text-ink hover:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {new Date(r.starts_at).toLocaleString()}
                        {r.location ? ` · ${r.location}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/admin/events/${r.id}`}
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
