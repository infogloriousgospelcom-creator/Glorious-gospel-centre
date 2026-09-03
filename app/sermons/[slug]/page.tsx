import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionEyebrow } from "@/components/ui/Section";
import Link from "next/link";
import { getSermonBySlug } from "@/services/content";
import { toEmbedUrl, formatDuration } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const sermon = await getSermonBySlug(params.slug);
  if (!sermon) return { title: "Sermon" };
  return {
    title: sermon.title,
    description: sermon.description ?? `Sermon by ${sermon.speaker ?? "unknown"}.`,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SermonDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const sermon = await getSermonBySlug(params.slug);
  if (!sermon) notFound();

  const embed = toEmbedUrl(sermon.video_url);
  const duration = formatDuration(sermon.duration_seconds);

  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">
          <Container>
            <div className="mx-auto max-w-3xl">
              <Link
                href="/sermons"
                className="mb-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                ← All sermons
              </Link>
              <SectionEyebrow>Sermon</SectionEyebrow>
              <h1 className="heading-1 mb-4 text-balance">{sermon.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                {sermon.speaker ? <span className="font-medium text-ink">{sermon.speaker}</span> : null}
                <span>·</span>
                <span>{formatDate(sermon.preached_on)}</span>
                {sermon.scripture ? (
                  <>
                    <span>·</span>
                    <span>{sermon.scripture}</span>
                  </>
                ) : null}
                {duration ? (
                  <>
                    <span>·</span>
                    <span>{duration}</span>
                  </>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {sermon.category ? <Badge tone="brand">{sermon.category}</Badge> : null}
                {embed ? <Badge tone="accent">Video</Badge> : null}
                {sermon.audio_url ? <Badge tone="info">Audio</Badge> : null}
                {sermon.livestream_url ? <Badge tone="warning">Livestream</Badge> : null}
              </div>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            {embed ? (
              <div className="overflow-hidden rounded-2xl bg-ink shadow-elevated">
                <div className="aspect-video">
                  <iframe
                    src={embed}
                    title={sermon.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </div>
            ) : sermon.thumbnail_url ? (
              <img
                src={sermon.thumbnail_url}
                alt=""
                className="aspect-video w-full rounded-2xl object-cover shadow-elevated"
              />
            ) : (
              <EmptyState
                title="Media coming soon"
                description="The video, audio, or livestream link will appear once published."
              />
            )}

            {sermon.audio_url ? (
              <div className="mt-6">
                <audio controls className="w-full" preload="none">
                  <source src={sermon.audio_url} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : null}

            {sermon.livestream_url && !embed ? (
              <p className="mt-6 text-sm">
                <a
                  href={sermon.livestream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-accent-600 px-5 text-sm font-medium text-white hover:bg-accent-700"
                >
                  Watch livestream recording →
                </a>
              </p>
            ) : null}
          </Container>
        </Section>

        <Section className="bg-surface-muted">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
              <div>
                <h2 className="heading-2 mb-4">Sermon notes</h2>
                {sermon.description ? (
                  <div className="prose max-w-none text-ink">
                    {sermon.description.split(/\n{2,}/).map((p, i) => (
                      <p key={i} className="mb-4 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Notes coming soon"
                    description="Description and outline will appear here once added."
                  />
                )}
              </div>

              <aside className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Details</CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-2 text-sm">
                    <p>
                      <span className="text-ink-muted">Date: </span>
                      <span className="text-ink">{formatDate(sermon.preached_on)}</span>
                    </p>
                    {sermon.speaker ? (
                      <p>
                        <span className="text-ink-muted">Speaker: </span>
                        <span className="text-ink">{sermon.speaker}</span>
                      </p>
                    ) : null}
                    {sermon.scripture ? (
                      <p>
                        <span className="text-ink-muted">Scripture: </span>
                        <span className="text-ink">{sermon.scripture}</span>
                      </p>
                    ) : null}
                    {sermon.category ? (
                      <p>
                        <span className="text-ink-muted">Category: </span>
                        <span className="text-ink">{sermon.category}</span>
                      </p>
                    ) : null}
                  </CardBody>
                </Card>
              </aside>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
