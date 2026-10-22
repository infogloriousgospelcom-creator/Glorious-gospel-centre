"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import type { AdminActionState } from "./sermons";

async function assertContactManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "contact.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

export async function markMessageRead(id: string, is_read: boolean): Promise<AdminActionState> {
  const auth = await assertContactManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { data, error } = await auth.supabase
      .from("contact_messages")
      .update({ is_read })
      .eq("id", id)
      .select("id");
    if (error || !data?.length) return { ok: false, message: "Could not update." };

    await writeAuditLog({
      actorId: auth.userId,
      action: "contact.mark_read",
      entityType: "contact_message",
      entityId: id,
      metadata: { is_read },
      ipHash: getClientIpHash(),
    });

    revalidatePath("/admin/messages");
    return { ok: true, message: is_read ? "Marked as read." : "Marked as unread." };
  } catch {
    return { ok: false, message: "Could not update." };
  }
}

export async function deleteMessage(id: string): Promise<AdminActionState> {
  const auth = await assertContactManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { data, error } = await auth.supabase
      .from("contact_messages")
      .delete()
      .eq("id", id)
      .select("id");
    if (error || !data?.length) return { ok: false, message: "Could not delete." };

    await writeAuditLog({
      actorId: auth.userId,
      action: "contact.delete",
      entityType: "contact_message",
      entityId: id,
      metadata: {},
      ipHash: getClientIpHash(),
    });

    revalidatePath("/admin/messages");
    return { ok: true, message: "Message deleted." };
  } catch {
    return { ok: false, message: "Could not delete." };
  }
}
