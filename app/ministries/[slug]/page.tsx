import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { getMinistryBySlug, getMinistryLeaders } from "@/services/content";
import {
  buildPageMetadata,
  buildBreadcrumbSchema,
  plainText,
  siteUrl,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMinistryImages } from "@/lib/ministry-images";
import { MinistryHeroSlideshow } from "@/components/ministries/MinistryHeroSlideshow";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) {
    return buildPageMetadata({
      title: "Ministry",
      description: "Ministry",
      path: `/ministries/${params.slug}`,
      noindex: true,
    });
  }
  return buildPageMetadata({
    title: ministry.name,
    description: ministry.short_description
      ? plainText(ministry.short_description, 200)
      : `Learn about the ${ministry.name} ministry at Glorious Gospel Centre Church.`,
    path: `/ministries/${ministry.slug}`,
    image: ministry.hero_image,
    imageAlt: `${ministry.name} ministry`,
    keywords: ["ministry", ministry.name],
  });
}

export default async function MinistryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) return null;
  const leaders = await getMinistryLeaders(ministry.id);
  const images = getMinistryImages(ministry.slug);
  const hasImages = images.length > 0;

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: siteUrl("/") },
    { name: "Ministries", url: siteUrl("/ministries") },
    { name: ministry.name, url: siteUrl(`/ministries/${ministry.slug}`) },
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* Immersive hero with animated background images */}
        <section className="relative flex min-h-[50vh] items-end overflow-hidden md:min-h-[60vh]">
          {/* Background image slideshow or gradient fallback */}
          {hasImages ? (
            <MinistryHeroSlideshow images={images} />
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900" />
          )}

          {/* Dark gradient overlay for text contrast */}
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,15,40,0.25) 0%, rgba(6,15,40,0.45) 50%, rgba(6,15,40,0.80) 100%)",
            }}
            aria-hidden="true"
          />

          {/* Hero content */}
          <div className="relative z-10 w-full py-16 md:py-24">
            <Container>
              <div className="mx-auto max-w-3xl">
                <Link
                  href="/ministries"
                  className="mb-6 inline-block text-sm font-semibold text-white/80 transition-colors hover:text-white"
                >
                  ← All ministries
                </Link>
                <SectionEyebrow className="text-accent-400">
                  Ministry
                </SectionEyebrow>
                <h1 className="mt-3 mb-4 text-balance font-display text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
                  {ministry.name}
                </h1>
                {ministry.short_description ? (
                  <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                    {ministry.short_description}
                  </p>
                ) : null}
              </div>
            </Container>
          </div>
        </section>

        <Section>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
              <div>
                <h2 className="heading-2 mb-4">About this ministry</h2>
                {ministry.description ? (
                  <div className="space-y-4 text-base leading-relaxed text-ink">
                    {ministry.description.split(/\n{2,}/).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">
                    Description coming soon. Ministry leaders can publish a
                    description through the admin.
                  </p>
                )}
              </div>
              <aside className="space-y-6">
                {ministry.meeting_info ? (
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                    <p className="eyebrow">Meetings</p>
                    <p className="mt-2 text-sm text-ink">{ministry.meeting_info}</p>
                  </div>
                ) : null}
                {(ministry.contact_email || ministry.contact_phone) ? (
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                    <p className="eyebrow">Contact</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {ministry.contact_email ? (
                        <p>
                          <span className="text-ink-muted">Email: </span>
                          <a className="text-brand-700 transition-colors hover:text-brand-800" href={`mailto:${ministry.contact_email}`}>
                            {ministry.contact_email}
                          </a>
                        </p>
                      ) : null}
                      {ministry.contact_phone ? (
                        <p>
                          <span className="text-ink-muted">Phone: </span>
                          <a className="text-brand-700 transition-colors hover:text-brand-800" href={`tel:${ministry.contact_phone}`}>
                            {ministry.contact_phone}
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>
          </Container>
        </Section>

        {leaders.length > 0 ? (
          <Section className="bg-surface-muted">
            <Container>
              <div className="mb-8 text-center">
                <SectionEyebrow>Team</SectionEyebrow>
                <h2 className="heading-2">Ministry leaders</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {leaders.map(({ leader, role }) => (
                  <div
                    key={leader.id}
                    className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-100 to-brand-50" aria-hidden="true">
                      {leader.image_url ? (
                        <Image
                          src={leader.image_url}
                          alt={leader.full_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : null}
                    </div>
                    <div className="p-6 pb-3">
                      <h3 className="font-display text-base font-semibold text-brand-900">
                        {leader.full_name}
                      </h3>
                      <p className="text-sm text-ink-muted">
                        {role ?? leader.title ?? "Leader"}
                      </p>
                    </div>
                    {leader.bio ? (
                      <div className="px-6 pb-6">
                        <p className="text-sm text-ink-muted line-clamp-3">{leader.bio}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Container>
          </Section>
        ) : null}

        <Section>
          <Container width="prose" className="text-center">
            <SectionEyebrow>Next step</SectionEyebrow>
            <h2 className="heading-2 mb-4">Want to get involved?</h2>
            <p className="lead mb-8">
              Explore more ministries, plan a visit, or reach out — we would love to walk with you.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/ministries">Explore Ministries</LinkButton>
              <LinkButton href="/visit" variant="secondary">
                Plan Your Visit
              </LinkButton>
              <LinkButton href="/contact" variant="ghost">
                Contact Us
              </LinkButton>
            </div>
          </Container>
        </Section>

        <JsonLd data={breadcrumb} />
      </main>
      <Footer />
    </>
  );
}
