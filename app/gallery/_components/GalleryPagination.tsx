import Link from "next/link";

export function GalleryPagination({
  currentPage,
  totalPages,
  category,
}: {
  currentPage: number;
  totalPages: number;
  category: string;
}) {
  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const sp = new URLSearchParams();
    if (category && category !== "all") sp.set("category", category);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    return qs ? `/gallery?${qs}` : "/gallery";
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Gallery pagination"
      className="mt-10 flex items-center justify-between gap-4 border-t border-brand-100 pt-6"
    >
      {hasPrev ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-medium text-brand-800 hover:bg-brand-50"
          rel="prev"
        >
          ← Previous
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl border border-brand-100 bg-surface-inset px-5 text-sm font-medium text-ink-subtle"
        >
          ← Previous
        </span>
      )}
      <p className="text-sm text-ink-muted" aria-live="polite">
        Page {currentPage} of {totalPages}
      </p>
      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 text-sm font-medium text-brand-800 hover:bg-brand-50"
          rel="next"
        >
          Next →
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl border border-brand-100 bg-surface-inset px-5 text-sm font-medium text-ink-subtle"
        >
          Next →
        </span>
      )}
    </nav>
  );
}
