import "server-only";
import { createClient } from "@/supabase/server";
import type { ConnectGroupAdminRow, ConnectGroupStatus } from "@/types/content";

const ADMIN_SELECT =
  "id,slug,name,short_description,description,meeting_day,meeting_time,meeting_frequency,location_note,capacity,leader_display_name,ministry_id,status,sort_order,published_at,created_at,updated_at";

async function assertConnectGroupsManager(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;
    const { data: allowed } = await supabase.rpc("has_permission", {
      permission_key: "connect_groups.manage",
    });
    return Boolean(allowed);
  } catch {
    return false;
  }
}

export async function listConnectGroupsForAdmin(input?: {
  status?: string;
  search?: string;
}): Promise<ConnectGroupAdminRow[]> {
  if (!(await assertConnectGroupsManager())) return [];
  try {
    const supabase = createClient();
    let q = supabase.from("connect_groups").select(ADMIN_SELECT);
    if (input?.status && input.status !== "all") {
      q = q.eq("status", input.status);
    }
    const s = input?.search?.trim();
    if (s) {
      const escaped = s.replace(/[%_]/g, (m) => `\\${m}`);
      q = q.or(
        `name.ilike.%${escaped}%,short_description.ilike.%${escaped}%,slug.ilike.%${escaped}%`,
      );
    }
    q = q.order("sort_order", { ascending: true }).order("name", { ascending: true });
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []) as ConnectGroupAdminRow[];
  } catch {
    return [];
  }
}

export async function getConnectGroupForAdmin(
  id: string,
): Promise<ConnectGroupAdminRow | null> {
  if (!(await assertConnectGroupsManager())) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("connect_groups")
      .select(ADMIN_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as ConnectGroupAdminRow | null;
  } catch {
    return null;
  }
}

export async function countConnectGroupsByStatus(): Promise<
  Record<ConnectGroupStatus | "all", number>
> {
  const counts: Record<ConnectGroupStatus | "all", number> = {
    all: 0,
    DRAFT: 0,
    OPEN: 0,
    FULL: 0,
    CLOSED: 0,
    ARCHIVED: 0,
  };
  const rows = await listConnectGroupsForAdmin({ status: "all" });
  counts.all = rows.length;
  for (const r of rows) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }
  return counts;
}
