"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

export function GalleryFilters({
  categories,
  defaultCategory,
}: {
  categories: string[];
  defaultCategory: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(defaultCategory);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  function apply(next: string) {
    setCategory(next);
    const sp = new URLSearchParams();
    if (next !== "all") sp.set("category", next);
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `/gallery?${qs}` : "/gallery");
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(category);
      }}
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <label className="sr-only" htmlFor="gallery-category">
        Filter by category
      </label>
      <select
        id="gallery-category"
        name="category"
        value={category}
        onChange={(e) => apply(e.target.value)}
        className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <Button type="submit" isLoading={pending}>
        Apply
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => apply("all")}
      >
        Clear
      </Button>
    </form>
  );
}
