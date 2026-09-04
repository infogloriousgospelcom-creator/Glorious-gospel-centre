import Link from "next/link";
import Image from "next/image";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { getLatestSermon } from "@/services/content";

export async function LatestSermonSection() {
  const sermon = await getLatestSermon();

  return (
    <Section className="bg-brand-900 text-brand-50">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionEyebrow className="text-accent-300">Latest sermon</SectionEyebrow>
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
                  <Link
                    href={`/sermons/${sermon.slug}`}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
                  >
                    Watch / listen
                  </Link>
                  <Link
                    href="/sermons"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    All sermons
                  </Link>
                </div>
              </>
            ) : (
              <SectionLead className="text-brand-100">
                Sermons will appear here once published through the admin.
              </SectionLead>
            )}
          </div>
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-accent-700 shadow-elevated">
            {sermon?.thumbnail_url ? (
              <Image
                src={sermon.thumbnail_url}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-brand-100/60">
                <span className="text-sm">No thumbnail yet</span>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
