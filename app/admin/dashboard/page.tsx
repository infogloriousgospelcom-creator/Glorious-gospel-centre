import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { requireAdmin } from "@/services/auth";
import { getDashboardCounts, getRecentActivity, type DashboardActivity } from "@/services/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Administrator dashboard.",
  robots: { index: false, follow: false },
};

const KIND_TONE: Record<DashboardActivity["kind"], "brand" | "accent" | "info" | "success" | "warning"> = {
  event: "brand",
  sermon: "accent",
  prayer: "info",
  message: "success",
  announcement: "warning",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await requireAdmin();
  const [counts, activity] = await Promise.all([getDashboardCounts(), getRecentActivity(8)]);

  const tiles: Array<{ label: string; value: number; href: string; description: string }> = [
    {
      label: "Upcoming events",
      value: counts.upcomingEvents,
      href: "/admin/events",
      description: "Published events scheduled in the future.",
    },
    {
      label: "Published sermons",
      value: counts.publishedSermons,
      href: "/admin/sermons",
      description: "Live in the sermon library.",
    },
    {
      label: "New prayer requests",
      value: counts.newPrayerRequests,
      href: "/admin/prayer-requests",
      description: "Untriaged submissions waiting for the prayer team.",
    },
    {
      label: "Gallery albums",
      value: counts.galleryAlbums,
      href: "/admin/gallery",
      description: "Albums visible to the public.",
    },
    {
      label: "Unread messages",
      value: counts.unreadMessages,
      href: "/admin/messages",
      description: "Contact form submissions not yet read.",
    },
    {
      label: "Awaiting approval",
      value: counts.pendingContent,
      href: "/admin/approvals",
      description: "Items in PENDING_APPROVAL across content types.",
    },
  ];

  const quickActions: Array<{ label: string; href: string; description: string }> = [
    { label: "New event", href: "/admin/events/new", description: "Create a church event." },
    { label: "New sermon", href: "/admin/sermons/new", description: "Publish a new sermon." },
    { label: "New announcement", href: "/admin/announcements/new", description: "Post to the homepage." },
    { label: "Edit services", href: "/admin/services", description: "Update weekly schedule." },
    { label: "Site settings", href: "/admin/settings", description: "Phone, email, M-Pesa, socials." },
  ];

  return (
    <Section>
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionEyebrow>Dashboard</SectionEyebrow>
            <SectionTitle>Welcome, {session.fullName ?? session.email}</SectionTitle>
            <SectionLead>
              You are signed in as <Badge tone="brand">{session.roleKeys[0] ?? "USER"}</Badge>.
            </SectionLead>
          </div>
        </div>

        {searchParams.error === "forbidden" ? (
          <div className="mb-6">
            <Alert tone="danger" title="Insufficient permissions">
              You do not have permission to view that page.
            </Alert>
          </div>
        ) : null}

        {counts.pendingContent > 0 ? (
          <div className="mb-6">
            <Alert tone="warning" title={`${counts.pendingContent} item(s) awaiting approval`}>
              Visit the approval queue to review and publish pending content.
            </Alert>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Link key={t.label} href={t.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-elevated">
                <CardHeader>
                  <CardDescription>{t.label}</CardDescription>
                  <CardTitle className="text-3xl">{t.value}</CardTitle>
                </CardHeader>
                <CardBody>
                  <p className="text-xs text-ink-muted">{t.description}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="divide-y divide-brand-100">
                {quickActions.map((a) => (
                  <li key={a.label}>
                    <Link
                      href={a.href}
                      className="flex items-center justify-between py-3 text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      <span>{a.label}</span>
                      <span className="text-xs text-ink-muted">{a.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-muted">
                Some quick actions land on pages that are placeholders today —
                they will be wired to the admin CMS in Phase 16.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest changes across the platform.</CardDescription>
            </CardHeader>
            <CardBody>
              {activity.length === 0 ? (
                <p className="text-sm text-ink-muted">No recent activity.</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((it) => (
                    <li key={it.id} className="flex items-start gap-3">
                      <Badge tone={KIND_TONE[it.kind]}>{it.kind}</Badge>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          <Link href={it.href} className="hover:underline">
                            {it.title}
                          </Link>
                        </p>
                        <p className="truncate text-xs text-ink-muted">{it.subtitle}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
