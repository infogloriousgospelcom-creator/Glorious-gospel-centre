import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Glorious Gospel Centre Church.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Section>
          <Container>
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <Badge tone="brand" className="mb-4">Welcome</Badge>
                <h1 className="heading-1 mb-6 text-balance">
                  A community anchored in grace.
                </h1>
                <p className="lead mb-8 text-balance">
                  Welcome to our church family. We are a worshiping community committed to
                  the Word, prayer, and reaching our city with the Gospel of Jesus Christ.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/about"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-700 px-6 text-base font-medium text-white transition-colors hover:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    Learn more
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-6 text-base font-medium text-brand-800 transition-colors hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    Visit us
                  </Link>
                </div>
              </div>
              <Card className="aspect-[4/3] overflow-hidden bg-brand-100">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-gradient-to-br from-brand-200 via-brand-100 to-accent-100"
                />
              </Card>
            </div>
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="heading-2 mb-4">This Week at GGC</h2>
              <p className="lead mb-8">
                Live content will appear here once the CMS is connected.
              </p>
              <Alert tone="info" title="Coming soon">
                Events, services, and sermons will populate this section in the next
                implementation phases.
              </Alert>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <h2 className="heading-2 mb-8 text-center">Latest</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {["Sermon", "Event", "Ministry"].map((item) => (
                <Card key={item}>
                  <CardHeader>
                    <CardTitle>{item} title</CardTitle>
                    <CardDescription>Short summary goes here.</CardDescription>
                  </CardHeader>
                  <CardBody>
                    <p className="text-sm text-ink-muted">
                      Placeholder content rendered via the design system primitives.
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
