"use client";

import { type ReactNode, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface StaggerItemProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  className?: string;
  style?: CSSProperties;
}

const directionTransform: Record<string, (d: number) => string> = {
  up: (d) => `translateY(${d}px)`,
  down: (d) => `translateY(-${d}px)`,
  left: (d) => `translateX(${d}px)`,
  right: (d) => `translateX(-${d}px)`,
  none: () => "none",
};

export function StaggerItem({
  children,
  direction = "up",
  distance = 20,
  className = "",
  style,
}: StaggerItemProps) {
  const reduced = useReducedMotion();
  const initialTransform = directionTransform[direction](distance);

  return (
    <div
      className={className}
      style={{
        ...style,
        opacity: reduced ? 1 : 0,
        transform: reduced ? "none" : initialTransform,
        willChange: reduced ? undefined : "opacity, transform",
      }}
      data-stagger-item
    >
      {children}
    </div>
  );
}
