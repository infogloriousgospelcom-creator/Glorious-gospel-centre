import "server-only";
import { createClient as createUserClient } from "@/supabase/server";
import { getServiceRoleClient } from "@/lib/service-role";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";

const TABLES = ["events", "sermons", "announcements", "pages"] as const;
const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
type ContentTable = typeof TABLES[number];
type ContentStatus = typeof STATUS[number];

export interface TransitionInput {
  table: ContentTable;
  id: string;
  toStatus: ContentStatus;
  note?: string;
  actorId: string;
}

export interface TransitionResult {
  ok: boolean;
  message: string;
  from: ContentStatus | null;
  to: ContentStatus;
}

async function loadCurrentStatus(table: ContentTable, id: string): Promise<ContentStatus | null> {
  const supabase = createUserClient();
  const { data } = await supabase.from(table).select("status").eq("id", id).maybeSingle();
  return (data?.status as ContentStatus | undefined) ?? null;
}

export async function applyTransition(input: TransitionInput): Promise<TransitionResult> {
  const from = await loadCurrentStatus(input.table, input.id);
  if (!from) return { ok: false, message: "Item not found.", from: null, to: input.toStatus };
  if (from === input.toStatus) {
    return { ok: true, message: "Already in target status.", from, to: input.toStatus };
  }

  const userClient = createUserClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: input.toStatus,
    updated_by: input.actorId,
  };
  if (input.toStatus === "APPROVED" || input.toStatus === "PUBLISHED") {
    patch.approved_by = input.actorId;
    patch.approved_at = now;
  }
  if (input.toStatus === "PUBLISHED") patch.published_at = now;

  const { error } = await userClient.from(input.table).update(patch).eq("id", input.id);
  if (error) return { ok: false, message: "Could not update status.", from, to: input.toStatus };

  // History row (service-role insert — RLS denies authenticated inserts).
  const service = getServiceRoleClient();
  const tableAlias = service.from("approval_history" as "profiles") as unknown as {
    insert: (rows: unknown) => Promise<{ error: { message: string } | null }>;
  };
  const { error: histErr } = await tableAlias.insert([{
    entity_type: input.table,
    entity_id: input.id,
    actor_id: input.actorId,
    from_status: from,
    to_status: input.toStatus,
    note: input.note ?? null,
  }]);
  if (histErr) console.error("[approval_history] insert failed:", histErr.message);

  // Audit log entry (Phase 17 helper).
  await writeAuditLog({
    actorId: input.actorId,
    action: "content.status_change",
    entityType: input.table,
    entityId: input.id,
    metadata: { from, to: input.toStatus, note: input.note ?? null },
    ipHash: getClientIpHash(),
  });

  return { ok: true, message: "Status updated.", from, to: input.toStatus };
}

export async function applyBatchTransition(input: {
  items: Array<{ table: ContentTable; id: string }>;
  toStatus: ContentStatus;
  note?: string;
  actorId: string;
}): Promise<{ ok: number; failed: number; errors: string[] }> {
  let ok = 0;
  const failed: string[] = [];
  for (const it of input.items) {
    const res = await applyTransition({
      table: it.table,
      id: it.id,
      toStatus: input.toStatus,
      note: input.note,
      actorId: input.actorId,
    });
    if (res.ok) ok += 1;
    else failed.push(`${it.table}:${it.id} — ${res.message}`);
  }
  await writeAuditLog({
    actorId: input.actorId,
    action: "content.status_batch_change",
    entityType: "(batch)",
    entityId: null,
    metadata: {
      to: input.toStatus,
      count: input.items.length,
      succeeded: ok,
      failed: failed.length,
      note: input.note ?? null,
    },
    ipHash: getClientIpHash(),
  });
  return { ok, failed: failed.length, errors: failed };
}
