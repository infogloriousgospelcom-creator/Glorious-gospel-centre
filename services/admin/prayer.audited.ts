import "server-only";
import { createClient } from "@/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import type { AdminPrayerRow } from "./prayer.read";

/**
 * List prayer requests with optional status filter and text search.
 * Every call is audit-logged as `prayer.read.list`.
 */
export async function listPrayerRequestsAudited(input: {
  actorId: string;
  status?: string;
  search?: string;
}): Promise<AdminPrayerRow[]> {
  const rows = await listAllPrayerRequestsFiltered(input.status, input.search);
  await writeAuditLog({
    actorId: input.actorId,
    action: "prayer.read.list",
    entityType: "prayer_request",
    entityId: null,
    metadata: {
      status: input.status ?? "all",
      search: input.search ?? "",
      count: rows.length,
    },
    ipHash: getClientIpHash(),
  });
  return rows;
}

async function listAllPrayerRequestsFiltered(
  status?: string,
  search?: string,
): Promise<AdminPrayerRow[]> {
  try {
    const supabase = createClient();
    let q = supabase
      .from("prayer_requests")
      .select(
        "id,full_name,email,phone,request_text,is_confidential,status,assigned_to,internal_notes,created_at",
      );
    if (status && status !== "all") q = q.eq("status", status);
    const s = search?.trim();
    if (s) {
      const escaped = s.replace(/[%_]/g, (m) => `\\${m}`);
      q = q.or(
        `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,request_text.ilike.%${escaped}%`,
      );
    }
    q = q.order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []) as AdminPrayerRow[];
  } catch {
    return [];
  }
}

export async function getPrayerRequestForAdminAudited(
  id: string,
  actorId: string,
): Promise<AdminPrayerRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prayer_requests")
      .select(
        "id,full_name,email,phone,request_text,is_confidential,status,assigned_to,internal_notes,created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    await writeAuditLog({
      actorId,
      action: "prayer.read",
      entityType: "prayer_request",
      entityId: id,
      metadata: { found: Boolean(data) },
      ipHash: getClientIpHash(),
    });
    return (data ?? null) as AdminPrayerRow | null;
  } catch {
    return null;
  }
}
