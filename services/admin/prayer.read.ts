import "server-only";
import { createClient } from "@/supabase/server";
export interface AdminPrayerRow {
  id: string; full_name: string | null; email: string | null; phone: string | null;
  request_text: string; is_confidential: boolean; status: string;
  assigned_to: string | null; internal_notes: string | null; created_at: string;
}
export async function listAllPrayerRequests(): Promise<AdminPrayerRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("prayer_requests").select(
      "id,full_name,email,phone,request_text,is_confidential,status,assigned_to,internal_notes,created_at"
    ).order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as AdminPrayerRow[];
  } catch { return []; }
}
