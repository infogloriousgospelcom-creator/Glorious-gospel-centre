"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
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
    const { error } = await auth.supabase.from("contact_messages").update({ is_read }).eq("id", id);
    if (error) return { ok: false, message: "Could not update." };
    revalidatePath("/admin/messages");
    return { ok: true, message: is_read ? "Marked as read." : "Marked as unread." };
  } catch { return { ok: false, message: "Could not update." }; }
}

export async function deleteMessage(id: string): Promise<AdminActionState> {
  const auth = await assertContactManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("contact_messages").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete." };
    revalidatePath("/admin/messages");
    return { ok: true, message: "Message deleted." };
  } catch { return { ok: false, message: "Could not delete." }; }
}
