"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import type { AdminActionState } from "./sermons";

const STATUS = ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED"] as const;
const OverrideSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS),
  reason: z.string().trim().min(3, "Reason is required.").max(500),
});

async function assertGivingManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "giving.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

export async function overrideTransactionStatus(
  id: string,
  status: string,
  reason: string,
): Promise<AdminActionState> {
  const auth = await assertGivingManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = OverrideSchema.safeParse({ id, status, reason });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) { errors[i.path[0]?.toString() ?? "form"] = i.message; }
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }
  try {
    const { data: prior } = await auth.supabase
      .from("giving_transactions")
      .select("status,admin_notes")
      .eq("id", parsed.data.id)
      .maybeSingle();
    if (!prior) return { ok: false, message: "Transaction not found." };

    const { error } = await auth.supabase
      .from("giving_transactions")
      .update({
        status: parsed.data.status,
        admin_notes: parsed.data.reason,
      })
      .eq("id", parsed.data.id);
    if (error) return { ok: false, message: "Could not update status." };

    await writeAuditLog({
      actorId: auth.userId,
      action: "giving.status_override",
      entityType: "giving_transaction",
      entityId: parsed.data.id,
      metadata: { from: prior.status, to: parsed.data.status, reason: parsed.data.reason },
      ipHash: getClientIpHash(),
    });

    revalidatePath("/admin/giving");
    revalidatePath(`/admin/giving/${parsed.data.id}`);
    return { ok: true, message: "Status updated." };
  } catch { return { ok: false, message: "Could not update status." }; }
}
