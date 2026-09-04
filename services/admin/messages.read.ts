import "server-only";
import { createClient } from "@/supabase/server";
export interface AdminMessageRow {
  id: string; full_name: string; email: string; phone: string | null;
  subject: string | null; message: string; is_read: boolean; created_at: string;
}
export async function listAllMessages(): Promise<AdminMessageRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("contact_messages").select(
      "id,full_name,email,phone,subject,message,is_read,created_at"
    ).order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as AdminMessageRow[];
  } catch { return []; }
}
