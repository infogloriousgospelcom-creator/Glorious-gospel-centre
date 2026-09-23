import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  getAllPublishedMinistries,
  getMinistryBySlug,
  getMinistryLeaders,
} from "@/services/content";
import {
  buildPageMetadata,
  buildBreadcrumbSchema,
  plainText,
  siteUrl,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMinistryImages } from "@/lib/ministry-images";
import { MinistryHeroSlideshow } from "@/components/ministries/MinistryHeroSlideshow";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { ServeInterestPanel } from "@/app/serve/_components/ServeInterestPanel";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  HOSPITALITY_PUBLIC_PATHS,
  isPublicFacingText,
  publicMinistryHref,
  relatedMinistries,
} from "@/lib/ministries";

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
    path: publicMinistryHref(ministry.slug),
    image: ministry.hero_image,
    imageAlt: `${ministry.name} ministry`,
    keywords: ["ministry", ministry.name, "GGCC"],
  });
}

export default async function MinistryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const dedicated = HOSPITALITY_PUBLIC_PATHS[params.slug];
  if (dedicated && params.slug !== "hospitality") {
    redirect(dedicated);
  }

  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) return null;

  if (ministry.slug === "hospitality") {
    redirect("/ministries/hospitality");
  }

  const [leaders, allMinistries] = await Promise.all([
    getMinistryLeaders(ministry.id),
    getAllPublishedMinistries(),
  ]);
  const images = getMinistryImages(ministry.slug);
  const hasImages = images.length > 0;
  const description = isPublicFacingText(ministry.description)
    ? ministry.description
    : null;
  const meeting = isPublicFacingText(ministry.meeting_info)
    ? ministry.meeting_info
    : null;
  const related = relatedMinistries(ministry, allMinistries, 3);
  const isChildren = ministry.slug === "children";
  const isMission =
    ministry.slug === "missions" || ministry.slug === "evangelism-outreach";

  const breadcrumb = buildBreadcrumbSchema([
    { name: "Home", url: siteUrl("/") },
    { name: "Ministries", url: siteUrl("/ministries") },
    { name: ministry.name, url: siteUrl(publicMinistryHref(ministry.slug)) },
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="relative flex min-h-[50vh] items-end overflow-hidden md:min-h-[60vh]">
          {hasImages ? (
            <MinistryHeroSlideshow images={images} />
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900" />
          )}

          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,15,40,0.25) 0%, rgba(6,15,40,0.45) 50%, rgba(6,15,40,0.80) 100%)",
            }}
            aria-hidden="true"
          />

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
                {isPublicFacingText(ministry.short_description) ? (
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
              <div className="space-y-10">
                <div>
                  <h2 className="heading-2 mb-4">About this ministry</h2>
                  {description ? (
                    <div className="space-y-4 text-base leading-relaxed text-ink">
                      {description.split(/\n{2,}/).map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-muted">
                      A fuller description is being prepared. In the meantime, explore
                      how to get involved or contact GGCC with questions.
                    </p>
                  )}
                </div>

                {isChildren ? (
                  <div className="border-t border-border pt-8">
                    <SectionEyebrow>Families</SectionEyebrow>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-brand-900">
                      Sunday School
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink">
                      Children&apos;s Ministry includes Sunday School, with Adult Sunday
                      School and Children&apos;s Sunday School. Families are welcome to
                      learn more when they visit.
                    </p>
                    {meeting ? (
                      <p className="mt-4 text-sm text-ink-muted">
                        <span className="font-semibold text-brand-900">Meeting: </span>
                        {meeting}
                      </p>
                    ) : null}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <LinkButton href="/visit">Plan Your Visit</LinkButton>
                      <LinkButton href="/contact" variant="secondary">
                        Ask about children&apos;s ministry
                      </LinkButton>
                    </div>
                  </div>
                ) : null}

                {isMission ? (
                  <div className="border-t border-border pt-8">
                    <SectionEyebrow>Go</SectionEyebrow>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-brand-900">
                      An outward-facing church
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink">
                      {ministry.slug === "missions"
                        ? "Missions at GGCC supports gospel work beyond our local community — partnering in prayer and practical care as God leads."
                        : "Evangelism & Outreach shares the Gospel in word and deed throughout our community — inviting people to know Jesus and find a home in the church."}
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <LinkButton href="/serve">Serve at GGCC</LinkButton>
                      <LinkButton href="/prayer" variant="secondary">
                        Request Prayer
                      </LinkButton>
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="space-y-8">
                {meeting && !isChildren ? (
                  <div className="border-t border-border pt-5">
                    <p className="eyebrow">Meetings</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink">{meeting}</p>
                  </div>
                ) : null}
                {ministry.contact_email || ministry.contact_phone ? (
                  <div className="border-t border-border pt-5">
                    <p className="eyebrow">Contact</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {ministry.contact_email ? (
                        <p>
                          <span className="text-ink-muted">Email: </span>
                          <a
                            className="text-brand-700 transition-colors hover:text-brand-800"
                            href={`mailto:${ministry.contact_email}`}
                          >
                            {ministry.contact_email}
                          </a>
                        </p>
                      ) : null}
                      {ministry.contact_phone ? (
                        <p>
                          <span className="text-ink-muted">Phone: </span>
                          <a
                            className="text-brand-700 transition-colors hover:text-brand-800"
                            href={`tel:${ministry.contact_phone}`}
                          >
                            {ministry.contact_phone}
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className="border-t border-border pt-5">
                  <p className="eyebrow">Participate</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    Interested in this ministry? Explore Serve at GGCC or contact the
                    church to start a conversation.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <LinkButton href="/serve" variant="secondary">
                      Serve at GGCC
                    </LinkButton>
                    <LinkButton href="/contact" variant="ghost">
                      Contact Us
                    </LinkButton>
                  </div>
                </div>
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
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {leaders.map(({ leader, role }) => (
                  <div key={leader.id} className="overflow-hidden">
                    <div
                      className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50"
                      aria-hidden={!leader.image_url}
                    >
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
                    <div className="border-t border-border pt-4">
                      <h3 className="font-display text-base font-semibold text-brand-900">
                        {leader.full_name}
                      </h3>
                      <p className="text-sm text-ink-muted">
                        {role ?? leader.title ?? "Leader"}
                      </p>
                      {isPublicFacingText(leader.bio) ? (
                        <p className="mt-2 line-clamp-3 text-sm text-ink-muted">
                          {leader.bio}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </Section>
        ) : null}

        {related.length > 0 ? (
          <Section>
            <Container>
              <div className="mb-8 max-w-2xl">
                <SectionEyebrow>Related</SectionEyebrow>
                <h2 className="heading-2">Explore another ministry</h2>
              </div>
              <ul className="grid gap-6 sm:grid-cols-3">
                {related.map((m) => (
                  <li key={m.id} className="border-t border-border pt-4">
                    <Link
                      href={publicMinistryHref(m.slug)}
                      className="group block min-h-touch"
                    >
                      <h3 className="font-display text-lg font-semibold text-brand-900 transition-colors group-hover:text-brand-700">
                        {m.name}
                      </h3>
                      {isPublicFacingText(m.short_description) ? (
                        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                          {m.short_description}
                        </p>
                      ) : null}
                      <span className="mt-3 inline-block text-sm font-semibold text-brand-700">
                        Explore
                        <span aria-hidden="true"> →</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        ) : null}

        <Section>
          <Container>
            <div className="mx-auto max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Express interest</CardTitle>
                  <CardDescription>
                    Tell the church you would like to serve in this ministry. Staff will review
                    your interest — this is not an automatic placement.
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <ServeInterestPanel ministrySlug={ministry.slug} />
                </CardBody>
              </Card>
            </div>
          </Container>
        </Section>

        <ContextualNextSteps
          title="Want to get involved?"
          description="Explore more ministries, plan a visit, or send a general question."
          actions={[
            { href: "/serve", label: "Serve at GGCC" },
            { href: "/visit", label: "Plan Your Visit", variant: "secondary" },
            { href: "/contact", label: "Contact Us", variant: "ghost" },
          ]}
          surface="muted"
        />

        <JsonLd data={breadcrumb} />
      </main>
      <Footer />
    </>
  );
}
