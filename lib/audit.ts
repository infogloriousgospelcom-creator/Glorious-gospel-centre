import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Service-role Supabase client.
 *
 * ⚠️  BYPASSES ALL ROW-LEVEL SECURITY. Use ONLY inside server-only code
 *     paths for operations that authenticated users cannot perform under
 *     RLS — currently: writing to public.audit_logs.
 *
 * Never import this file from client components. Never log the resulting
 * client's key.
 */

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  const env = getServerEnv();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Service-role client unavailable: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.",
    );
  }
  cached = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return cached;
}

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
    const supabase = getClient();
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
