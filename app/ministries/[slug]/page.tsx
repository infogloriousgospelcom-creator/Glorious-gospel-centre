import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState, SectionEyebrow } from "@/components/ui/Section";
import Link from "next/link";
import { getMinistryBySlug, getMinistryLeaders } from "@/services/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) return { title: "Ministry" };
  return {
    title: ministry.name,
    description: ministry.short_description ?? `Learn about the ${ministry.name} ministry.`,
  };
}

export default async function MinistryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) notFound();
  const leaders = await getMinistryLeaders(ministry.id);

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl">
              <Link
                href="/ministries"
                className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                ← All ministries
              </Link>
              <SectionEyebrow>Ministry</SectionEyebrow>
              <h1 className="heading-1 mb-4 text-balance">{ministry.name}</h1>
              {ministry.short_description ? (
                <p className="lead text-balance">{ministry.short_description}</p>
              ) : null}
            </div>
          </Container>
        </Section>

        {ministry.hero_image ? (
          <Container>
            <img
              src={ministry.hero_image}
              alt=""
              className="aspect-[21/9] w-full rounded-2xl object-cover shadow-elevated"
            />
          </Container>
        ) : null}

        <Section>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
              <div>
                <h2 className="heading-2 mb-4">About this ministry</h2>
                {ministry.description ? (
                  <div className="prose max-w-none text-ink">
                    {ministry.description.split(/\n{2,}/).map((p, i) => (
                      <p key={i} className="mb-4 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Description coming soon"
                    description="Ministry leaders can publish a description through the admin."
                  />
                )}
              </div>
              <aside className="space-y-6">
                {ministry.meeting_info ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Meetings</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <p className="text-sm text-ink">{ministry.meeting_info}</p>
                    </CardBody>
                  </Card>
                ) : null}
                {(ministry.contact_email || ministry.contact_phone) ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Contact</CardTitle>
                    </CardHeader>
                    <CardBody className="space-y-1 text-sm">
                      {ministry.contact_email ? (
                        <p>
                          <span className="text-ink-muted">Email: </span>
                          <a className="text-brand-700 hover:text-brand-800" href={`mailto:${ministry.contact_email}`}>
                            {ministry.contact_email}
                          </a>
                        </p>
                      ) : null}
                      {ministry.contact_phone ? (
                        <p>
                          <span className="text-ink-muted">Phone: </span>
                          <a className="text-brand-700 hover:text-brand-800" href={`tel:${ministry.contact_phone}`}>
                            {ministry.contact_phone}
                          </a>
                        </p>
                      ) : null}
                    </CardBody>
                  </Card>
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
                  <Card key={leader.id}>
                    <div className="aspect-[4/5] overflow-hidden bg-gradient-to-br from-brand-100 to-accent-100" aria-hidden="true">
                      {leader.image_url ? (
                        <img src={leader.image_url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base">{leader.full_name}</CardTitle>
                      <p className="text-sm text-ink-muted">
                        {role ?? leader.title ?? "Leader"}
                      </p>
                    </CardHeader>
                    {leader.bio ? (
                      <CardBody>
                        <p className="text-sm text-ink-muted line-clamp-3">{leader.bio}</p>
                      </CardBody>
                    ) : null}
                  </Card>
                ))}
              </div>
            </Container>
          </Section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
