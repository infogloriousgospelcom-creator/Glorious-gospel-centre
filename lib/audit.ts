import "server-only";
import { getServiceRoleClient } from "@/lib/service-role";

/**
 * Write an audit log row.
 * Never throws into the caller — audit failures must not break the parent
 * operation. Failures are logged to stderr for diagnosis.
 */
export async function writeAuditLog(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
  ipHash?: string | null;
}): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    // Cast to `any` because the JS client infers `never` for tables whose
    // types aren't in the generated schema. This is server-only, the
    // payload shape is enforced by the migration and the database.
    const table = supabase.from("audit_logs") as unknown as {
      insert: (rows: unknown) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await table.insert([{
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: input.metadata ?? {},
      ip_hash: input.ipHash ?? null,
    }]);
    if (error) console.error("[audit] insert failed:", error.message);
  } catch (e) {
    console.error("[audit] write error:", e instanceof Error ? e.message : String(e));
  }
}
