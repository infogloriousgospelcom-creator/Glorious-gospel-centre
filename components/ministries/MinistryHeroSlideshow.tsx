"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { MinistryImageEntry } from "@/lib/ministry-images";

interface MinistryHeroSlideshowProps {
  images: MinistryImageEntry[];
  intervalMs?: number;
}

export function MinistryHeroSlideshow({
  images,
  intervalMs = 6000,
}: MinistryHeroSlideshowProps) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (reducedMotion || images.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [reducedMotion, images.length, isPaused, intervalMs]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="absolute inset-0 z-0">
        <Image
          src={images[0].src}
          alt={images[0].alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {images.map((image, index) => (
        <div
          key={image.src}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: index === activeIndex ? 1 : 0 }}
          aria-hidden={index !== activeIndex}
        >
          {index === 0 || mounted ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
            />
          ) : null}
        </div>
      ))}

      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Show image ${index + 1} of ${images.length}`}
            aria-current={index === activeIndex ? "true" : undefined}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "w-5 bg-white"
                : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
