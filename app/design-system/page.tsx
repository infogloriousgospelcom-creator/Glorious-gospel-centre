import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { ModalPreview } from "./_components/ModalPreview";

export const metadata: Metadata = {
  title: "Design System",
  description: "Internal design-system preview.",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return (
    <main id="main" className="bg-surface-muted">
      <Container className="py-section">
        <header className="mb-10">
          <Badge tone="accent" className="mb-3">Internal</Badge>
          <h1 className="heading-1">Design System</h1>
          <p className="lead mt-3 max-w-2xl">
            Tokens and primitives used across the public site and admin. This page is
            not indexed.
          </p>
        </header>

        <Section className="bg-surface py-8 rounded-2xl shadow-soft px-6">
          <h2 className="heading-2 mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
            <Button isLoading>Loading</Button>
          </div>
        </Section>

        <Section className="bg-surface py-8 rounded-2xl shadow-soft px-6">
          <h2 className="heading-2 mb-6">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="brand">Brand</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="info">Info</Badge>
          </div>
        </Section>

        <Section className="bg-surface py-8 rounded-2xl shadow-soft px-6">
          <h2 className="heading-2 mb-6">Alerts</h2>
          <div className="grid gap-3">
            <Alert tone="info" title="Information">Helpful tip or context.</Alert>
            <Alert tone="success" title="Saved">Your changes have been saved.</Alert>
            <Alert tone="warning" title="Heads up">Please review the highlighted fields.</Alert>
            <Alert tone="danger" title="Error">Something went wrong. Try again.</Alert>
          </div>
        </Section>

        <Section className="bg-surface py-8 rounded-2xl shadow-soft px-6">
          <h2 className="heading-2 mb-6">Cards</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
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

        <Section className="bg-surface py-8 rounded-2xl shadow-soft px-6">
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
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="secondary">Cancel</Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Section>

        <Section className="bg-surface py-8 rounded-2xl shadow-soft px-6">
          <h2 className="heading-2 mb-6">Skeleton</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Section>

        <Section className="bg-surface py-8 rounded-2xl shadow-soft px-6">
          <h2 className="heading-2 mb-6">Modal</h2>
          <ModalPreview />
        </Section>

        <Section className="bg-surface py-8 rounded-2xl shadow-soft px-6">
          <h2 className="heading-2 mb-6">Typography</h2>
          <div className="space-y-4">
            <h1 className="heading-1">Heading 1 — Display</h1>
            <h2 className="heading-2">Heading 2 — Display</h2>
            <h3 className="heading-3">Heading 3 — Display</h3>
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
