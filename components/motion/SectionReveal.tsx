"use client";

import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}

export function SectionReveal({
  children,
  className = "",
  style,
  delay = 0,
}: SectionRevealProps) {
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
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
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
        opacity: reduced ? 1 : visible ? 1 : 0,
        transform: reduced ? "none" : visible ? "none" : "translateY(20px)",
        transition: reduced
          ? "none"
          : `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        willChange: reduced ? undefined : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
