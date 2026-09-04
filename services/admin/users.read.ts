import "server-only";
import { createClient } from "@/supabase/server";
export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role_keys: string[];
  created_at: string;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("admins")
      .select("id,profile_id,is_active,created_at,role:roles(key),profile:profiles(full_name,email)")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((r) => {
      const role = Array.isArray(r.role) ? r.role[0] : r.role;
      const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
      const roleKey = (role as { key?: string } | null)?.key ?? "UNKNOWN";
      return {
        id: r.id,
        email: (profile as { email?: string } | null)?.email ?? "—",
        full_name: (profile as { full_name?: string | null } | null)?.full_name ?? null,
        is_active: r.is_active,
        role_keys: [roleKey],
        created_at: r.created_at,
      };
    });
  } catch { return []; }
}
