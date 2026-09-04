import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { getSiteSettings } from "@/services/content";
import { SettingsForm } from "./_components/SettingsForm";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Site settings · Admin", robots: { index: false, follow: false } };
export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();
  return (
    <>
      <AdminSubnav active="/admin/settings" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="mb-4">
              <h1 className="heading-1">Site settings</h1>
              <p className="text-sm text-ink-muted">Contact details, giving instructions, SEO defaults.</p>
            </div>
            <Alert tone="info" title="M-Pesa credentials">
              Live M-Pesa Daraja credentials (Consumer Key, Consumer Secret,
              Shortcode, Passkey) are configured via environment variables,
              not in the admin. See <code>FIRST_ADMIN.md</code> and <code>.env.example</code>.
            </Alert>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Single source of truth for public-facing details.</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <SettingsForm initial={settings} />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
