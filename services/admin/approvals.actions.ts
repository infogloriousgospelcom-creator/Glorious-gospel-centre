"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import { applyTransition, applyBatchTransition } from "./approvals.workflow";
import type { AdminActionState } from "./sermons";
import { getClientIpHash } from "@/lib/ip-hash";
import { writeAuditLog } from "@/lib/audit";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
const TABLES = ["events", "sermons", "announcements", "pages"] as const;

const SingleSchema = z.object({
  table: z.enum(TABLES),
  id: z.string().uuid(),
  to_status: z.enum(STATUS),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

const BatchSchema = z.object({
  items: z
    .array(z.object({ table: z.enum(TABLES), id: z.string().uuid() }))
    .min(1, "Select at least one item.")
    .max(100, "Too many items in one batch."),
  to_status: z.enum(STATUS),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

async function assertContentManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "content.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

export type BatchApprovalState = {
  ok: boolean;
  message: string;
  succeeded?: number;
  failed?: number;
  errors?: string[];
};

export async function approveOneAction(
  _p: AdminActionState | null,
  fd: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = SingleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const res = await applyTransition({
    table: parsed.data.table,
    id: parsed.data.id,
    toStatus: parsed.data.to_status,
    note: parsed.data.note,
    actorId: auth.userId,
  });
  revalidatePath("/admin/approvals");
  revalidatePath(`/admin/${parsed.data.table}`);
  revalidatePath(`/admin/${parsed.data.table}/${parsed.data.id}`);
  return { ok: res.ok, message: res.message };
}

export async function batchApproveAction(
  _p: BatchApprovalState | null,
  fd: FormData,
): Promise<BatchApprovalState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const rawItems = fd.getAll("items").map((v) => {
    const s = String(v);
    const [table, id] = s.split("|");
    return { table, id };
  });
  const itemsParsed = z
    .array(z.object({ table: z.enum(TABLES), id: z.string().uuid() }))
    .min(1)
    .max(100)
    .safeParse(rawItems);
  if (!itemsParsed.success) {
    return { ok: false, message: "No items selected or invalid selection." };
  }
  const parsed = BatchSchema.safeParse({
    items: itemsParsed.data,
    to_status: fd.get("to_status"),
    note: fd.get("note"),
  });
  if (!parsed.success) return { ok: false, message: "Invalid batch input." };

  const res = await applyBatchTransition({
    items: parsed.data.items,
    toStatus: parsed.data.to_status,
    note: parsed.data.note,
    actorId: auth.userId,
  });
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/events");
  revalidatePath("/admin/sermons");
  revalidatePath("/admin/announcements");
  revalidatePath("/admin/pages");

  if (res.failed === 0) {
    return { ok: true, message: `${res.ok} item(s) updated.`, succeeded: res.ok, failed: 0, errors: [] };
  }
  if (res.ok === 0) {
    return { ok: false, message: "No items updated.", succeeded: 0, failed: res.failed, errors: res.errors };
  }
  return {
    ok: true,
    message: `${res.ok} updated, ${res.failed} failed.`,
    succeeded: res.ok,
    failed: res.failed,
    errors: res.errors,
  };
}

void getClientIpHash;
void writeAuditLog;
