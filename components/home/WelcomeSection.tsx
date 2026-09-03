import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { getFeaturedLeaders } from "@/services/content";

export async function WelcomeSection() {
  const leaders = await getFeaturedLeaders(3);

  return (
    <Section>
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionEyebrow>Welcome</SectionEyebrow>
            <SectionTitle>Our story and our people</SectionTitle>
            <p className="lead mb-6 max-w-xl">
              We are a Christ-centered community in Kenya, gathered to worship
              Jesus, grow in the Word, and serve our neighbors. Whether you are
              exploring faith or looking for a church home, you are welcome
              here.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-700 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              >
                About us
              </Link>
              <Link
                href="/about/leadership"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-200 px-5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
              >
                Meet our leaders
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-brand-600">
              Leadership
            </p>
            {leaders.length === 0 ? (
              <EmptyState
                title="Leadership team coming soon"
                description="Add leaders in the admin to introduce them here."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {leaders.map((l) => (
                  <Card key={l.id}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-200 to-accent-200"
                          aria-hidden="true"
                        >
                          {l.image_url ? (
                            <img
                              src={l.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <CardTitle className="text-base">{l.full_name}</CardTitle>
                          {l.title ? (
                            <p className="text-xs text-ink-muted">{l.title}</p>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    {l.bio ? (
                      <CardBody>
                        <p className="text-sm text-ink-muted line-clamp-3">{l.bio}</p>
                      </CardBody>
                    ) : null}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
