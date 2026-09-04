import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminSeriesRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  hero_image: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  status: string;
  published_at: string | null;
  created_at: string;
}

export async function listAllSeries(): Promise<AdminSeriesRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermon_series")
      .select(
        "id,slug,title,description,hero_image,start_date,end_date,sort_order,status,published_at,created_at",
      )
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) return [];
    return (data ?? []) as AdminSeriesRow[];
  } catch {
    return [];
  }
}

export async function getSeriesForAdmin(id: string): Promise<AdminSeriesRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermon_series")
      .select(
        "id,slug,title,description,hero_image,start_date,end_date,sort_order,status,published_at,created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as AdminSeriesRow | null;
  } catch {
    return null;
  }
}
