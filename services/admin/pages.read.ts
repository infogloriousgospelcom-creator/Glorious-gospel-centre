import "server-only";
import { createClient } from "@/supabase/server";
export interface AdminPageRow {
  id: string; slug: string; title: string; excerpt: string | null;
  body: string | null; hero_image: string | null; seo_title: string | null;
  seo_description: string | null; seo_og_image: string | null;
  status: string; published_at: string | null; created_at: string;
}
export async function listAllPages(): Promise<AdminPageRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("pages").select(
      "id,slug,title,excerpt,body,hero_image,seo_title,seo_description,seo_og_image,status,published_at,created_at"
    ).order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as AdminPageRow[];
  } catch { return []; }
}
export async function getPageForAdmin(id: string): Promise<AdminPageRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("pages").select(
      "id,slug,title,excerpt,body,hero_image,seo_title,seo_description,seo_og_image,status,published_at,created_at"
    ).eq("id", id).maybeSingle();
    if (error) return null;
    return (data ?? null) as AdminPageRow | null;
  } catch { return null; }
}
