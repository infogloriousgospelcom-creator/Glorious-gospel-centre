import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { buildPageMetadata } from "@/lib/seo";
import {
  getPublishedServices,
  getSiteSettings,
  groupServicesByDay,
} from "@/services/content";
import { SectionReveal } from "@/components/motion/SectionReveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Plan Your Visit",
  description:
    "Plan your visit to Glorious Gospel Centre Church in Kitengela — service times, location, what to expect, and how to watch online.",
  path: "/visit",
  keywords: ["plan your visit", "church visit", "kitengela church", "sunday service"],
});

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

const expectations = [
  {
    title: "Come as you are",
    body: "Whether it is your first Sunday or you are returning after time away, you are welcome. Dress comfortably — there is no dress code.",
  },
  {
    title: "Worship and the Word",
    body: "Our gatherings include prayer, praise, and teaching from Scripture. Bring a Bible if you like; we are glad to help you follow along.",
  },
  {
    title: "Family-friendly",
    body: "Children and youth are part of church life. Ask a greeter about Children's Ministry and Youth when you arrive.",
  },
  {
    title: "Stay afterward",
    body: "Take a moment to meet someone new. We would love to greet you and help you take a next step.",
  },
] as const;

/**
 * Plan Your Visit — presentation-only guide (no visitor CRM).
 */
