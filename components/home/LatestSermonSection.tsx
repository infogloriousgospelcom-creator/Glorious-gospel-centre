import Image from "next/image";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { getLatestSermon } from "@/services/content";
import { youtubeThumbnailUrl } from "@/lib/media";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { ImageReveal } from "@/components/motion/ImageReveal";

function formatSermonDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function LatestSermonSection() {
  const sermon = await getLatestSermon();
  const thumb =
    sermon?.thumbnail_url ?? (sermon ? youtubeThumbnailUrl(sermon.video_url) : null);

  return (
    <Section className="relative overflow-hidden bg-brand-900 text-brand-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-brand-700/40 blur-3xl"
      />
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionReveal>
            <div>
              <SectionEyebrow className="text-accent-400">Latest sermon</SectionEyebrow>
              <SectionTitle className="text-white">
                {sermon ? sermon.title : "Sermons coming soon"}
              </SectionTitle>
              {sermon ? (
                <>
                  <p className="mb-1 text-sm font-medium text-brand-50">
                    {sermon.speaker ?? "Speaker TBD"}
                  </p>
                  <p className="mb-3 text-xs uppercase tracking-[0.14em] text-brand-200">
                    {formatSermonDate(sermon.preached_on)}
                    {sermon.scripture ? ` · ${sermon.scripture}` : ""}
                    {sermon.category ? ` · ${sermon.category}` : ""}
                  </p>
                  <SectionLead className="text-brand-100">
                    {sermon.description ??
                      "Listen to or watch the latest sermon from our pastoral team."}
                  </SectionLead>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <LinkButton href={`/sermons/${sermon.slug}`} variant="accent">
                      Watch / listen
                    </LinkButton>
                    <LinkButton
                      href="/sermons"
                      variant="ghost"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      Explore Sermons
                    </LinkButton>
                  </div>
                </>
              ) : (
                <SectionLead className="text-brand-100">
                  Sermons will appear here once published through the admin.
                </SectionLead>
              )}
            </div>
          </SectionReveal>
          <SectionReveal delay={0.15}>
            <ImageReveal scale={1.04} delay={0.15}>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 shadow-elevated ring-1 ring-white/10">
                {sermon && thumb ? (
                  <Image
                    src={thumb}
                    alt={`${sermon.title} sermon`}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-brand-100/60">
                    <span className="text-sm">No thumbnail yet</span>
                  </div>
                )}
              </div>
            </ImageReveal>
          </SectionReveal>
        </div>
      </Container>
    </Section>
  );
}
