import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { requireAdmin } from "@/services/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Administrator dashboard.",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const tiles = [
    { label: "Upcoming events", value: "—" },
    { label: "Published sermons", value: "—" },
    { label: "Prayer requests", value: "—" },
    { label: "Gallery items", value: "—" },
    { label: "Messages", value: "—" },
    { label: "Awaiting approval", value: "—" },
  ];

  return (
    <Section>
      <Container>
        <div className="mb-8">
          <SectionEyebrow>Dashboard</SectionEyebrow>
          <SectionTitle>Welcome, {session.fullName ?? session.email}</SectionTitle>
          <SectionLead>
            You are signed in as <Badge tone="brand">{session.roleKeys[0] ?? "USER"}</Badge>.
            Real metrics will appear here once admin modules (events, sermons, prayer,
            gallery, etc.) are built in Phase 16.
          </SectionLead>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Card key={t.label}>
              <CardHeader>
                <CardDescription>{t.label}</CardDescription>
                <CardTitle className="text-3xl">{t.value}</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-xs text-ink-muted">Coming in Phase 16</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