export default async function VisitPage() {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    getPublishedServices(),
  ]);

  const byDay = groupServicesByDay(services);
  const sunday = byDay.find((g) => g.day === 0);
  const mapEmbed =
    settings.google_maps_url && /^https?:\/\//.test(settings.google_maps_url)
      ? settings.google_maps_url
      : null;
  const churchName = settings.church_name?.trim() || "Glorious Gospel Centre Church";
  const locationLine = settings.address?.trim() || "SIZERS-KITENGELA, Kenya";

  const sundaySummary =
    sunday && sunday.services.length > 0
      ? sunday.services
          .map(
            (s) =>
              `${s.name} ${formatTime(s.start_time)}${s.end_time ? `–${formatTime(s.end_time)}` : ""}`,
          )
          .join("; ")
      : "Sunday worship times are listed below.";

  const faqItems = [
    {
      question: "Where is the church?",
      answer: settings.address
        ? `We gather at ${settings.address.replace(/\s+/g, " ").trim()}.`
        : "We gather at SIZERS-KITENGELA. Contact us if you need directions.",
    },
    {
      question: "What time are Sunday services?",
      answer:
        sunday && sunday.services.length > 0
          ? `On Sundays we currently gather for: ${sundaySummary}. See the full schedule on this page or on Services.`
          : "Sunday times appear on this page once published. You can also contact the church office for the latest schedule.",
    },
    {
      question: "What should I wear?",
      answer:
        "Come as you are. There is no dress code — dress comfortably and join us for worship.",
    },
    {
      question: "Is there something for children?",
      answer:
        "Yes. Children's Ministry and Youth are part of church life. Ask a greeter when you arrive, or explore Children's Ministry on our Ministries pages.",
    },
    {
      question: "Can I join online instead?",
      answer:
        "Yes. You can watch through our livestream platforms when a service is streaming, and catch up anytime through our sermon library.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Welcome"
          title="Plan Your Visit"
          description={`We would love to welcome you to ${churchName}. Here is what you need to know before you come — or how to join us online.`}
        >
          <LinkButton href="#service-times">Service times</LinkButton>
          <LinkButton href="/livestream" variant="secondary">
            Watch Online
          </LinkButton>
        </PageHeader>

        <Section className="bg-surface-muted">
          <Container>
            <SectionReveal>
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <SectionEyebrow>Quick facts</SectionEyebrow>
                <SectionTitle>At a glance</SectionTitle>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.08}>
              <ul className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
                <li className="border-t border-border pt-4 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                    Where
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink whitespace-pre-line">
                    {locationLine}
                  </p>
                </li>
                <li className="border-t border-border pt-4 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                    When
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{sundaySummary}</p>
                </li>
                <li className="border-t border-border pt-4 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                    Online
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    Join via{" "}
                    <Link href="/livestream" className="brand-link">
                      Watch Online
                    </Link>{" "}
                    when a service is streaming.
                  </p>
                </li>
              </ul>
            </SectionReveal>
          </Container>
        </Section>

        <Section>
          <Container>
            <SectionReveal>
              <div className="mx-auto mb-10 max-w-2xl text-center">
                <SectionEyebrow>What to expect</SectionEyebrow>
                <SectionTitle>Your first Sunday with us</SectionTitle>
                <SectionLead>
                  A simple, welcoming gathering centered on Jesus — no pressure, just presence.
                </SectionLead>
              </div>
            </SectionReveal>
            <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
              {expectations.map((item, i) => (
                <SectionReveal key={item.title} delay={0.06 * (i + 1)}>
                  <div className="border-t border-border pt-5">
                    <h3 className="font-display text-lg font-semibold text-brand-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
                      {item.body}
                    </p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </Container>
        </Section>

        <Section id="service-times" className="bg-surface-muted">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
              <SectionReveal>
                <div>
                  <SectionEyebrow>Schedule</SectionEyebrow>
                  <SectionTitle>Service times</SectionTitle>
                  <SectionLead>
                    Join us for Sunday worship. Midweek prayer and practices are open to all.
                  </SectionLead>

                  {services.length === 0 ? (
                    <p className="mt-6 text-sm text-ink-muted">
                      Weekly times will appear here once published.{" "}
                      <Link href="/contact" className="brand-link">
                        Contact us
                      </Link>{" "}
                      for the latest schedule.
                    </p>
                  ) : (
                    <div className="mt-8 space-y-8">
                      {sunday ? (
                        <div>
                          <h3 className="heading-3 mb-3">{sunday.label}</h3>
                          <ul className="divide-y divide-border border-y border-border">
                            {sunday.services.map((s) => (
                              <li
                                key={s.id}
                                className="flex items-baseline justify-between gap-4 py-3"
                              >
                                <div>
                                  <p className="font-medium text-brand-900">{s.name}</p>
                                  {s.location ? (
                                    <p className="text-xs text-ink-muted">{s.location}</p>
                                  ) : null}
                                </div>
                                <p className="shrink-0 text-sm font-semibold text-brand-700">
                                  {formatTime(s.start_time)}
                                  {s.end_time ? ` – ${formatTime(s.end_time)}` : ""}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {byDay
                        .filter((g) => g.day !== 0)
                        .map((g) => (
                          <div key={g.day}>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
                              {g.label}
                            </h3>
                            <ul className="mt-2 space-y-2">
                              {g.services.map((s) => (
                                <li
                                  key={s.id}
                                  className="flex justify-between gap-3 text-sm text-ink"
                                >
                                  <span>{s.name}</span>
                                  <span className="shrink-0 text-ink-muted">
                                    {formatTime(s.start_time)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  )}

                  <p className="mt-6">
                    <Link
                      href="/services"
                      className="text-sm font-semibold text-brand-700 transition-colors duration-ui ease-smooth hover:text-brand-800"
                    >
                      Full services page →
                    </Link>
                  </p>
                </div>
              </SectionReveal>

              <SectionReveal delay={0.12}>
                <div>
                  <SectionEyebrow>Location</SectionEyebrow>
                  <SectionTitle>Find us</SectionTitle>
                  {settings.address ? (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink sm:text-base">
                      {settings.address}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-ink-muted">
                      Our address will appear here once published in church settings.
                    </p>
                  )}

                  <div className="mt-4 space-y-2 text-sm">
                    {settings.phone ? (
                      <p>
                        <span className="text-ink-muted">Phone: </span>
                        <a
                          className="brand-link"
                          href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                        >
                          {settings.phone}
                        </a>
                      </p>
                    ) : null}
                    {settings.email ? (
                      <p>
                        <span className="text-ink-muted">Email: </span>
                        <a className="brand-link" href={`mailto:${settings.email}`}>
                          {settings.email}
                        </a>
                      </p>
                    ) : null}
                  </div>

                  {mapEmbed ? (
                    <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
                      <iframe
                        title={`${churchName} location map`}
                        src={mapEmbed}
                        className="aspect-video w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <LinkButton href="/contact">Contact us</LinkButton>
                    <LinkButton href="/livestream" variant="secondary">
                      Watch Online
                    </LinkButton>
                  </div>
                </div>
              </SectionReveal>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <SectionReveal>
                <div>
                  <SectionEyebrow>Family</SectionEyebrow>
                  <SectionTitle>Children &amp; youth</SectionTitle>
                  <SectionLead>
                    Children and young people are welcome in the life of the church. Ask a greeter
                    when you arrive, or learn more about our ministries beforehand.
                  </SectionLead>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <LinkButton href="/ministries/children" variant="secondary">
                      Children&apos;s Ministry
                    </LinkButton>
                    <LinkButton href="/ministries/youth" variant="ghost">
                      Youth Ministry
                    </LinkButton>
                    <LinkButton href="/ministries" variant="ghost">
                      All ministries
                    </LinkButton>
                  </div>
                </div>
              </SectionReveal>
              <SectionReveal delay={0.1}>
                <div>
                  <SectionEyebrow>Online</SectionEyebrow>
                  <SectionTitle>Can&apos;t make it in person?</SectionTitle>
                  <SectionLead>
                    Join worship and teaching remotely. We do not show a fake “live now” status —
                    open a platform when a service is streaming.
                  </SectionLead>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <LinkButton href="/livestream">Watch Online</LinkButton>
                    <LinkButton href="/sermons" variant="secondary">
                      Browse sermons
                    </LinkButton>
                  </div>
                </div>
              </SectionReveal>
            </div>
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <SectionReveal>
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <SectionEyebrow>FAQ</SectionEyebrow>
                <SectionTitle>Common questions</SectionTitle>
                <SectionLead>
                  Straightforward answers for first-time visitors. Still unsure? Contact us.
                </SectionLead>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.08}>
              <div className="mx-auto max-w-3xl">
                <FaqAccordion items={faqItems} />
              </div>
            </SectionReveal>
          </Container>
        </Section>

        <Section>
          <Container width="prose" className="text-center">
            <SectionReveal>
              <SectionEyebrow>Next steps</SectionEyebrow>
              <SectionTitle>We look forward to meeting you</SectionTitle>
              <SectionLead>
                Choose one simple action — come in person, join online, or reach out.
              </SectionLead>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                <LinkButton href="/contact">Contact Us</LinkButton>
                <LinkButton href="/livestream" variant="secondary">
                  Watch Online
                </LinkButton>
                <LinkButton href="/ministries" variant="ghost">
                  Explore Ministries
                </LinkButton>
                <LinkButton href="/prayer" variant="ghost">
                  Request Prayer
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
