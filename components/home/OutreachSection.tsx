import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { SectionReveal } from "@/components/motion/SectionReveal";

const programmes = [
  {
    href: "/about/story",
    title: "Our Story",
    description: "How God brought this church into being — from seven members in Mkuru to a ministry that has gone nationally and internationally.",
    eyebrow: "About",
  },
  {
    href: "/about/vision-mission",
    title: "Vision & Mission",
    description: "To reach the world with the Gospel of Jesus Christ and to instruct and strengthen church members in faith and holy living.",
    eyebrow: "Our Calling",
  },
];

export function OutreachSection() {
  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mb-10 text-center">
            <p className="eyebrow mb-3">About</p>
            <h2 className="heading-2 text-balance">Get to know us</h2>
          </div>
        </SectionReveal>
        <SectionReveal delay={0.1}>
          <div className="grid gap-6 md:grid-cols-2">
            {programmes.map((p) => (
              <Link key={p.href} href={p.href} className="group">
                <Card hoverable className="h-full">
                  <div
                    className="aspect-[16/9] bg-gradient-to-br from-brand-100 to-brand-50"
                    aria-hidden="true"
                  />
                  <CardHeader>
                    <p className="eyebrow">{p.eyebrow}</p>
                    <CardTitle className="transition-colors group-hover:text-brand-700">
                      {p.title}
                    </CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                  </CardHeader>
                  <CardBody>
                    <p className="text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800">
                      Read more →
                    </p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
