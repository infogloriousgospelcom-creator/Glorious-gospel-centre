"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
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

export async function setContentStatus(
  table: string,
  id: string,
  status: string,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = z.object({ table: Tables, id: z.string().uuid(), status: z.enum(STATUS) }).safeParse({ table, id, status });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  try {
    const now = parsed.data.status === "PUBLISHED" ? new Date().toISOString() : null;
    const patch: Record<string, unknown> = {
      status: parsed.data.status,
      updated_by: auth.userId,
    };
    if (parsed.data.status === "APPROVED" || parsed.data.status === "PUBLISHED") {
      patch.approved_by = auth.userId;
      patch.approved_at = new Date().toISOString();
    }
    if (now) patch.published_at = now;
    const { error } = await auth.supabase.from(parsed.data.table).update(patch).eq("id", id);
    if (error) return { ok: false, message: "Could not update status." };
    revalidatePath(`/admin/approvals`);
    revalidatePath(`/admin/${parsed.data.table}`);
    return { ok: true, message: "Status updated." };
  } catch { return { ok: false, message: "Could not update status." }; }
}
