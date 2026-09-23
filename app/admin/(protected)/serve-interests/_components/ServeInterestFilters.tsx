"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/Form";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "CLOSED", label: "Closed" },
];

export function ServeInterestFilters({
  currentStatus,
  currentMinistry,
  counts,
  ministries,
}: {
  currentStatus: string;
  currentMinistry: string;
  counts: Record<string, number>;
  ministries: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  function push(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/admin/serve-interests?${qs}` : "/admin/serve-interests");
    });
  }

  function applyStatus(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "all") params.delete("status");
    else params.set("status", value);
    push(params);
  }

  function applyMinistry(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "all") params.delete("ministry");
    else params.set("ministry", value);
    push(params);
  }

  return (
    <div className="mb-5 space-y-3">
      <div
        role="tablist"
        aria-label="Filter serve interests by status"
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => {
          const isActive = currentStatus === f.value;
          return (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={pending}
              onClick={() => applyStatus(f.value)}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
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
                {counts[f.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
      <label className="block max-w-sm text-sm">
        <span className="mb-1.5 block font-medium text-brand-900">Ministry</span>
        <Select
          aria-label="Filter by ministry"
          value={currentMinistry}
          disabled={pending}
          onChange={(e) => applyMinistry(e.target.value)}
        >
          <option value="all">All ministries</option>
          {ministries.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}
