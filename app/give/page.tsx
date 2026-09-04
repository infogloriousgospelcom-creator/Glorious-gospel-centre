import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { GivingForm } from "./_components/GivingForm";
import { listActiveGivingCategories } from "@/services/giving";
import { getSiteSettings } from "@/services/content";
import { getPaymentProvider } from "@/services/payment";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Give",
  description:
    "Support the mission and ministry of Glorious Gospel Centre — tithe, offering, missions, and outreach via M-Pesa.",
  path: "/give",
  keywords: ["give", "tithe", "offering", "M-Pesa", "donate", "stewardship"],
});

export default async function GivePage() {
  const [categories, settings, provider] = await Promise.all([
    listActiveGivingCategories(),
    getSiteSettings(),
    Promise.resolve(getPaymentProvider()),
  ]);

  const isMock = provider.mode === "mock";

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Generosity</SectionEyebrow>
              <SectionTitle>Partner with our ministry</SectionTitle>
              <SectionLead>
                Your tithes, offerings, and designated gifts enable the work
                of the Gospel in our church and beyond.
              </SectionLead>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            {isMock ? (
              <div className="mb-8">
                <Alert tone="warning" title="Mock payment mode">
                  M-Pesa Daraja credentials are not configured, so this page runs in
                  mock mode. Submissions are recorded but no real money is requested.
                  Configure <code>M_PESA_*</code> env vars to enable live payments.
                </Alert>
              </div>
            ) : null}

            <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Give now</CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  {categories.length === 0 ? (
                    <EmptyState
                      title="Giving categories coming soon"
                      description="Categories will appear here once configured through the admin."
                    />
                  ) : (
                    <GivingForm categories={categories} />
                  )}
                </div>
              </Card>

              <aside className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Other ways to give</CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6 text-sm text-ink-muted">
                    <ul className="space-y-3">
                      <li>
                        <p className="font-medium text-ink">M-Pesa</p>
                        {settings.mpesa_paybill ? (
                          <p>Paybill: {settings.mpesa_paybill}</p>
                        ) : (
                          <p className="text-ink-subtle">[Paybill TBD — admin settings]</p>
                        )}
                        {settings.mpesa_till ? <p>Till: {settings.mpesa_till}</p> : null}
                      </li>
                      <li>
                        <p className="font-medium text-ink">Bank</p>
                        {settings.bank_instructions ? (
                          <p className="whitespace-pre-line">{settings.bank_instructions}</p>
                        ) : (
                          <p className="text-ink-subtle">[Bank details TBD — admin settings]</p>
                        )}
                      </li>
                      <li>
                        <p className="font-medium text-ink">In person</p>
                        <p>Drop your offering in the bag during any service.</p>
                      </li>
                    </ul>
                  </div>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tax & receipts</CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6 text-sm text-ink-muted">
                    <p>
                      Each gift is recorded in our giving system. For annual
                      statements, contact the church office.
                    </p>
                    <Badge tone="brand" className="mt-3">Receipt on request</Badge>
                  </div>
                </Card>
              </aside>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
