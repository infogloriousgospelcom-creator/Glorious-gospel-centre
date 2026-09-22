import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { getPublicConnectGroupBySlug } from "@/services/connect-groups";
import { getOwnMembershipForGroup } from "@/services/connect-group-membership";
import { getCurrentUser } from "@/services/auth";
import {
  buildPageMetadata,
  buildBreadcrumbSchema,
  plainText,
  siteUrl,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { connectGroupAvailabilityLabel } from "@/lib/connect-groups";
import { dayName } from "@/types/content";
import { ConnectGroupMembershipPanel } from "./_components/ConnectGroupMembershipPanel";

export const dynamic = "force-dynamic";

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time.slice(0, 5);
  const period = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const group = await getPublicConnectGroupBySlug(params.slug);
  if (!group) {
    return buildPageMetadata({
      title: "Connect Group",
      description: "Connect Group",
      path: `/connect/${params.slug}`,
      noindex: true,
    });
  }
  return buildPageMetadata({
    title: group.name,
    description: group.short_description
      ? plainText(group.short_description, 160)
      : `Learn about the ${group.name} Connect Group at Glorious Gospel Centre Church.`,
    path: `/connect/${group.slug}`,
    keywords: ["connect group", group.name, "GGCC", "fellowship"],
  });
}

export default async function ConnectGroupDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const group = await getPublicConnectGroupBySlug(params.slug);
  if (!group) notFound();

  const user = await getCurrentUser();
  const membership = user ? await getOwnMembershipForGroup(group.id) : null;

  const tone =
    group.status === "OPEN" ? "success" : group.status === "FULL" ? "warning" : "neutral";

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: siteUrl("/") },
    { name: "Connect Groups", url: siteUrl("/connect") },
    { name: group.name, url: siteUrl(`/connect/${group.slug}`) },
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-white to-brand-50/60">
          <Container width="prose">
            <Link
              href="/connect"
              className="mb-6 inline-block text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
            >
              ← All Connect Groups
            </Link>
            <SectionEyebrow>Connect Group</SectionEyebrow>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-balance font-display text-3xl font-semibold text-brand-900 sm:text-4xl">
                {group.name}
              </h1>
              <Badge tone={tone}>{connectGroupAvailabilityLabel(group.status)}</Badge>
            </div>
            {group.short_description ? (
              <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
                {group.short_description}
              </p>
            ) : null}
          </Container>
        </Section>

        <Section>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div>
                <h2 className="heading-2 mb-4">About this group</h2>
                {group.description ? (
                  <div className="space-y-4 text-base leading-relaxed text-ink">
                    {group.description.split(/\n{2,}/).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">
                    More details about this group will be shared by the church as they are
                    available.
                  </p>
                )}
              </div>

              <aside className="space-y-6">
                <div className="border-t border-border pt-5">
                  <p className="eyebrow">Meeting</p>
                  <ul className="mt-3 space-y-2 text-sm text-ink">
                    {group.meeting_day !== null && group.meeting_day !== undefined ? (
                      <li>
                        <span className="text-ink-muted">Day: </span>
                        {dayName(group.meeting_day)}
                      </li>
                    ) : null}
                    {group.meeting_time ? (
                      <li>
                        <span className="text-ink-muted">Time: </span>
                        {formatTime(group.meeting_time)}
                      </li>
                    ) : null}
                    {group.meeting_frequency ? (
                      <li>
                        <span className="text-ink-muted">Frequency: </span>
                        {group.meeting_frequency}
                      </li>
                    ) : null}
                    {group.location_note ? (
                      <li>
                        <span className="text-ink-muted">Location: </span>
                        {group.location_note}
                      </li>
                    ) : null}
                    {!group.meeting_day &&
                    !group.meeting_time &&
                    !group.meeting_frequency &&
                    !group.location_note ? (
                      <li className="text-ink-muted">Meeting details coming soon.</li>
                    ) : null}
                  </ul>
                </div>

                {group.leader_display_name ? (
                  <div className="border-t border-border pt-5">
                    <p className="eyebrow">Leadership</p>
                    <p className="mt-2 text-sm text-ink">{group.leader_display_name}</p>
                  </div>
                ) : null}

                <div className="border-t border-border pt-5">
                  <p className="eyebrow">Membership</p>
                  <div className="mt-3">
                    <ConnectGroupMembershipPanel
                      groupId={group.id}
                      groupSlug={group.slug}
                      groupStatus={group.status}
                      isAuthenticated={Boolean(user)}
                      emailConfirmed={Boolean(user?.emailConfirmed)}
                      membership={membership}
                    />
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                    We do not publish member lists or private contact details on this page.
                  </p>
                </div>
              </aside>
            </div>
          </Container>
        </Section>

        <ContextualNextSteps
          title="Continue exploring"
          description="Find another group, a ministry, or gather with us on Sunday."
          actions={[
            { href: "/connect", label: "All Connect Groups" },
            { href: "/ministries", label: "Explore Ministries", variant: "secondary" },
            { href: "/services", label: "Service Times", variant: "ghost" },
          ]}
          surface="muted"
        />

        <JsonLd data={breadcrumb} />
      </main>
      <Footer />
    </>
  );
}
