import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminSermonRow {
  id: string;
  slug: string;
  title: string;
  speaker: string | null;
  preached_on: string;
  category: string | null;
  status: string;
  series_id: string | null;
  published_at: string | null;
  created_at: string;
}

export async function listAllSermons(): Promise<AdminSermonRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermons")
      .select(
        "id,slug,title,speaker,preached_on,category,status,series_id,published_at,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as AdminSermonRow[];
  } catch {
    return [];
  }
}

export async function getSermonForAdmin(
  id: string,
): Promise<(AdminSermonRow & {
  description: string | null;
  scripture: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  livestream_url: string | null;
  duration_seconds: number | null;
}) | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermons")
      .select(
        "id,slug,title,description,speaker,preached_on,scripture,category,thumbnail_url,video_url,audio_url,livestream_url,duration_seconds,status,series_id,published_at,created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as
      | (AdminSermonRow & {
          description: string | null;
          scripture: string | null;
          thumbnail_url: string | null;
          video_url: string | null;
          audio_url: string | null;
          livestream_url: string | null;
          duration_seconds: number | null;
        })
      | null;
  } catch {
    return null;
  }
}

export async function listAllSeriesOptions() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermon_series")
      .select("id,slug,title")
      .order("title", { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
