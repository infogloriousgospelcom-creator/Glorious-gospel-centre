import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import type { PageItem } from "@/types/content";

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Split CMS body into optional titled sections without changing wording.
 * Supports markdown-style "## Heading" lines; otherwise treats as paragraphs.
 */
function parseBodySections(body: string): { id?: string; title?: string; paragraphs: string[] }[] {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const sections: { id?: string; title?: string; paragraphs: string[] }[] = [];
  let current: { id?: string; title?: string; paragraphs: string[] } = { paragraphs: [] };

  for (const block of blocks) {
    const md = block.match(/^##\s+(.+)$/);
    if (md) {
      if (current.title || current.paragraphs.length) sections.push(current);
      const title = md[1].trim();
      current = { id: slugifyHeading(title), title, paragraphs: [] };
      continue;
    }
    current.paragraphs.push(block);
  }
  if (current.title || current.paragraphs.length) sections.push(current);
  return sections;
}

export function CmsPageView({
  page,
  fallbackTitle,
  hideTitle = false,
  showToc = false,
  nextHref,
  nextLabel,
}: {
  page: PageItem | null;
  fallbackTitle: string;
  /** When a PageHeader already rendered the title above. */
  hideTitle?: boolean;
  /** Show on-page nav when body contains ## section headings. */
  showToc?: boolean;
  nextHref?: string;
  nextLabel?: string;
}) {
  const sections = page?.body ? parseBodySections(page.body) : [];
  const tocItems = sections.filter((s) => s.id && s.title);

  return (
    <Section>
      <Container>
        {page ? (
          <article className="mx-auto max-w-3xl">
            {!hideTitle ? (
              <h1 className="heading-1 mb-4 text-balance">{page.title}</h1>
            ) : null}
            {page.excerpt && !hideTitle ? (
              <p className="lead mb-8 text-balance">{page.excerpt}</p>
            ) : null}
            {page.hero_image ? (
              <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-xl">
                <Image
                  src={page.hero_image}
                  alt={page.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
              </div>
            ) : null}

            {showToc && tocItems.length > 1 ? (
              <nav
                aria-label="On this page"
                className="mb-10 rounded-xl border border-border bg-surface-muted/60 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                  On this page
                </p>
                <ul className="mt-3 space-y-2">
                  {tocItems.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="brand-link text-sm">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <div className="space-y-10 text-base leading-relaxed text-ink">
              {sections.length > 0 ? (
                sections.map((section, i) => (
                  <section
                    key={section.id ?? `block-${i}`}
                    id={section.id}
                    className={section.title ? "scroll-mt-28" : undefined}
                  >
                    {section.title ? (
                      <h2 className="heading-3 mb-4 text-balance">{section.title}</h2>
                    ) : null}
                    <div className="space-y-4">
                      {section.paragraphs.map((para, pi) => (
                        <p key={pi}>{para}</p>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <EmptyState
                  title={`${fallbackTitle} content coming soon`}
                  description="This page will populate once content is published through the admin."
                />
              )}
            </div>

            {nextHref && nextLabel ? (
              <div className="mt-12 border-t border-border pt-8">
                <LinkButton href={nextHref}>{nextLabel}</LinkButton>
              </div>
            ) : null}
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

/** Prefer PageHeader directly — kept for existing About call sites. */
export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return <PageHeader eyebrow={eyebrow} title={title} description={description} />;
}

export function LeaderGrid({
  leaders,
}: {
  leaders: {
    id: string;
    full_name: string;
    title: string | null;
    bio: string | null;
    image_url: string | null;
    email: string | null;
  }[];
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
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {leaders.map((l) => (
        <li key={l.id}>
          <div className="overflow-hidden">
            <div className="relative aspect-[4/5] overflow-hidden bg-brand-100">
              {l.image_url ? (
                <Image
                  src={l.image_url}
                  alt={l.full_name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : null}
            </div>
            <div className="border-t border-border pt-4">
              <p className="font-display text-lg font-semibold text-brand-900">{l.full_name}</p>
              {l.title ? <p className="mt-1 text-sm text-ink-muted">{l.title}</p> : null}
              {l.bio ? (
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-muted">{l.bio}</p>
              ) : null}
              {l.email ? (
                <p className="mt-3 text-sm">
                  <Link href={`mailto:${l.email}`} className="brand-link">
                    {l.email}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
