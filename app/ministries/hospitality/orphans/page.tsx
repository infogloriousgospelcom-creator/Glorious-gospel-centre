import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { ContextualNextSteps } from "@/components/church/ContextualNextSteps";
import { PhotoSlideshow } from "@/components/ministries/PhotoSlideshow";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Orphans & Vulnerable Persons",
  description:
    "GGCC's ministry to orphans and vulnerable children — providing care, encouragement, and practical support through the Hospitality Ministry.",
  path: "/ministries/hospitality/orphans",
  keywords: ["orphans", "vulnerable children", "hospitality ministry", "community care", "GGCC"],
});

const PROGRAM_PDF =
  "/ORPHANS%20AND%20VULNERABLES/700-Student-Education-Support-Program-Event-Summary.pdf";
const PROGRAM_VIDEO = "/ORPHANS%20AND%20VULNERABLES/Videos%20(1).mp4";

const PROGRAM_PHOTOS = [
  { src: "/orphans-vulnerables/photo-1.jpeg", alt: "Students and partners gathered for the education support program" },
  { src: "/orphans-vulnerables/photo-2.jpeg", alt: "A moment of prayer and welcome during the outreach" },
  { src: "/orphans-vulnerables/photo-3.jpeg", alt: "School supplies prepared for students in the program" },
  { src: "/orphans-vulnerables/photo-4.jpeg", alt: "Families and volunteers during the education support day" },
  { src: "/orphans-vulnerables/photo-5.jpeg", alt: "Children receiving support at the program" },
  { src: "/orphans-vulnerables/photo-6.jpeg", alt: "Partners and church members serving together" },
  { src: "/orphans-vulnerables/photo-7.jpeg", alt: "A group photo from the 700-student education support event" },
  { src: "/orphans-vulnerables/photo-8.jpeg", alt: "Guests and students at the education support gathering" },
  { src: "/orphans-vulnerables/photo-9.jpeg", alt: "Children and volunteers during the education support program" },
  { src: "/orphans-vulnerables/photo-10.jpeg", alt: "A student receiving learning materials" },
  { src: "/orphans-vulnerables/photo-11.jpeg", alt: "Church members serving at the outreach tables" },
  { src: "/orphans-vulnerables/photo-12.jpeg", alt: "Students waiting to receive school support" },
  { src: "/orphans-vulnerables/photo-13.jpeg", alt: "A family moment during the education support day" },
  { src: "/orphans-vulnerables/photo-14.jpeg", alt: "Partners speaking with students at the gathering" },
  { src: "/orphans-vulnerables/photo-15.jpeg", alt: "School books and bags prepared for distribution" },
  { src: "/orphans-vulnerables/photo-16.jpeg", alt: "Volunteers encouraging children at the program" },
  { src: "/orphans-vulnerables/photo-17.jpeg", alt: "Students gathered with church members" },
  { src: "/orphans-vulnerables/photo-18.jpeg", alt: "A quiet moment of care during the outreach" },
  { src: "/orphans-vulnerables/photo-19.jpeg", alt: "Children holding school supplies they received" },
  { src: "/orphans-vulnerables/photo-20.jpeg", alt: "Leaders and guests at the education support event" },
  { src: "/orphans-vulnerables/photo-21.jpeg", alt: "The congregation standing with students" },
  { src: "/orphans-vulnerables/photo-22.jpeg", alt: "A closing gathering from the education support day" },
] as const;

