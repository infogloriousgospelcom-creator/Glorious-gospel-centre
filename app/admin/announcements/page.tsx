import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SectionEyebrow, SectionTitle, EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllAnnouncements } from "@/services/admin/announcements.read";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Announcements · Admin",
  robots: { index: false, follow: false },
};

function statusTone(s: string): "neutral" | "brand" | "accent" | "success" | "warning" {
  switch (s) {
    case "PUBLISHED": return "success";
    case "PENDING_APPROVAL": return "warning";
    case "DRAFT": return "neutral";
    case "ARCHIVED": return "neutral";
    case "REJECTED": return "warning";
    default: return "brand";
  }
}

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const rows = await listAllAnnouncements();
  return (
    <>
      <AdminSubnav active="/admin/announcements" />
      <Section>
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionEyebrow>Content</SectionEyebrow>
              <SectionTitle>Announcements</SectionTitle>
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
              <ul className="divide-y divide-brand-100">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {r.is_pinned ? <Badge tone="accent">Pinned</Badge> : null}
                        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                      </div>
                      <Link
                        href={`/admin/announcements/${r.id}`}
                        className="mt-1 block text-base font-medium text-ink hover:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="truncate text-xs text-ink-muted">{r.body}</p>
                    </div>
                    <Link
                      href={`/admin/announcements/${r.id}`}
                      className="text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      Edit →
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {rows.length > 0 ? (
            <div className="mt-4">
              <Alert tone="info">
                {rows.length} announcement{rows.length === 1 ? "" : "s"} total.
              </Alert>
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
