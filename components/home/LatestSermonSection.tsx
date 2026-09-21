import Link from "next/link";
import Image from "next/image";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { getLatestSermon } from "@/services/content";
import { youtubeThumbnailUrl } from "@/lib/media";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { ImageReveal } from "@/components/motion/ImageReveal";

export async function LatestSermonSection() {
  const sermon = await getLatestSermon();

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
                  <p className="mb-2 text-sm text-brand-100">
                    {sermon.speaker ?? "Speaker TBD"}
                    {sermon.scripture ? ` · ${sermon.scripture}` : ""}
                  </p>
                  <SectionLead className="text-brand-100">
                    {sermon.description ??
                      "Listen to or watch the latest sermon from our pastoral team."}
                  </SectionLead>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/sermons/${sermon.slug}`}>
                      <Button variant="accent">Watch / listen</Button>
                    </Link>
                    <Link href="/sermons">
                      <Button variant="ghost" className="text-white hover:bg-white/10">
                        All sermons
                      </Button>
                    </Link>
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
              <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 shadow-elevated ring-1 ring-white/10">
                {sermon?.thumbnail_url ?? youtubeThumbnailUrl(sermon?.video_url) ? (
                  <Image
                    src={sermon?.thumbnail_url ?? youtubeThumbnailUrl(sermon?.video_url)!}
                    alt={`${sermon!.title} sermon`}
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
