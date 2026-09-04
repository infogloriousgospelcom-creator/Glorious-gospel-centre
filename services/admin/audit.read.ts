import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminAuditLogRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_hash: string | null;
  created_at: string;
}

export async function listRecentAuditLogs(limit = 200): Promise<AdminAuditLogRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,actor_id,action,entity_type,entity_id,metadata,ip_hash,created_at,actor:profiles!audit_logs_actor_id_fkey(id)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    // actor relation shape varies; flatten defensively.
    return (data ?? []).map((r) => {
      const actor = Array.isArray(r.actor) ? r.actor[0] : r.actor;
      return {
        id: r.id,
        actor_id: r.actor_id,
        actor_email: (actor as { id?: string } | null)?.id ?? null,
        action: r.action,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        metadata: (r.metadata ?? {}) as Record<string, unknown>,
        ip_hash: r.ip_hash,
        created_at: r.created_at,
      };
    });
  } catch {
    return [];
  }
}
