import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { getFeaturedMinistries } from "@/services/content";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { getMinistryImages } from "@/lib/ministry-images";
import { MinistryCardSlideshow } from "@/components/ministries/MinistryCardSlideshow";

export async function MinistriesSection() {
  const ministries = await getFeaturedMinistries(6);

  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mb-10 text-center">
            <SectionEyebrow>Get involved</SectionEyebrow>
            <SectionTitle>Our ministries</SectionTitle>
          </div>
        </SectionReveal>

        {ministries.length === 0 ? (
          <EmptyState
            title="Ministries coming soon"
            description="Add ministries in the admin to populate this section."
          />
        ) : (
          <SectionReveal delay={0.1}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.map((m) => {
                const images = getMinistryImages(m.slug);
                const hasImages = images.length > 0;

                return (
                  <Link key={m.id} href={`/ministries/${m.slug}`} className="group">
                    <Card hoverable className="h-full overflow-hidden">
                      {hasImages ? (
                        <MinistryCardSlideshow images={images} />
                      ) : (
                        <div
                          className="aspect-[4/3] bg-gradient-to-br from-brand-100 to-brand-50"
                          aria-hidden="true"
                        />
                      )}
                      <CardHeader>
                        <CardTitle className="transition-colors group-hover:text-brand-700">
                          {m.name}
                        </CardTitle>
                        {m.short_description ? (
                          <CardDescription>{m.short_description}</CardDescription>
                        ) : null}
                      </CardHeader>
                      {m.meeting_info ? (
                        <CardBody>
                          <p className="text-xs text-ink-muted">{m.meeting_info}</p>
                        </CardBody>
                      ) : null}
                    </Card>
                  </Link>
                );
              })}
            </div>
          </SectionReveal>
        )}

        <SectionReveal delay={0.2}>
          <div className="mt-10 text-center">
            <Link href="/ministries">
              <Button variant="secondary">All ministries</Button>
            </Link>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
