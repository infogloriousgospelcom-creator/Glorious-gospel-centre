"use client";

import {
  useRef,
  useEffect,
  useState,
  Children,
  cloneElement,
  type ReactNode,
  type CSSProperties,
  type ReactElement,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface StaggerContainerProps {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
}

export function StaggerContainer({
  children,
  stagger = 80,
  delay = 0,
  className = "",
  style,
  once = true,
}: StaggerContainerProps) {
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
          if (once) observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, once]);

  const staggeredChildren = Children.map(children, (child, index) => {
    if (!visible || reduced || !isValidElement(child)) return child;
    return cloneElement(child, {
      style: {
        ...(child.props.style || {}),
        opacity: 1,
        transform: "none",
        transition: `opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay + index * (stagger / 1000)}s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay + index * (stagger / 1000)}s`,
      },
    } as Record<string, unknown>);
  });

  return (
    <div
      ref={ref}
      className={className}
      style={style}
    >
      {staggeredChildren}
    </div>
  );
}

function isValidElement(child: unknown): child is ReactElement {
  return child != null && typeof child === "object" && "props" in child;
}
