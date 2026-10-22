"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function LeaderBio({
  text,
  lines = 4,
  className,
}: {
  text: string;
  lines?: 3 | 4;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function measure() {
      if (!el || expanded) return;
      setOverflows(el.scrollHeight > el.clientHeight + 2);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded, lines]);

  return (
    <div className={cn("mt-3", className)}>
      <p
        ref={ref}
        className={cn(
          "text-sm leading-relaxed text-ink-muted",
          !expanded && (lines === 3 ? "line-clamp-3" : "line-clamp-4"),
        )}
      >
        {text}
      </p>
      {overflows || expanded ? (
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
