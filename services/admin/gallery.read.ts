import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminAlbumRow {
  id: string; slug: string; title: string; description: string | null;
  cover_image: string | null; category: string | null; event_date: string | null;
  sort_order: number; status: string; published_at: string | null; created_at: string;
}
export interface AdminGalleryItem {
  id: string; album_id: string; storage_path: string;
  caption: string | null; alt_text: string | null; sort_order: number;
  created_at: string;
}

export async function listAllAlbums(): Promise<AdminAlbumRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("gallery_albums").select(
      "id,slug,title,description,cover_image,category,event_date,sort_order,status,published_at,created_at"
    ).order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as AdminAlbumRow[];
  } catch { return []; }
}
export async function getAlbumForAdmin(id: string): Promise<AdminAlbumRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("gallery_albums").select(
      "id,slug,title,description,cover_image,category,event_date,sort_order,status,published_at,created_at"
    ).eq("id", id).maybeSingle();
    if (error) return null;
    return (data ?? null) as AdminAlbumRow | null;
  } catch { return null; }
}
export async function listAlbumItemsForAdmin(albumId: string): Promise<AdminGalleryItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("gallery_items").select(
      "id,album_id,storage_path,caption,alt_text,sort_order,created_at"
    ).eq("album_id", albumId).order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []) as AdminGalleryItem[];
  } catch { return []; }
}
export function publicStorageUrl(bucket: string, storagePath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}
