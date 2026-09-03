"use client";

import { useCallback, useEffect } from "react";

export interface LightboxItem {
  src: string;
  alt: string;
  caption?: string | null;
}

export function GalleryLightbox({
  items,
  openIndex,
  onClose,
  onPrev,
  onNext,
  onJumpTo,
}: {
  items: LightboxItem[];
  openIndex: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpTo: (index: number) => void;
}) {
  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, onClose, onPrev, onNext]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (openIndex === null) return null;
  const current = items[openIndex];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-4 sm:p-8"
      onClick={handleBackdrop}
    >
      <div className="flex items-center justify-between text-white">
        <p className="text-sm">
          {openIndex + 1} / {items.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
        >
          <span aria-hidden="true" className="text-xl">×</span>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous photo"
          className="mr-2 hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
        >
          ‹
        </button>
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[75vh] max-w-full rounded object-contain"
        />
        <button
          type="button"
          onClick={onNext}
          aria-label="Next photo"
          className="ml-2 hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
        >
          ›
        </button>
      </div>

      {current.caption ? (
        <p className="mt-4 text-center text-sm text-white/90">{current.caption}</p>
      ) : null}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:justify-center">
        {items.map((it, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onJumpTo(i)}
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === openIndex ? "true" : undefined}
            className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition ${
              i === openIndex ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <img src={it.src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
