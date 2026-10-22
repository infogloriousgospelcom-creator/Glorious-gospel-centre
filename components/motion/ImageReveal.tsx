"use client";

import { useRef, useEffect, useState, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ImageRevealProps {
  children: React.ReactNode;
  scale?: number;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

export function ImageReveal({
  children,
  scale = 1.03,
  delay = 0,
  duration = 0.7,
  className = "",
  style,
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          opacity: reduced ? 1 : visible ? 1 : 0,
          transform: reduced ? "none" : visible ? "scale(1)" : `scale(${scale})`,
          transition: reduced
            ? "none"
            : `opacity ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
          willChange: reduced ? undefined : "opacity, transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
