import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Container, Section } from "@/components/ui/Container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Plan Your Visit",
  description:
    "Plan your visit to Glorious Gospel Centre Church in Sizers-Kitengela — service times, location, and what to expect.",
  path: "/visit",
  keywords: ["plan your visit", "church visit", "kitengela church", "sunday service"],
});

/**
 * Minimal route placeholder for Phase B navigation CTAs.
 * Full Plan Your Visit experience lands in Phase C.
 */
export default function VisitPlaceholderPage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <PageHeader
          eyebrow="Welcome"
          title="Plan Your Visit"
          description="A fuller visit guide is coming soon. In the meantime, explore our service times or reach out — we would love to welcome you."
        >
          <LinkButton href="/services">Service times</LinkButton>
          <LinkButton href="/contact" variant="secondary">
            Contact us
          </LinkButton>
        </PageHeader>
        <Section spacing="compact">
          <Container width="prose" className="text-center">
            <p className="text-sm text-ink-muted">
              You can also{" "}
              <Link href="/livestream" className="brand-link">
                watch online
              </Link>{" "}
              if you are joining from afar.
            </p>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
