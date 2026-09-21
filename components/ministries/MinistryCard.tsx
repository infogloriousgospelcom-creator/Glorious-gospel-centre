import Link from "next/link";
import type { MinistryItem } from "@/types/content";
import { getMinistryImages } from "@/lib/ministry-images";
import { isPublicFacingText, publicMinistryHref } from "@/lib/ministries";
import { MinistryCardSlideshow } from "@/components/ministries/MinistryCardSlideshow";
import { cn } from "@/lib/utils";

export function MinistryCard({
  ministry,
  featured = false,
  className,
}: {
  ministry: MinistryItem;
  featured?: boolean;
  className?: string;
}) {
  const images = getMinistryImages(ministry.slug);
  const hasImages = images.length > 0;
  const href = publicMinistryHref(ministry.slug);
  const summary = isPublicFacingText(ministry.short_description)
    ? ministry.short_description
    : null;
  const meeting = isPublicFacingText(ministry.meeting_info)
    ? ministry.meeting_info
    : null;

  return (
    <li className={cn(featured && "sm:col-span-2 lg:col-span-1", className)}>
      <Link href={href} className="group block h-full">
        <article className="flex h-full flex-col overflow-hidden">
          {hasImages ? (
            <MinistryCardSlideshow images={images} />
          ) : (
            <div
              className={cn(
                "bg-gradient-to-br from-brand-100 to-brand-50",
                featured ? "aspect-[16/9]" : "aspect-[4/3]",
              )}
              aria-hidden="true"
            />
          )}
          <div className="flex flex-1 flex-col border-t border-border pt-4">
            <h3
              className={cn(
                "font-display font-semibold text-brand-900 transition-colors duration-ui ease-smooth group-hover:text-brand-700",
                featured ? "text-xl" : "text-lg",
              )}
            >
              {ministry.name}
            </h3>
            {summary ? (
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                {summary}
              </p>
            ) : null}
            {meeting ? (
              <p className="mt-2 text-xs text-ink-muted">{meeting}</p>
            ) : null}
            <span className="mt-auto pt-3 text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800">
              Explore ministry
              <span aria-hidden="true"> →</span>
            </span>
          </div>
        </article>
      </Link>
    </li>
  );
}
