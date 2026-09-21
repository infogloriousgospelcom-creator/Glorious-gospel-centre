import Link from "next/link";
import Image from "next/image";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState, SectionEyebrow, SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { getFeaturedLeaders } from "@/services/content";
import { SectionReveal } from "@/components/motion/SectionReveal";

export async function WelcomeSection() {
  const leaders = await getFeaturedLeaders(3);

  return (
    <div id="welcome">
    <Section>
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <SectionReveal delay={0}>
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
                <Link href="/about"><Button>About us</Button></Link>
                <Link href="/about/leadership">
                  <Button variant="secondary">Meet our leaders</Button>
                </Link>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.15}>
            <div>
              <p className="eyebrow mb-4">Leadership</p>
              {leaders.length === 0 ? (
                <EmptyState
                  title="Leadership team coming soon"
                  description="Add leaders in the admin to introduce them here."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  {leaders.map((l) => (
                    <Card key={l.id} hoverable>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-200 to-brand-50 ring-2 ring-white"
                            aria-hidden="true"
                          >
                            {l.image_url ? (
                              <Image
                                src={l.image_url}
                                alt={l.full_name}
                                fill
                                className="object-cover"
                                sizes="56px"
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
          </SectionReveal>
        </div>
      </Container>
    </Section>
    </div>
  );
}
