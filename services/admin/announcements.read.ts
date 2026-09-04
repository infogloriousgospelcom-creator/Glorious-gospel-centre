import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminAnnouncementRow {
  id: string;
  title: string;
  body: string;
  starts_at: string | null;
  ends_at: string | null;
  is_pinned: boolean;
  status: string;
  created_at: string;
  published_at: string | null;
}

export async function listAllAnnouncements(): Promise<AdminAnnouncementRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id,title,body,starts_at,ends_at,is_pinned,status,created_at,published_at",
      )
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as AdminAnnouncementRow[];
  } catch {
    return [];
  }
}

export async function getAnnouncementForAdmin(
  id: string,
): Promise<AdminAnnouncementRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id,title,body,starts_at,ends_at,is_pinned,status,created_at,published_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as AdminAnnouncementRow | null;
  } catch {
    return null;
  }
}
