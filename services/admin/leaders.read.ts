import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminLeaderRow {
  id: string;
  full_name: string;
  title: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  phone: string | null;
  sort_order: number;
  is_featured: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
}

export async function listAllLeaders(): Promise<AdminLeaderRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("leaders").select(
      "id,full_name,title,bio,image_url,email,phone,sort_order,is_featured,status,published_at,created_at"
    ).order("sort_order", { ascending: true }).order("full_name", { ascending: true });
    if (error) return [];
    return (data ?? []) as AdminLeaderRow[];
  } catch { return []; }
}

export async function getLeaderForAdmin(id: string): Promise<AdminLeaderRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("leaders").select(
      "id,full_name,title,bio,image_url,email,phone,sort_order,is_featured,status,published_at,created_at"
    ).eq("id", id).maybeSingle();
    if (error) return null;
    return (data ?? null) as AdminLeaderRow | null;
  } catch { return null; }
}
