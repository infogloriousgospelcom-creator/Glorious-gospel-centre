import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading, EmptyState, ErrorState } from "@/components/ui/Section";
import { ModalPreview } from "./_components/ModalPreview";

export const metadata: Metadata = {
  title: "Design System",
  description: "Internal design-system preview.",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return (
    <main id="main" className="bg-surface-muted">
      <PageHeader
        eyebrow="Internal"
        title="Design System"
        description="Tokens and primitives used across the public site and admin. This page is not indexed."
        variant="plain"
        className="bg-surface-muted"
      />

      <Container className="pb-section">
        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <h2 className="heading-2 mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
            <Button isLoading>Loading</Button>
            <LinkButton href="/design-system" variant="secondary">
              LinkButton
            </LinkButton>
          </div>
        </Section>

        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <h2 className="heading-2 mb-6">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="brand">Brand</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="info">Info</Badge>
            <Badge tone="live">Live</Badge>
          </div>
        </Section>

        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <h2 className="heading-2 mb-6">Alerts</h2>
          <div className="grid gap-3">
            <Alert tone="info" title="Information">Helpful tip or context.</Alert>
            <Alert tone="success" title="Saved">Your changes have been saved.</Alert>
            <Alert tone="warning" title="Heads up">Please review the highlighted fields.</Alert>
            <Alert tone="danger" title="Error">Something went wrong. Try again.</Alert>
          </div>
        </Section>

        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <SectionHeading
            eyebrow="Layout"
            title="Section heading"
            lead="Reusable intro block for one-purpose sections."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card hoverable>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Short description.</CardDescription>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-ink-muted">
                  Body content slot. Used for sermons, events, ministries.
                </p>
              </CardBody>
              <CardFooter>
                <Button variant="ghost" size="sm">Cancel</Button>
                <Button size="sm">Confirm</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Image card</CardTitle>
              </CardHeader>
              <div className="aspect-video bg-gradient-to-br from-brand-200 to-accent-200" aria-hidden="true" />
              <CardFooter>
                <Badge tone="brand">Featured</Badge>
                <Button variant="link" size="sm">Read more</Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <h2 className="heading-2 mb-6">Empty & error</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState
              title="Nothing scheduled here yet"
              description="Upcoming gatherings will appear here when published."
            >
              <LinkButton href="/events" size="sm" variant="secondary">
                Explore events
              </LinkButton>
            </EmptyState>
            <ErrorState message="We couldn't load this information right now.">
              <Button size="sm" variant="secondary">Try again</Button>
            </ErrorState>
          </div>
        </Section>

        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <h2 className="heading-2 mb-6">Forms</h2>
          <form className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" required hint="First and last name.">
              <Input id="name" placeholder="Jane Doe" autoComplete="name" />
            </Field>
            <Field label="Email" htmlFor="email" required error="Enter a valid email">
              <Input id="email" type="email" aria-invalid="true" />
            </Field>
            <Field label="Message" htmlFor="message" className="sm:col-span-2">
              <Textarea id="message" placeholder="How can we pray for you?" />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button variant="secondary">Cancel</Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Section>

        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <h2 className="heading-2 mb-6">Skeleton</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Section>

        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <h2 className="heading-2 mb-6">Modal</h2>
          <ModalPreview />
        </Section>

        <Section spacing="compact" className="mb-6 rounded-2xl bg-surface px-6 shadow-soft">
          <h2 className="heading-2 mb-6">Typography</h2>
          <div className="space-y-4">
            <h1 className="heading-1">Heading 1 — Display</h1>
            <h2 className="heading-2">Heading 2 — Display</h2>
            <h3 className="heading-3">Heading 3 — Display</h3>
            <p className="scripture">
              &ldquo;If God be for us, who can be against us?&rdquo;
              <span className="scripture-ref">Romans 8:31</span>
            </p>
            <p className="lead">
              Lead paragraph — used for introductions and section openers.
            </p>
            <p>Body paragraph — regular copy used throughout the site.</p>
            <p className="text-sm text-ink-muted">Small muted helper text.</p>
          </div>
        </Section>
      </Container>
    </main>
  );
}
