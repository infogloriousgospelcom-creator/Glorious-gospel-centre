"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

export function SermonsFilters({
  categories,
  defaultSearch,
  defaultCategory,
}: {
  categories: string[];
  defaultSearch: string;
  defaultCategory: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(defaultSearch);
  const [category, setCategory] = useState(defaultCategory);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSearch(defaultSearch);
    setCategory(defaultCategory);
  }, [defaultSearch, defaultCategory]);

  function apply(next: { q?: string; category?: string }) {
    const sp = new URLSearchParams(params.toString());
    if (next.q !== undefined) sp.set("q", next.q);
    else sp.delete("q");
    if (next.category !== undefined) sp.set("category", next.category);
    else sp.delete("category");
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `/sermons?${qs}` : "/sermons");
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply({ q: search, category });
  }

  function clear() {
    setSearch("");
    setCategory("all");
    startTransition(() => router.push("/sermons"));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center"
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
      <select
        id="sermons-category"
        name="category"
        value={category}
        onChange={(e) => {
          const next = e.target.value;
          setCategory(next);
          apply({ category: next });
        }}
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
      <Button type="button" variant="ghost" onClick={clear}>
        Clear
      </Button>
    </form>
  );
}
