import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { getFeaturedMinistries } from "@/services/content";

export async function MinistriesSection() {
  const ministries = await getFeaturedMinistries(6);

  return (
    <Section>
      <Container>
        <div className="mb-10 text-center">
          <SectionEyebrow>Get involved</SectionEyebrow>
          <SectionTitle>Our ministries</SectionTitle>
        </div>

        {ministries.length === 0 ? (
          <EmptyState
            title="Ministries coming soon"
            description="Add ministries in the admin to populate this section."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ministries.map((m) => (
              <Link key={m.id} href={`/ministries/${m.slug}`} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-elevated">
                  <div className="aspect-[4/3] bg-gradient-to-br from-brand-100 to-accent-100" aria-hidden="true" />
                  <CardHeader>
                    <CardTitle>{m.name}</CardTitle>
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
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/ministries"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
          >
            All ministries
          </Link>
        </div>
      </Container>
    </Section>
  );
}
