"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";
import { z } from "zod";

const STATUS = ["NEW", "READ", "RESPONDED", "ARCHIVED"] as const;
const NoteSchema = z.object({ id: z.string().uuid(), internal_notes: z.string().trim().max(2000) });
const StatusSchema = z.object({ id: z.string().uuid(), status: z.enum(STATUS) });
const AssignSchema = z.object({ id: z.string().uuid(), assigned_to: z.string().uuid() });

async function assertPrayerManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "prayer.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

export async function updatePrayerStatus(id: string, status: string): Promise<AdminActionState> {
  const auth = await assertPrayerManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = StatusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false, message: "Invalid status." };
  try {
    const { error } = await auth.supabase.from("prayer_requests").update({ status: parsed.data.status }).eq("id", id);
    if (error) return { ok: false, message: "Could not update status." };
    revalidatePath("/admin/prayer-requests");
    return { ok: true, message: "Status updated." };
  } catch { return { ok: false, message: "Could not update status." }; }
}

export async function updatePrayerNotes(id: string, internal_notes: string): Promise<AdminActionState> {
  const auth = await assertPrayerManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = NoteSchema.safeParse({ id, internal_notes });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  try {
    const { error } = await auth.supabase.from("prayer_requests").update({ internal_notes: parsed.data.internal_notes || null }).eq("id", id);
    if (error) return { ok: false, message: "Could not save notes." };
    revalidatePath("/admin/prayer-requests");
    return { ok: true, message: "Notes saved." };
  } catch { return { ok: false, message: "Could not save notes." }; }
}

export async function assignPrayerRequest(id: string, assigned_to: string | null): Promise<AdminActionState> {
  const auth = await assertPrayerManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = AssignSchema.safeParse({ id, assigned_to: assigned_to ?? "" });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  try {
    const { error } = await auth.supabase.from("prayer_requests").update({ assigned_to: parsed.data.assigned_to }).eq("id", id);
    if (error) return { ok: false, message: "Could not assign." };
    revalidatePath("/admin/prayer-requests");
    return { ok: true, message: "Assigned." };
  } catch { return { ok: false, message: "Could not assign." }; }
}

export async function deletePrayerRequest(id: string): Promise<AdminActionState> {
  const auth = await assertPrayerManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("prayer_requests").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete." };
    revalidatePath("/admin/prayer-requests");
    return { ok: true, message: "Prayer request deleted." };
  } catch { return { ok: false, message: "Could not delete." }; }
}
