import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { GivingForm } from "./_components/GivingForm";
import { listActiveGivingCategories } from "@/services/giving";
import { getSiteSettings } from "@/services/content";
import { getPaymentProvider } from "@/services/payment";
import { buildPageMetadata } from "@/lib/seo";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Give",
  description:
    "Support the mission and ministry of Glorious Gospel Centre Church — tithe, offering, missions, and outreach via M-Pesa.",
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
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Generosity"
          title="Partner with our ministry"
          description="Your tithes, offerings, and designated gifts enable the work of the Gospel in our church and beyond."
        />

        <Section>
          <Container>
            {isMock ? (
              <div className="mb-8">
                <Alert tone="warning" title="Mock payment mode">
                  M-Pesa Daraja credentials are not configured, so this page runs in mock mode.
                  Submissions are recorded but no real money is requested. Configure{" "}
                  <code>M_PESA_*</code> env vars to enable live payments.
                </Alert>
              </div>
            ) : null}

            <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
              <SectionReveal>
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
              </SectionReveal>

              <SectionReveal delay={0.12}>
                <aside className="space-y-8">
                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Other ways to give
                    </h2>
                    <ul className="mt-3 space-y-4 text-sm text-ink-muted">
                      <li>
                        <p className="font-medium text-brand-900">M-Pesa</p>
                        {settings.mpesa_paybill ? (
                          <p>Paybill: {settings.mpesa_paybill}</p>
                        ) : null}
                        {settings.mpesa_till ? <p>Till: {settings.mpesa_till}</p> : null}
                        {!settings.mpesa_paybill && !settings.mpesa_till ? (
                          <p>Use the online form for M-Pesa STK Push when available.</p>
                        ) : null}
                      </li>
                      {settings.bank_instructions ? (
                        <li>
                          <p className="font-medium text-brand-900">Bank</p>
                          <p className="whitespace-pre-line">{settings.bank_instructions}</p>
                        </li>
                      ) : null}
                      <li>
                        <p className="font-medium text-brand-900">In person</p>
                        <p>Drop your offering in the bag during any service.</p>
                      </li>
                    </ul>
                  </div>
                  <div className="border-t border-border pt-5">
                    <h2 className="font-display text-base font-semibold text-brand-900">
                      Tax &amp; receipts
                    </h2>
                    <p className="mt-2 text-sm text-ink-muted">
                      Each gift is recorded in our giving system. For annual statements, contact
                      the church office.
                    </p>
                    <Badge tone="brand" className="mt-3">
                      Receipt on request
                    </Badge>
                  </div>
                </aside>
              </SectionReveal>
            </div>
          </Container>
        </Section>

        <ContextualNextSteps
          title="Thank you for partnering with us"
          description="Continue exploring church life — or plan a visit if you are new."
          actions={[
            { href: "/", label: "Return to GGCC" },
            { href: "/ministries", label: "Explore Ministries", variant: "secondary" },
            { href: "/visit", label: "Plan Your Visit", variant: "ghost" },
          ]}
          surface="muted"
        />
      </main>
      <Footer />
    </>
  );
}
