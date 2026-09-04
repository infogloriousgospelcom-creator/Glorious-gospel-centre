import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminServiceRow {
  id: string;
  name: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  location: string | null;
  sort_order: number;
  is_recurring: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
}

export async function listAllServices(): Promise<AdminServiceRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("services").select(
      "id,name,description,day_of_week,start_time,end_time,location,sort_order,is_recurring,status,published_at,created_at"
    ).order("day_of_week", { ascending: true }).order("start_time", { ascending: true });
    if (error) return [];
    return (data ?? []) as AdminServiceRow[];
  } catch { return []; }
}

export async function getServiceForAdmin(id: string): Promise<AdminServiceRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("services").select(
      "id,name,description,day_of_week,start_time,end_time,location,sort_order,is_recurring,status,published_at,created_at"
    ).eq("id", id).maybeSingle();
    if (error) return null;
    return (data ?? null) as AdminServiceRow | null;
  } catch { return null; }
}
