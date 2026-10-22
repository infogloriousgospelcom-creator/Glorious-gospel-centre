import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { ConnectGroupCard } from "@/components/connect/ConnectGroupCard";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { getPublicConnectGroups } from "@/services/connect-groups";
import { buildPageMetadata } from "@/lib/seo";
import { dayName } from "@/types/content";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Connect Groups",
  description:
    "Discover Connect Groups at Glorious Gospel Centre Church — find fellowship, grow in faith, and belong.",
  path: "/connect",
  keywords: ["connect groups", "fellowship", "small groups", "GGCC", "community"],
});

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: { day?: string };
}) {
  const dayFilter =
    searchParams.day !== undefined && searchParams.day !== ""
      ? Number(searchParams.day)
      : undefined;
  const meetingDay =
    typeof dayFilter === "number" && dayFilter >= 0 && dayFilter <= 6
      ? dayFilter
      : undefined;

  const groups = await getPublicConnectGroups(
    meetingDay !== undefined ? { meeting_day: meetingDay } : undefined,
  );

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Discover · Connect · Belong"
          title="Connect Groups"
          description="Faith grows in relationship. Connect Groups are places to know others, pray together, and walk with Jesus in everyday life."
        >
          <LinkButton href="/contact">Ask about joining</LinkButton>
          <LinkButton href="/ministries" variant="secondary">
            Explore Ministries
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <SectionReveal>
              <div className="mx-auto mb-10 max-w-2xl text-center">
                <SectionEyebrow>Why connect?</SectionEyebrow>
                <SectionTitle>Belong in the church family</SectionTitle>
                <SectionLead>
                  A Connect Group is a smaller circle within GGCC — a place to share life,
                  encouragement, and prayer. Groups are listed only when the church has
                  published them.
                </SectionLead>
              </div>
            </SectionReveal>

            <SectionReveal delay={0.06}>
              <div
                className="mb-8 flex flex-wrap justify-center gap-2"
                role="group"
                aria-label="Filter by meeting day"
              >
                <DayFilterLink href="/connect" active={meetingDay === undefined}>
                  All days
                </DayFilterLink>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <DayFilterLink
                    key={d}
                    href={`/connect?day=${d}`}
                    active={meetingDay === d}
                  >
                    {dayName(d)}
                  </DayFilterLink>
                ))}
              </div>
            </SectionReveal>

            {groups.length === 0 ? (
              <EmptyState
                title="Groups will appear here"
                description="When Connect Groups are published by the church, you will find them here. In the meantime, explore ministries or contact us to learn how to connect."
              >
                <LinkButton href="/contact">Contact GGCC</LinkButton>
                <LinkButton href="/ministries" variant="secondary">
                  Explore Ministries
                </LinkButton>
              </EmptyState>
            ) : (
              <SectionReveal delay={0.1}>
                <ul className="mx-auto grid max-w-3xl gap-8">
                  {groups.map((g) => (
                    <ConnectGroupCard key={g.id} group={g} />
                  ))}
                </ul>
              </SectionReveal>
            )}
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container width="prose" className="text-center">
            <SectionEyebrow>How to connect</SectionEyebrow>
            <SectionTitle>Ready to take a step?</SectionTitle>
            <SectionLead className="mx-auto">
              Online group membership is coming later. For now, reach out to the church and we
              will help you find a place to belong.
            </SectionLead>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/contact">Contact GGCC</LinkButton>
              <LinkButton href="/visit" variant="secondary">
                Plan Your Visit
              </LinkButton>
            </div>
          </Container>
        </Section>

        <ContextualNextSteps
          title="Keep growing with GGCC"
          description="Explore ministries, pray with us, or gather on Sunday."
          actions={[
            { href: "/ministries", label: "Explore Ministries" },
            { href: "/prayer", label: "Prayer Center", variant: "secondary" },
            { href: "/services", label: "Service Times", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}

function DayFilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors",
        active
          ? "border-brand-700 bg-brand-700 text-white"
          : "border-brand-200 bg-white text-ink-muted hover:bg-brand-50",
      )}
      aria-current={active ? "true" : undefined}
    >
      {children}
    </Link>
  );
}
