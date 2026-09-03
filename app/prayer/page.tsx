import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { PrayerRequestForm } from "./_components/PrayerRequestForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prayer Request",
  description: "Submit a confidential prayer request to our prayer team.",
  robots: { index: true, follow: true },
};

export default function PrayerPage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Prayer</SectionEyebrow>
              <SectionTitle>How can we pray with you?</SectionTitle>
              <SectionLead>
                We believe in the power of prayer. Share your request and our
                prayer team will lift it up. All submissions are kept
                confidential.
              </SectionLead>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Submit a prayer request</CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  <PrayerRequestForm />
                </div>
              </Card>

              <aside className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Confidentiality</CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6 text-sm text-ink-muted">
                    <p>
                      Your prayer request is reviewed only by authorized members
                      of our prayer team. We never share your personal details
                      publicly.
                    </p>
                  </div>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Need immediate help?</CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6 text-sm text-ink-muted">
                    <p>
                      If you are in crisis or require urgent pastoral care, please
                      contact our office directly during business hours. For
                      emergencies, dial your local emergency number.
                    </p>
                  </div>
                </Card>
                <blockquote className="rounded-2xl bg-brand-900 p-6 text-brand-50 shadow-soft">
                  <p className="font-serif text-lg font-semibold">
                    &ldquo;The prayer of a righteous person is powerful and effective.&rdquo;
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-wider text-brand-200">
                    James 5:16
                  </p>
                </blockquote>
              </aside>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
