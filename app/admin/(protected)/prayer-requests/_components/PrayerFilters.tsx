"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "NEW", label: "New" },
  { value: "READ", label: "Read" },
  { value: "RESPONDED", label: "Responded" },
  { value: "ARCHIVED", label: "Archived" },
];

export function PrayerFilters({
  current,
  counts,
}: {
  current: string;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "all") params.delete("status");
    else params.set("status", value);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/prayer-requests?${qs}` : "/admin/prayer-requests");
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Filter prayer requests by status"
      className="mb-4 flex flex-wrap gap-2"
    >
      {FILTERS.map((f) => {
        const isActive = current === f.value;
        const count = counts[f.value] ?? 0;
        return (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={pending}
            onClick={() => apply(f.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              isActive
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-brand-200 bg-white text-ink-muted hover:bg-brand-50",
            )}
          >
            {f.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                isActive ? "bg-white/20 text-white" : "bg-surface-inset text-ink",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
