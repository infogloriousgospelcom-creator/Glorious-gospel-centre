import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { dayName } from "@/types/content";
import type { ServiceItem } from "@/types/content";

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function PrayerWays({
  intercessoryServices,
}: {
  intercessoryServices: ServiceItem[];
}) {
  const ways: Array<{
    title: string;
    body: string;
    href: string;
    cta: string;
  }> = [
    {
      title: "Submit a prayer request",
      body: "Share a confidential need with our prayer team. Your request is not published publicly.",
      href: "#prayer-request",
      cta: "Go to the form",
    },
    {
      title: "Pray with the church",
      body: "Join us in Sunday worship and gather with the church family as we seek God together.",
      href: "/services",
      cta: "View services",
    },
    {
      title: "Explore the Prayer Ministry",
      body: "Learn how prayer shapes the life of GGCC and find ways to grow in intercession.",
      href: "/ministries/prayer",
      cta: "Prayer Ministry",
    },
    {
      title: "Ask for pastoral support",
      body: "If you need to speak with someone from the church, reach out through our contact page.",
      href: "/contact",
      cta: "Contact GGCC",
    },
  ];

  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Ways to pray</SectionEyebrow>
            <SectionTitle>How you can take a step</SectionTitle>
            <SectionLead>
              Whether you need quiet support or want to pray with others, there is a place for you.
            </SectionLead>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.08}>
          <ul className="mx-auto grid max-w-5xl gap-0 sm:grid-cols-2">
            {ways.map((way) => (
              <li key={way.title} className="border-t border-border sm:odd:border-r sm:odd:pr-8 sm:even:pl-8">
                <Link
                  href={way.href}
                  className="group flex min-h-touch flex-col justify-center py-5 transition-colors duration-ui ease-smooth"
                >
                  <h3 className="font-display text-lg font-semibold text-brand-900 group-hover:text-brand-700">
                    {way.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{way.body}</p>
                  <span className="mt-3 text-sm font-semibold text-brand-700">
                    {way.cta}
                    <span aria-hidden="true"> →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionReveal>

        {intercessoryServices.length > 0 ? (
          <SectionReveal delay={0.12}>
            <div className="mx-auto mt-12 max-w-3xl border-t border-border pt-8">
              <h3 className="font-display text-xl font-semibold text-brand-900">
                Intercessory gatherings
              </h3>
              <p className="mt-2 text-sm text-ink-muted">
                From our published weekly schedule — join us to pray with the church.
              </p>
              <ul className="mt-4 space-y-2">
                {intercessoryServices.map((s) => (
                  <li key={s.id} className="text-sm text-ink">
                    <span className="font-semibold text-brand-900">{s.name}</span>
                    <span className="text-ink-muted">
                      {" "}
                      · {dayName(s.day_of_week)} · {formatTime(s.start_time)}
                      {s.end_time ? ` – ${formatTime(s.end_time)}` : ""}
                      {s.location ? ` · ${s.location}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                <Link href="/services" className="brand-link text-sm font-semibold">
                  Full service schedule
                </Link>
              </p>
            </div>
          </SectionReveal>
        ) : null}
      </Container>
    </Section>
  );
}
