import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { getAllPublishedMinistries } from "@/services/content";
import { buildPageMetadata } from "@/lib/seo";
import { getMinistryImages } from "@/lib/ministry-images";
import { MinistryCardSlideshow } from "@/components/ministries/MinistryCardSlideshow";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Ministries",
    description:
      "Explore the ministries of Glorious Gospel Centre Church — find a place to belong, serve, and grow.",
    path: "/ministries",
    keywords: ["ministries", "church groups", "serve", "fellowship"],
  });
}

export const dynamic = "force-dynamic";

export default async function MinistriesPage() {
  const ministries = await getAllPublishedMinistries();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Get involved"
          title="Our ministries"
          description="Find a place to belong, serve, and grow. Each ministry exists to strengthen our church family and serve our community."
        >
          <LinkButton href="/visit" variant="secondary">
            Plan Your Visit
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            {ministries.length === 0 ? (
              <EmptyState
                title="Ministries coming soon"
                description="Add ministries in the admin to populate this section."
              />
            ) : (
              <SectionReveal>
                <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {ministries.map((m) => {
                    const images = getMinistryImages(m.slug);
                    const hasImages = images.length > 0;

                    return (
                      <li key={m.id}>
                        <Link href={`/ministries/${m.slug}`} className="group block h-full">
                          <div className="overflow-hidden">
                            {hasImages ? (
                              <MinistryCardSlideshow images={images} />
                            ) : (
                              <div
                                className="aspect-[4/3] bg-gradient-to-br from-brand-100 to-brand-50"
                                aria-hidden="true"
                              />
                            )}
                            <div className="border-t border-border pt-4">
                              <h2 className="font-display text-lg font-semibold text-brand-900 transition-colors duration-ui ease-smooth group-hover:text-brand-700">
                                {m.name}
                              </h2>
                              {m.short_description ? (
                                <p className="mt-1 line-clamp-3 text-sm text-ink-muted">
                                  {m.short_description}
                                </p>
                              ) : null}
                              {m.meeting_info ? (
                                <p className="mt-2 text-xs text-ink-muted">{m.meeting_info}</p>
                              ) : null}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </SectionReveal>
            )}
          </Container>
        </Section>

        <ContextualNextSteps
          title="Find your place"
          description="Explore a ministry, plan a visit, or contact us if you have questions."
          actions={[
            { href: "/visit", label: "Plan Your Visit" },
            { href: "/contact", label: "Contact Us", variant: "secondary" },
            { href: "/prayer", label: "Request Prayer", variant: "ghost" },
          ]}
          surface="muted"
        />
      </main>
      <Footer />
    </>
  );
}
