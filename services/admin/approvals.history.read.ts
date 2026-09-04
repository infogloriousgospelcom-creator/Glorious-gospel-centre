import "server-only";
import { createClient } from "@/supabase/server";

export interface ApprovalHistoryRow {
  id: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
  actor_label: string | null;
}

export async function listApprovalHistory(
  entityType: string,
  entityId: string,
  limit = 50,
): Promise<ApprovalHistoryRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("approval_history")
      .select("id,entity_type,entity_id,actor_id,from_status,to_status,note,created_at,actor:profiles!approval_history_actor_id_fkey(id)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []).map((r) => {
      const actor = Array.isArray(r.actor) ? r.actor[0] : r.actor;
      return {
        ...(r as Omit<ApprovalHistoryRow, "actor_label">),
        actor_label: (actor as { id?: string } | null)?.id ?? null,
      };
    });
  } catch {
    return [];
  }
}
