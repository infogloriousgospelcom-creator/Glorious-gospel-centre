import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import { requireAdmin } from "@/services/auth";
import { listAllAnnouncements } from "@/services/admin/announcements.read";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Announcements · Admin",
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

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const rows = await listAllAnnouncements();
  return (
    <Section>
      <Container>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Content</p>
            <h1 className="heading-1">Announcements</h1>
          </div>
          <Link href="/admin/announcements/new">
            <Button>New announcement</Button>
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No announcements yet"
            description="Click 'New announcement' to create your first one."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {r.is_pinned ? <Badge tone="accent">Pinned</Badge> : null}
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </div>
                    <Link
                      href={`/admin/announcements/${r.id}`}
                      className="mt-1 block text-base font-medium text-brand-900 transition-colors hover:text-brand-700 hover:underline"
                    >
                      {r.title}
                    </Link>
                    <p className="truncate text-xs text-ink-muted">{r.body}</p>
                  </div>
                  <Link
                    href={`/admin/announcements/${r.id}`}
                    className="text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
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
  );
}