import "server-only";
import { createClient } from "@/supabase/server";
import type { LeaderItem, PageItem } from "@/types/content";

export async function getPublishedPage(slug: string): Promise<PageItem | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pages")
      .select(
        "id,slug,title,excerpt,body,hero_image,seo_title,seo_description,seo_og_image,published_at",
      )
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as PageItem | null;
  } catch {
    return null;
  }
}

export async function getAllPublishedLeaders(): Promise<LeaderItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("leaders")
      .select(
        "id,full_name,title,bio,image_url,email,phone,sort_order,is_featured",
      )
      .eq("status", "PUBLISHED")
      .order("sort_order", { ascending: true })
      .order("full_name", { ascending: true });
    if (error) return [];
    return (data ?? []) as LeaderItem[];
  } catch {
    return [];
  }
}

export async function getAllPublishedPages(): Promise<PageItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("id,slug,title,excerpt,published_at")
      .eq("status", "PUBLISHED")
      .order("published_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as PageItem[];
  } catch {
    return [];
  }
}
