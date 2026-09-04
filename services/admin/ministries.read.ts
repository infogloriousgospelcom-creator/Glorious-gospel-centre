import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminMinistryRow {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  hero_image: string | null;
  meeting_info: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  sort_order: number;
  status: string;
  published_at: string | null;
  created_at: string;
}

export async function listAllMinistries(): Promise<AdminMinistryRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministries")
      .select(
        "id,slug,name,short_description,description,hero_image,meeting_info,contact_email,contact_phone,sort_order,status,published_at,created_at",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as AdminMinistryRow[];
  } catch {
    return [];
  }
}

export async function getMinistryForAdmin(id: string): Promise<AdminMinistryRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministries")
      .select(
        "id,slug,name,short_description,description,hero_image,meeting_info,contact_email,contact_phone,sort_order,status,published_at,created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as AdminMinistryRow | null;
  } catch {
    return null;
  }
}
