import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { getAllPublishedMinistries } from "@/services/content";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { getMinistryImages } from "@/lib/ministry-images";
import { MinistryCardSlideshow } from "@/components/ministries/MinistryCardSlideshow";

export async function MinistriesSection() {
  const ministries = await getAllPublishedMinistries();

  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Get involved</SectionEyebrow>
            <SectionTitle>Our ministries</SectionTitle>
            <SectionLead>
              Find a place to belong, grow, and serve — from children and youth to worship and
              hospitality.
            </SectionLead>
          </div>
        </SectionReveal>

        {ministries.length === 0 ? (
          <EmptyState
            title="Ministries coming soon"
            description="Add ministries in the admin to populate this section."
          />
        ) : (
          <SectionReveal delay={0.1}>
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
                          <h3 className="font-display text-lg font-semibold text-brand-900 transition-colors duration-ui ease-smooth group-hover:text-brand-700">
                            {m.name}
                          </h3>
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

        <SectionReveal delay={0.18}>
          <div className="mt-10 text-center">
            <LinkButton href="/ministries" variant="secondary">
              Explore All Ministries
            </LinkButton>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
