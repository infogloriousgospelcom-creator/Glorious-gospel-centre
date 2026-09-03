import "server-only";
import { createClient } from "@/supabase/server";
import type { GalleryAlbum, GalleryItem } from "@/types/content";

export const GALLERY_PAGE_SIZE = 12;

export interface PagedAlbums {
  items: GalleryAlbum[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export async function listAlbumsPaged(
  page: number,
  category?: string,
): Promise<PagedAlbums> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const pageSize = GALLERY_PAGE_SIZE;
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  try {
    const supabase = createClient();
    let query = supabase
      .from("gallery_albums")
      .select(
        "id,slug,title,description,cover_image,category,event_date,sort_order,published_at",
        { count: "exact" },
      )
      .eq("status", "PUBLISHED")
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("sort_order", { ascending: true });
    if (category && category !== "all") {
      query = query.ilike("category", category);
    }
    const { data, error, count } = await query.range(from, to);
    if (error) {
      return { items: [], page: safePage, pageSize, totalCount: 0, totalPages: 0 };
    }
    const totalCount = count ?? 0;
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
    return {
      items: (data ?? []) as GalleryAlbum[],
      page: safePage,
      pageSize,
      totalCount,
      totalPages,
    };
  } catch {
    return { items: [], page: safePage, pageSize, totalCount: 0, totalPages: 0 };
  }
}

export async function listAllAlbumCategories(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gallery_albums")
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

export async function getAlbumBySlug(slug: string): Promise<GalleryAlbum | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gallery_albums")
      .select(
        "id,slug,title,description,cover_image,category,event_date,sort_order,published_at",
      )
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as GalleryAlbum | null;
  } catch {
    return null;
  }
}

export async function listAlbumItems(albumId: string): Promise<GalleryItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id,album_id,storage_path,caption,alt_text,sort_order")
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []) as GalleryItem[];
  } catch {
    return [];
  }
}

export async function getAlbumItemCount(albumId: string): Promise<number> {
  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("gallery_items")
      .select("id", { count: "exact", head: true })
      .eq("album_id", albumId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Convert a stored storage_path into a public URL via the gallery-images bucket.
 * Returns null when the project URL isn't configured.
 */
export function publicStorageUrl(bucket: string, storagePath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encodedPath}`;
}
