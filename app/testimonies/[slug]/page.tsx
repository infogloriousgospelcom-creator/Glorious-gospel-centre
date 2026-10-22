import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { ShareTestimony } from "@/components/testimonies/ShareTestimony";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { getApprovedTestimonyBySlug } from "@/services/testimonies";
import {
  buildPageMetadata,
  buildBreadcrumbSchema,
  plainText,
  siteUrl,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const testimony = await getApprovedTestimonyBySlug(params.slug);
  if (!testimony) {
    return buildPageMetadata({
      title: "Story",
      description: "Story of Grace",
      path: `/testimonies/${params.slug}`,
      noindex: true,
    });
  }
  return buildPageMetadata({
    title: testimony.title,
    description: plainText(testimony.story, 160),
    path: `/testimonies/${testimony.slug}`,
    keywords: ["stories of grace", "testimony", "GGCC"],
  });
}

export default async function TestimonyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const testimony = await getApprovedTestimonyBySlug(params.slug);
  if (!testimony) notFound();

  const byline = testimony.anonymous
    ? "A member of GGCC"
    : testimony.display_name || "A member of GGCC";

  const url = siteUrl(`/testimonies/${testimony.slug}`);
  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: siteUrl("/") },
    { name: "Stories of Grace", url: siteUrl("/testimonies") },
    { name: testimony.title, url },
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-white to-brand-50/60">
          <Container width="prose">
            <Link
              href="/testimonies"
              className="mb-6 inline-block text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
            >
              ← Stories of Grace
            </Link>
            <SectionEyebrow>Story of Grace</SectionEyebrow>
            <h1 className="mt-2 text-balance font-display text-3xl font-semibold text-brand-900 sm:text-4xl">
              {testimony.title}
            </h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">
              {byline}
            </p>
          </Container>
        </Section>

        <Section>
          <Container width="prose">
            <article className="space-y-5 text-base leading-relaxed text-ink">
              {testimony.story.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </article>

            <div className="mt-12 border-t border-border pt-8">
              <h2 className="font-display text-lg font-semibold text-brand-900">
                Share this story
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Share the public link only — private details are never included.
              </p>
              <div className="mt-4">
                <ShareTestimony url={url} title={testimony.title} />
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/testimonies/share">Share Your Story</LinkButton>
              <LinkButton href="/prayer" variant="secondary">
                Request Prayer
              </LinkButton>
            </div>
          </Container>
        </Section>

        <ContextualNextSteps
          title="Continue the journey"
          description="Let this story move you to pray, grow, and gather with GGCC."
          actions={[
            { href: "/sermons", label: "Explore Sermons" },
            { href: "/ministries", label: "Find a Ministry", variant: "secondary" },
            { href: "/visit", label: "Plan Your Visit", variant: "ghost" },
          ]}
          surface="muted"
        />

        <JsonLd data={breadcrumb} />
      </main>
      <Footer />
    </>
  );
}
