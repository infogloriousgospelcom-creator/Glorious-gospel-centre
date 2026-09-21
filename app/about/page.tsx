import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { AboutSubnav } from "@/components/layout/AboutSubnav";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { LeaderGrid } from "@/components/about/CmsPageView";
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
    {
      href: "/about/story",
      title: "Our Story",
      description: "How God brought this church into being.",
    },
    {
      href: "/about/vision-mission",
      title: "Vision & Mission",
      description: "Where we are going and how we get there.",
    },
    {
      href: "/about/statement-of-faith",
      title: "Statement of Faith",
      description: "What we believe about God, Scripture, and the Gospel.",
    },
    {
      href: "/about/leadership",
      title: "Leadership",
      description: "Meet the pastors and leaders serving our church.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="About"
          title={settings.church_name}
          description={
            settings.tagline ??
            "A worshiping community committed to the Word, prayer, and outreach."
          }
        >
          <LinkButton href="/visit">Plan Your Visit</LinkButton>
          <LinkButton href="/about/leadership" variant="secondary">
            Meet our leaders
          </LinkButton>
        </PageHeader>
        <AboutSubnav active="/about" />

        <Section>
          <Container>
            <SectionReveal>
              <div className="mx-auto max-w-3xl text-center">
                <SectionEyebrow>Welcome</SectionEyebrow>
                <SectionTitle>Get to know us</SectionTitle>
                <SectionLead>
                  Learn about who we are, what we believe, and the people God has placed to lead
                  and serve this community.
                </SectionLead>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <ul className="mx-auto mt-10 grid max-w-4xl gap-0 sm:grid-cols-2">
                {sections.map((s) => (
                  <li
                    key={s.href}
                    className="border-t border-border sm:odd:border-r sm:odd:pr-8 sm:even:pl-8"
                  >
                    <Link
                      href={s.href}
                      className="group flex min-h-touch flex-col justify-center py-5 transition-colors duration-ui ease-smooth"
                    >
                      <span className="font-display text-lg font-semibold text-brand-900 group-hover:text-brand-700">
                        {s.title}
                        <span aria-hidden="true" className="ml-2 inline-block transition-transform duration-ui group-hover:translate-x-0.5">
                          →
                        </span>
                      </span>
                      <span className="mt-1 text-sm text-ink-muted">{s.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
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
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <LinkButton href="/about/leadership" variant="secondary">
                  Meet all our leaders
                </LinkButton>
                <LinkButton href="/ministries">Explore Ministries</LinkButton>
                <LinkButton href="/visit" variant="ghost">
                  Plan Your Visit
                </LinkButton>
              </div>
            </SectionReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
