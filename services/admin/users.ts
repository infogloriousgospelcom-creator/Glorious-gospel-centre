"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";
const ToggleSchema = z.object({ id: z.string().uuid(), is_active: z.boolean() });
async function assertRolesManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "roles.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}
export async function toggleAdminActive(id: string, is_active: boolean): Promise<AdminActionState> {
  const auth = await assertRolesManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = ToggleSchema.safeParse({ id, is_active });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  try {
    const { error } = await auth.supabase.from("admins").update({ is_active: parsed.data.is_active }).eq("id", parsed.data.id);
    if (error) return { ok: false, message: "Could not update." };
    revalidatePath("/admin/users");
    return { ok: true, message: is_active ? "Admin enabled." : "Admin disabled." };
  } catch { return { ok: false, message: "Could not update." }; }
}
