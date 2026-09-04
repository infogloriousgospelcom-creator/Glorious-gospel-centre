"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import { applyTransition } from "./approvals.workflow";
import type { AdminActionState } from "./sermons";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
const Tables = z.enum(["events", "sermons", "announcements", "pages"]);

async function assertContentManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "content.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

/**
 * Single-row status change. Funnels through applyTransition so history +
 * audit are recorded consistently.
 */
export async function setContentStatus(
  table: string,
  id: string,
  status: string,
  note?: string,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = z.object({ table: Tables, id: z.string().uuid(), status: z.enum(STATUS) }).safeParse({ table, id, status });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const res = await applyTransition({
    table: parsed.data.table,
    id: parsed.data.id,
    toStatus: parsed.data.status,
    note,
    actorId: auth.userId,
  });
  revalidatePath("/admin/approvals");
  revalidatePath(`/admin/${parsed.data.table}`);
  revalidatePath(`/admin/${parsed.data.table}/${parsed.data.id}`);
  return { ok: res.ok, message: res.message };
}