export default async function OrphansVulnerablesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Hospitality Ministry"
          title="Orphans & Vulnerable Persons"
          description="Part of the Hospitality Ministry of Glorious Gospel Centre Church. We care for children and people who are facing difficult circumstances and seek practical ways to stand with them."
        >
          <LinkButton href="/ministries/hospitality" variant="secondary">
            Hospitality Ministry
          </LinkButton>
        </PageHeader>

        <Section>
          <Container>
            <article className="mx-auto max-w-3xl space-y-12 text-base leading-8 tracking-normal text-ink sm:text-lg sm:leading-9">
              <p className="text-lg leading-9 text-ink-muted sm:text-xl sm:leading-10">
                We believe that people in vulnerable situations should not be forgotten. Through the
                support of the church, we seek to offer care, encouragement and practical assistance
                while showing the love of Christ.
              </p>

              <div className="space-y-5">
                <h2 className="heading-3">What We Do</h2>
                <p className="text-ink-muted">The ministry focuses on:</p>
                <ul className="list-disc space-y-3 pl-6 text-ink">
                  <li>Caring for orphans and vulnerable children.</li>
                  <li>Identifying practical needs where the church can help.</li>
                  <li>Providing support and encouragement.</li>
                  <li>Standing with vulnerable individuals and families.</li>
                  <li>Creating a caring church community where people know they are valued.</li>
                  <li>
                    Encouraging church members to participate through prayer, giving and volunteering.
                  </li>
                </ul>
              </div>

              <div className="space-y-5">
                <h2 className="heading-3">Our Heart</h2>
                <p className="text-ink-muted">
                  We want those we serve to experience genuine care and dignity. Sometimes support may
                  involve meeting a practical need. At other times, it may mean encouragement, prayer or
                  simply being present.
                </p>
                <p className="text-ink-muted">
                  Our desire is to care for people in a way that reflects the compassion of Jesus Christ.
                </p>
              </div>
            </article>
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="mx-auto max-w-3xl">
              <SectionEyebrow>Recent program</SectionEyebrow>
              <SectionTitle className="text-left">700-Student Education Support</SectionTitle>
              <article className="space-y-5 text-base leading-8 tracking-normal text-ink-muted sm:text-lg sm:leading-9">
                <p>
                  Glorious Gospel Celebration Centre hosted a 700-student education support program
                  for orphans and vulnerable children. The original plan was to give fuller packages
                  to a smaller group. When more children arrived than expected, the church and its
                  partners stretched the aid so that all 700 students received something — even if
                  each gift was smaller than first intended.
                </p>
                <p>
                  Support included school bags, books, and other learning materials, given with prayer
                  and a word of encouragement. The day was made possible with Gloha SACCO, Project
                  Restore Hope, partner churches, and Bishop Dr. Bonface Mang&apos;eti.
                </p>
                <p>
                  The aim was not only to hand out supplies, but to remind each child that they are
                  seen, valued, and not walking alone.
                </p>
              </article>
              <div className="mt-8">
                <LinkButton
                  href={PROGRAM_PDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                >
                  Read the full event summary (PDF)
                </LinkButton>
              </div>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <div className="mx-auto max-w-4xl">
              <SectionEyebrow>From the day</SectionEyebrow>
              <SectionTitle className="text-left">Photographs</SectionTitle>
              <SectionLead className="mx-0">
                Photographs from the education support gathering. Use the arrows or dots to move from
                one image to the next.
              </SectionLead>
              <div className="mt-10">
                <PhotoSlideshow
                  images={PROGRAM_PHOTOS}
                  label="Education support program photographs"
                />
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="mx-auto max-w-3xl">
              <SectionEyebrow>Watch</SectionEyebrow>
              <SectionTitle className="text-left">A glimpse of the gathering</SectionTitle>
              <SectionLead className="mx-0">
                A short recording from the education support program.
              </SectionLead>
              <div className="mt-8 overflow-hidden rounded-sm bg-brand-50">
                <video
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-brand-900/10"
                  aria-label="Recording from the 700-student education support program"
                >
                  <source src={PROGRAM_VIDEO} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <div className="mx-auto max-w-3xl space-y-8">
              <div className="border-t border-border pt-6">
                <h3 className="heading-4 mb-4">Get Involved</h3>
                <p className="mb-6 text-ink-muted">
                  Members of Glorious Gospel Centre Church can support this ministry through prayer,
                  giving, and volunteering when opportunities arise.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <LinkButton href="/prayer">Pray for this ministry</LinkButton>
                  <LinkButton href="/give" variant="secondary">
                    Give support
                  </LinkButton>
                  <LinkButton href="/contact" variant="ghost">
                    Contact us to learn more
                  </LinkButton>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <SectionEyebrow>Hospitality Ministry</SectionEyebrow>
              <SectionTitle>We believe every person matters</SectionTitle>
              <SectionLead>
                We want to be a church that remembers those who need care and support.
              </SectionLead>
              <div className="mt-6">
                <LinkButton href="/ministries/hospitality" variant="secondary">
                  Back to Hospitality Ministry
                </LinkButton>
              </div>
            </div>
          </Container>
        </Section>

        <ContextualNextSteps
          title="Continue exploring"
          description="Learn about the Feeding Programme, serve with Hospitality, or plan a visit."
          actions={[
            { href: "/ministries/hospitality/feeding", label: "Feeding Programme" },
            { href: "/serve?ministry=orphans-vulnerables", label: "Express Interest", variant: "secondary" },
            { href: "/visit", label: "Plan Your Visit", variant: "ghost" },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}
