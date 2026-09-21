import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { LeaderGrid, PageHero } from "@/components/about/CmsPageView";
import { getSiteSettings } from "@/services/content";
import { getAllPublishedLeaders } from "@/services/pages";
import { buildPageMetadata } from "@/lib/seo";
import { SectionReveal } from "@/components/motion/SectionReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description:
    "Learn about Glorious Gospel Centre Church — our story, vision, mission, statement of faith, and leadership.",
  path: "/about",
  keywords: ["about", "church", "vision", "mission", "leadership", "statement of faith"],
});

export default async function AboutPage() {
  const [settings, leaders] = await Promise.all([
    getSiteSettings(),
    getAllPublishedLeaders(),
  ]);

  const sections = [
    { href: "/about/story", title: "Our Story", description: "How God brought this church into being." },
    { href: "/about/vision-mission", title: "Vision & Mission", description: "Where we are going and how we get there." },
    { href: "/about/statement-of-faith", title: "Statement of Faith", description: "What we believe about God, Scripture, and the Gospel." },
    { href: "/about/leadership", title: "Leadership", description: "Meet the pastors and leaders serving our church." },
  ];

  return (
    <>
      <Navbar />
      <main id="main">
        <PageHero
          eyebrow="About"
          title={settings.church_name}
          description={
            settings.tagline ??
            "A worshiping community committed to the Word, prayer, and outreach."
          }
        />
        <AboutSubnav active="/about" />

        <Section>
          <Container>
            <SectionReveal>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Welcome</SectionEyebrow>
              <SectionTitle>Get to know us</SectionTitle>
              <SectionLead>
                Learn about who we are, what we believe, and the people God has
                placed to lead and serve this community.
              </SectionLead>
            </div>
            </SectionReveal>
            <SectionReveal delay={0.1}>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {sections.map((s) => (
                <Link key={s.href} href={s.href} className="group">
                  <Card hoverable className="h-full">
                    <CardHeader>
                      <CardTitle className="transition-colors group-hover:text-brand-700">{s.title}</CardTitle>
                      <CardDescription>{s.description}</CardDescription>
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

        <Section className="bg-surface-muted">
          <Container>
            <SectionReveal>
            <div className="mb-10 text-center">
              <SectionEyebrow>Leadership</SectionEyebrow>
              <SectionTitle>Featured leaders</SectionTitle>
            </div>
            </SectionReveal>
            <LeaderGrid leaders={leaders.slice(0, 6)} />
            <SectionReveal delay={0.1}>
            <div className="mt-10 text-center">
              <Link href="/about/leadership">
                <Button variant="secondary">Meet all our leaders</Button>
              </Link>
            </div>
            </SectionReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}