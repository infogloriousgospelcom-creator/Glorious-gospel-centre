"use client";

import { useCallback, useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
        return;
      }
      if (e.key === "Tab") {
        // Focus trap — keep focus inside the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move initial focus into the dialog.
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();
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
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${openIndex + 1} of ${items.length}`}
      className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-4 sm:p-8"
      onClick={handleBackdrop}
    >
      <div className="flex items-center justify-between text-white">
        <p className="text-sm" aria-live="polite">
          {openIndex + 1} / {items.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo viewer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span aria-hidden="true" className="text-xl">×</span>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous photo"
          className="mr-2 hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <img
          src={current.src}
          alt={current.alt || "Gallery photo"}
          className="max-h-[75vh] max-w-full rounded object-contain"
        />
        <button
          type="button"
          onClick={onNext}
          aria-label="Next photo"
          className="ml-2 hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      {current.caption ? (
        <p className="mt-4 text-center text-sm text-white/90">{current.caption}</p>
      ) : null}

      <div
        className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:justify-center"
        role="tablist"
        aria-label="Photo thumbnails"
      >
        {items.map((it, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === openIndex}
            aria-current={i === openIndex ? "true" : undefined}
            onClick={() => onJumpTo(i)}
            aria-label={`Show photo ${i + 1}${it.alt ? `: ${it.alt}` : ""}`}
            className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              i === openIndex ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <img src={it.src} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
