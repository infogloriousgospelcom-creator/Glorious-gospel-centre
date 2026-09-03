import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LeaderGrid, PageHero } from "@/components/about/CmsPageView";
import { getSiteSettings } from "@/services/content";
import { getAllPublishedLeaders } from "@/services/pages";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Glorious Gospel Centre — our story, vision, mission, statement of faith, and leadership.",
};

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
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Welcome</SectionEyebrow>
              <SectionTitle>Get to know us</SectionTitle>
              <SectionLead>
                Learn about who we are, what we believe, and the people God has
                placed to lead and serve this community.
              </SectionLead>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {sections.map((s) => (
                <Link key={s.href} href={s.href} className="group">
                  <Card className="h-full transition-shadow group-hover:shadow-elevated">
                    <CardHeader>
                      <CardTitle>{s.title}</CardTitle>
                      <CardDescription>{s.description}</CardDescription>
                    </CardHeader>
                    <CardBody>
                      <p className="text-sm font-medium text-brand-700">Read more →</p>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="mb-10 text-center">
              <SectionEyebrow>Leadership</SectionEyebrow>
              <SectionTitle>Featured leaders</SectionTitle>
            </div>
            <LeaderGrid leaders={leaders.slice(0, 6)} />
            <div className="mt-10 text-center">
              <Link
                href="/about/leadership"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
              >
                Meet all our leaders
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
