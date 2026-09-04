import Image from "next/image";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import type { PageItem } from "@/types/content";

export function CmsPageView({ page, fallbackTitle }: { page: PageItem | null; fallbackTitle: string }) {
  return (
    <Section>
      <Container>
        {page ? (
          <article className="mx-auto max-w-3xl">
            <h1 className="heading-1 mb-4 text-balance">{page.title}</h1>
            {page.excerpt ? (
              <p className="lead mb-8 text-balance">{page.excerpt}</p>
            ) : null}
            {page.hero_image ? (
              <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl">
                <Image
                  src={page.hero_image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 768px, 100vw"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="prose prose-lg max-w-none text-ink">
              {page.body
                ? page.body.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="mb-4 leading-relaxed">
                      {para}
                    </p>
                  ))
                : (
                  <EmptyState
                    title={`${fallbackTitle} content coming soon`}
                    description="This page will populate once content is published through the admin."
                  />
                )}
            </div>
          </article>
        ) : (
          <EmptyState
            title={`${fallbackTitle} coming soon`}
            description="This page will populate once content is published through the admin."
          />
        )}
      </Container>
    </Section>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-brand-600">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="heading-1 mb-4 text-balance">{title}</h1>
          {description ? (
            <p className="lead mx-auto max-w-2xl text-balance">{description}</p>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

export function LeaderGrid({
  leaders,
}: {
  leaders: { id: string; full_name: string; title: string | null; bio: string | null; image_url: string | null; email: string | null }[];
}) {
  if (leaders.length === 0) {
    return (
      <EmptyState
        title="Leadership team coming soon"
        description="Add leaders in the admin to introduce them here."
      />
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {leaders.map((l) => (
        <Card key={l.id}>
          <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-brand-100 to-accent-100" aria-hidden="true">
            {l.image_url ? (
              <Image
                src={l.image_url}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                loading="lazy"
                className="object-cover"
              />
            ) : null}
          </div>
          <CardHeader>
            <CardTitle>{l.full_name}</CardTitle>
            {l.title ? <CardDescription>{l.title}</CardDescription> : null}
          </CardHeader>
          {l.bio ? (
            <CardBody>
              <p className="text-sm text-ink-muted">{l.bio}</p>
            </CardBody>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
