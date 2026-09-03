"use client";

import { useCallback, useState } from "react";
import { GalleryLightbox, type LightboxItem } from "./GalleryLightbox";

export function AlbumItemGrid({ items }: { items: LightboxItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length],
  );
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length],
  );

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-200 bg-surface-muted p-12 text-center text-sm text-ink-muted">
        No photos in this album yet.
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Open photo ${i + 1}${item.caption ? `: ${item.caption}` : ""}`}
              className="group relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-2 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {item.caption ?? item.alt}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <GalleryLightbox
        items={items}
        openIndex={openIndex}
        onClose={close}
        onPrev={prev}
        onNext={next}
        onJumpTo={setOpenIndex}
      />
    </>
  );
}
