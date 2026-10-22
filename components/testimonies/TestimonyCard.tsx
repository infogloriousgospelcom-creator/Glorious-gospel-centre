import Link from "next/link";
import type { TestimonyPublic } from "@/types/content";

function excerpt(story: string, max = 180): string {
  const t = story.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function TestimonyCard({ testimony }: { testimony: TestimonyPublic }) {
  const byline = testimony.anonymous
    ? "A member of GGCC"
    : testimony.display_name
      ? testimony.display_name
      : "A member of GGCC";

  return (
    <li className="border-t border-border pt-5">
      <Link
        href={`/testimonies/${testimony.slug}`}
        className="group block min-h-touch"
      >
        <h2 className="font-display text-xl font-semibold text-brand-900 transition-colors group-hover:text-brand-700">
          {testimony.title}
        </h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          {byline}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {excerpt(testimony.story)}
        </p>
        <span className="mt-4 inline-block text-sm font-semibold text-brand-700">
          Read story
          <span aria-hidden="true"> →</span>
        </span>
      </Link>
    </li>
  );
}
