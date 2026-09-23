import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { ServeAtGgcc } from "@/components/ministries/ServeAtGgcc";
import { ConnectAtGgcc } from "@/components/ministries/ConnectAtGgcc";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { buildPageMetadata } from "@/lib/seo";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { SectionReveal } from "@/components/motion/SectionReveal";
import Link from "next/link";
import { getAllPublishedMinistries } from "@/services/content";
import { publicMinistryHref, topLevelMinistries, isPublicFacingText } from "@/lib/ministries";
import { ServeInterestPanel } from "./_components/ServeInterestPanel";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Serve at GGCC",
    description:
      "Discover how to participate in the life and work of Glorious Gospel Centre Church through its ministries.",
    path: "/serve",
    keywords: ["serve", "volunteer", "ministries", "GGCC", "get involved"],
  });
}

export const dynamic = "force-dynamic";

export default async function ServePage({
  searchParams,
}: {
  searchParams: { ministry?: string };
}) {
  const ministries = topLevelMinistries(await getAllPublishedMinistries()).slice(0, 8);
  const preselectSlug = searchParams.ministry?.trim() || undefined;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Get involved"
          title="Serve at GGCC"
          description="Participate in the life of the church — explore ministries, discover where you can contribute, and start a conversation with us."
        >
          <LinkButton href="#express-interest">Express Interest</LinkButton>
          <LinkButton href="/ministries" variant="secondary">
            Explore Ministries
          </LinkButton>
          <LinkButton href="/contact" variant="ghost">
            Contact GGCC
          </LinkButton>
        </PageHeader>

        <ServeAtGgcc variant="page" />

        <Section className="bg-surface-muted">
          <Container>
            <SectionReveal>
              <div className="mx-auto mb-10 max-w-2xl text-center">
                <SectionEyebrow>Areas of ministry</SectionEyebrow>
                <SectionTitle>Start with a ministry</SectionTitle>
                <SectionLead>
                  Browse the ministries below, then express interest when you are ready.
                </SectionLead>
              </div>
            </SectionReveal>

            {ministries.length > 0 ? (
              <SectionReveal delay={0.08}>
                <ul className="mx-auto grid max-w-4xl gap-0 sm:grid-cols-2">
                  {ministries.map((m) => (
                    <li key={m.id} className="border-t border-border">
                      <Link
                        href={publicMinistryHref(m.slug)}
                        className="group flex min-h-touch flex-col justify-center py-5 transition-colors duration-ui ease-smooth sm:px-4"
                      >
                        <span className="font-display text-lg font-semibold text-brand-900 group-hover:text-brand-700">
                          {m.name}
                        </span>
                        {isPublicFacingText(m.short_description) ? (
                          <span className="mt-1 line-clamp-2 text-sm text-ink-muted">
                            {m.short_description}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 text-center">
                  <LinkButton href="/ministries" variant="secondary">
                    View all ministries
                  </LinkButton>
                </div>
              </SectionReveal>
            ) : null}
          </Container>
        </Section>

        <Section id="express-interest">
          <Container>
            <div className="mx-auto max-w-2xl">
              <SectionEyebrow>Next step</SectionEyebrow>
              <SectionTitle>Express your interest</SectionTitle>
              <SectionLead className="mx-0">
                Tell the church where you would like to serve. A leader will review your
                interest and follow up. This is not an automatic placement.
              </SectionLead>
              <div className="mt-6">
                <ServeInterestPanel ministrySlug={preselectSlug} />
              </div>
            </div>
          </Container>
        </Section>

        <ConnectAtGgcc />

        <ContextualNextSteps
          title="Not sure where to begin?"
          description="Plan a visit, explore ministries, or send a general message — serving interest is a separate, structured request."
          actions={[
            { href: "/visit", label: "Plan Your Visit" },
            { href: "/ministries", label: "Explore Ministries", variant: "secondary" },
            { href: "/contact", label: "Contact GGCC", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}
