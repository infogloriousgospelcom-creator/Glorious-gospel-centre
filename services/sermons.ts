import "server-only";
import { createClient } from "@/supabase/server";
import type { SermonItem, SermonSeries } from "@/types/content";

export const SERMONS_PAGE_SIZE = 20;

export interface PagedSermons {
  items: SermonItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SermonListFilters {
  search?: string;
  category?: string;
  seriesId?: string | null;
}

export async function listSermonsPaged(
  page: number,
  filters: SermonListFilters = {},
): Promise<PagedSermons> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const pageSize = SERMONS_PAGE_SIZE;
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = createClient();
    let query = supabase
      .from("sermons")
      .select(
        "id,slug,title,description,speaker,preached_on,scripture,category,thumbnail_url,video_url,audio_url,livestream_url,duration_seconds,series_id,published_at",
        { count: "exact" },
      )
      .eq("status", "PUBLISHED")
      .order("preached_on", { ascending: false });

    if (filters.category && filters.category !== "all") {
      query = query.ilike("category", filters.category);
    }
    if (filters.seriesId) {
      query = query.eq("series_id", filters.seriesId);
    }
    const search = filters.search?.trim();
    if (search) {
      const escaped = search.replace(/[%_]/g, (m) => `\\${m}`);
      query = query.or(
        `title.ilike.%${escaped}%,speaker.ilike.%${escaped}%,scripture.ilike.%${escaped}%,description.ilike.%${escaped}%`,
      );
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
      return { items: [], page: safePage, pageSize, totalCount: 0, totalPages: 0 };
    }
    const totalCount = count ?? 0;
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
    return {
      items: (data ?? []) as SermonItem[],
      page: safePage,
      pageSize,
      totalCount,
      totalPages,
    };
  } catch {
    return { items: [], page: safePage, pageSize, totalCount: 0, totalPages: 0 };
  }
}

export async function getSermonBySlug(slug: string): Promise<SermonItem | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermons")
      .select(
        "id,slug,title,description,speaker,preached_on,scripture,category,thumbnail_url,video_url,audio_url,livestream_url,duration_seconds,series_id,published_at",
      )
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as SermonItem | null;
  } catch {
    return null;
  }
}

export async function listAllSermonSeries(): Promise<SermonSeries[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermon_series")
      .select(
        "id,slug,title,description,hero_image,start_date,end_date,sort_order,published_at",
      )
      .eq("status", "PUBLISHED")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) return [];
    return (data ?? []) as SermonSeries[];
  } catch {
    return [];
  }
}

export async function listAllSermonCategories(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermons")
      .select("category")
      .eq("status", "PUBLISHED");
    if (error) return [];
    const set = new Set<string>();
    for (const row of data ?? []) {
      if (row.category) set.add(row.category);
    }
    return Array.from(set).sort();
  } catch {
    return [];
  }
}

export async function getSermonSeriesBySlug(slug: string): Promise<SermonSeries | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermon_series")
      .select(
        "id,slug,title,description,hero_image,start_date,end_date,sort_order,published_at",
      )
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as SermonSeries | null;
  } catch {
    return null;
  }
}

export async function getSeriesForSermon(sermonId: string): Promise<SermonSeries | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermons")
      .select(
        "series:sermon_series(id,slug,title,description,hero_image,start_date,end_date,sort_order,published_at)",
      )
      .eq("id", sermonId)
      .maybeSingle();
    if (error) return null;
    const series = data?.series as SermonSeries | SermonSeries[] | null;
    if (!series) return null;
    return Array.isArray(series) ? series[0] ?? null : series;
  } catch {
    return null;
  }
}
