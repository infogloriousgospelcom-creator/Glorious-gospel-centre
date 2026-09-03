import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow } from "@/components/ui/Section";
import { getSiteSettings, getActiveAnnouncements } from "@/services/content";

export async function HeroSection() {
  const [settings, announcements] = await Promise.all([
    getSiteSettings(),
    getActiveAnnouncements(),
  ]);
  const top = announcements[0];

  return (
    <Section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-surface to-accent-50">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionEyebrow>{settings.church_name}</SectionEyebrow>
            <h1 className="heading-1 mb-6 text-balance">
              {settings.tagline ?? "A community anchored in grace."}
            </h1>
            <p className="lead mb-8 max-w-xl text-balance">
              We are a worshiping community committed to the Word, prayer, and
              reaching our city with the Gospel of Jesus Christ.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-700 px-6 text-base font-medium text-white transition-colors hover:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Learn more
              </Link>
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-6 text-base font-medium text-brand-800 transition-colors hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Service times
              </Link>
            </div>
            {top ? (
              <aside className="mt-10 rounded-2xl border border-brand-100 bg-white/80 p-5 shadow-soft backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">
                  Announcement
                </p>
                <p className="mt-1 font-serif text-lg font-semibold text-ink">
                  {top.title}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{top.body}</p>
              </aside>
            ) : null}
          </div>
          <div className="relative">
            <div className="aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand-200 via-brand-100 to-accent-100 shadow-elevated" />
            <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 rounded-full bg-accent-200/60 blur-3xl md:block" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
