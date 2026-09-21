"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className={cn("divide-y divide-border border-y border-border", className)}>
      {items.map((item, index) => {
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;
        const isOpen = openIndex === index;

        return (
          <div key={item.question}>
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className={cn(
                  "flex min-h-touch w-full items-center justify-between gap-4 py-4 text-left",
                  "font-display text-base font-semibold text-brand-900",
                  "transition-colors duration-ui ease-smooth hover:text-brand-700",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                )}
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg font-normal text-ink-muted"
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-4 text-sm leading-relaxed text-ink-muted sm:text-base"
            >
              {isOpen ? <p>{item.answer}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
