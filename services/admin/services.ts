"use server";
import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
const ServiceSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM."),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
  is_recurring: z.literal("on").optional().or(z.literal("")),
  status: z.enum(STATUS).default("DRAFT"),
});
function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) { const k = i.path[0]?.toString() ?? "form"; if (!out[k]) out[k] = i.message; }
  return out;
}
async function assertContentManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "content.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

export async function createService(_p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = ServiceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { data, error } = await auth.supabase.from("services").insert({
      name: d.name, description: d.description || null,
      day_of_week: d.day_of_week,
      start_time: d.start_time, end_time: d.end_time || null,
      location: d.location || null, sort_order: d.sort_order ?? 0,
      is_recurring: d.is_recurring === "on", status: d.status,
      created_by: auth.userId, updated_by: auth.userId,
      published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).select("id").single();
    if (error || !data) return { ok: false, message: "Could not create service." };
    revalidatePath("/admin/services");
    revalidatePath("/services");
    redirect(`/admin/services/${data.id}`);
  } catch (e) { if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e; return { ok: false, message: "Could not create service." }; }
}

export async function updateService(id: string, _p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = ServiceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { error } = await auth.supabase.from("services").update({
      name: d.name, description: d.description || null,
      day_of_week: d.day_of_week,
      start_time: d.start_time, end_time: d.end_time || null,
      location: d.location || null, sort_order: d.sort_order ?? 0,
      is_recurring: d.is_recurring === "on", status: d.status,
      updated_by: auth.userId, published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) return { ok: false, message: "Could not update service." };
    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${id}`);
    revalidatePath("/services");
    return { ok: true, message: "Service updated.", id };
  } catch { return { ok: false, message: "Could not update service." }; }
}

export async function deleteService(id: string): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("services").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete service." };
    revalidatePath("/admin/services");
    revalidatePath("/services");
    return { ok: true, message: "Service deleted." };
  } catch { return { ok: false, message: "Could not delete service." }; }
}
