"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { MinistryImageEntry } from "@/lib/ministry-images";

interface PhotoSlideshowProps {
  images: readonly MinistryImageEntry[];
  intervalMs?: number;
  label?: string;
}

export function PhotoSlideshow({
  images,
  intervalMs = 5500,
  label = "Photograph slideshow",
}: PhotoSlideshowProps) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goTo = useCallback((index: number) => {
    setActiveIndex(((index % images.length) + images.length) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (reducedMotion || images.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [reducedMotion, images.length, isPaused, intervalMs]);

  if (images.length === 0) return null;

  const current = images[activeIndex];

  return (
    <div
      className="relative aspect-video overflow-hidden rounded-sm bg-surface-muted"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goPrev();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goNext();
        }
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
    >
      {images.map((image, index) => (
        <div
          key={image.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: index === activeIndex ? 1 : 0,
            transitionDuration: reducedMotion ? "0ms" : undefined,
          }}
          aria-hidden={index !== activeIndex}
        >
          {index === 0 || mounted ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 56rem, 100vw"
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
            />
          ) : null}
        </div>
      ))}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-brand-950/55 to-transparent"
        aria-hidden="true"
      />

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-900 shadow-soft transition-colors hover:bg-white"
            aria-label="Previous photograph"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-900 shadow-soft transition-colors hover:bg-white"
            aria-label="Next photograph"
          >
            <span aria-hidden="true">›</span>
          </button>

          <p className="absolute right-4 top-4 z-20 rounded-full bg-brand-950/60 px-2.5 py-1 text-xs font-medium text-white">
            {activeIndex + 1} / {images.length}
          </p>
          <p className="sr-only" aria-live="polite">
            {current.alt}. Photograph {activeIndex + 1} of {images.length}.
          </p>

          <div className="absolute bottom-4 left-0 right-0 z-20 flex flex-wrap items-center justify-center gap-1.5 px-4">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show photograph ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-5 bg-white"
                    : "w-2 bg-white/45 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
