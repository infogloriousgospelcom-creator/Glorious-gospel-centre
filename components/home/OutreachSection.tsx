import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

const programmes = [
  {
    href: "/orphans",
    title: "Orphans Ministry",
    description:
      "Caring for vulnerable children through sponsorship, education, and family support.",
    eyebrow: "Outreach",
  },
  {
    href: "/feeding",
    title: "Feeding Programme",
    description:
      "Providing meals and nutrition support to families in our surrounding communities.",
    eyebrow: "Outreach",
  },
];

export function OutreachSection() {
  return (
    <Section>
      <Container>
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-brand-600">
            Outreach
          </p>
          <h2 className="heading-2 text-balance">Serving our community</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {programmes.map((p) => (
            <Link key={p.href} href={p.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-elevated">
                <div className="aspect-[16/9] bg-gradient-to-br from-brand-100 to-accent-100" aria-hidden="true" />
                <CardHeader>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">
                    {p.eyebrow}
                  </p>
                  <CardTitle>{p.title}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardBody>
                  <p className="text-sm font-medium text-brand-700">
                    Learn more →
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
