"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import type { SermonSeries } from "@/types/content";

export function SermonsFilters({
  categories,
  series,
  defaultSearch,
  defaultCategory,
  defaultSeriesId,
}: {
  categories: string[];
  series: SermonSeries[];
  defaultSearch: string;
  defaultCategory: string;
  defaultSeriesId: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultSearch);
  const [category, setCategory] = useState(defaultCategory);
  const [seriesId, setSeriesId] = useState(defaultSeriesId ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSearch(defaultSearch);
    setCategory(defaultCategory);
    setSeriesId(defaultSeriesId ?? "");
  }, [defaultSearch, defaultCategory, defaultSeriesId]);

  function buildQuery(next: { q?: string; category?: string; series?: string }) {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.category && next.category !== "all") sp.set("category", next.category);
    if (next.series) sp.set("series", next.series);
    return sp.toString();
  }

  function pushWithReset(next: { q?: string; category?: string; series?: string }) {
    const qs = buildQuery(next);
    startTransition(() => {
      router.push(qs ? `/sermons?${qs}` : "/sermons");
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    pushWithReset({ q: search, category, series: seriesId });
  }

  function clear() {
    setSearch("");
    setCategory("all");
    setSeriesId("");
    startTransition(() => router.push("/sermons"));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <label className="sr-only" htmlFor="sermons-q">
        Search sermons
      </label>
      <Input
        id="sermons-q"
        name="q"
        type="search"
        placeholder="Search sermons, speakers, scripture…"
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        className="sm:max-w-xs"
      />

      <label className="sr-only" htmlFor="sermons-category">
        Filter by category
      </label>
      <Select
        id="sermons-category"
        name="category"
        value={category}
        onChange={(e) => {
          const next = e.target.value;
          setCategory(next);
          pushWithReset({ q: search, category: next, series: seriesId });
        }}
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <label className="sr-only" htmlFor="sermons-series">
        Filter by series
      </label>
      <Select
        id="sermons-series"
        name="series"
        value={seriesId}
        onChange={(e) => {
          const next = e.target.value;
          setSeriesId(next);
          pushWithReset({ q: search, category, series: next });
        }}
      >
        <option value="">All series</option>
        {series.map((sr) => (
          <option key={sr.id} value={sr.id}>
            {sr.title}
          </option>
        ))}
      </Select>

      <Button type="submit" isLoading={pending}>
        Apply
      </Button>
      <Button type="button" variant="ghost" onClick={clear}>
        Clear
      </Button>
    </form>
  );
}
