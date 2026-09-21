import Link from "next/link";
import Image from "next/image";
import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { getFeaturedLeaders } from "@/services/content";
import { SectionReveal } from "@/components/motion/SectionReveal";

export async function WelcomeSection() {
  const leaders = await getFeaturedLeaders(3);

  return (
    <Section id="welcome" className="bg-surface-muted">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <SectionReveal delay={0}>
            <div>
              <SectionEyebrow>Welcome</SectionEyebrow>
              <SectionTitle>A church family for you</SectionTitle>
              <p className="lead mb-6 max-w-xl">
                We are a Christ-centered community in Kenya, gathered to worship Jesus, grow in
                the Word, and serve our neighbors. Whether you are exploring faith or looking for
                a church home, you are welcome here.
              </p>
              <div className="flex flex-wrap gap-3">
                <LinkButton href="/about">Learn About GGCC</LinkButton>
                <LinkButton href="/about/leadership" variant="secondary">
                  Meet our leaders
                </LinkButton>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.12}>
            <div>
              <p className="eyebrow mb-4">Leadership</p>
              {leaders.length === 0 ? (
                <EmptyState
                  title="Leadership team coming soon"
                  description="Add leaders in the admin to introduce them here."
                />
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {leaders.map((l) => (
                    <li key={l.id} className="flex items-center gap-4 py-4">
                      <div
                        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-100 ring-1 ring-border"
                        aria-hidden={!l.image_url}
                      >
                        {l.image_url ? (
                          <Image
                            src={l.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium text-brand-900">{l.full_name}</p>
                        {l.title ? (
                          <p className="text-xs text-ink-muted">{l.title}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4">
                <Link
                  href="/about/leadership"
                  className="text-sm font-semibold text-brand-700 transition-colors duration-ui ease-smooth hover:text-brand-800"
                >
                  Full leadership team →
                </Link>
              </p>
            </div>
          </SectionReveal>
        </div>
      </Container>
    </Section>
  );
}
