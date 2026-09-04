"use server";
import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
const LeaderSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required.").max(120),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(20000).optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
  is_featured: z.literal("on").optional().or(z.literal("")),
  status: z.enum(STATUS).default("DRAFT"),
});
function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path[0]?.toString() ?? "form";
    if (!out[k]) out[k] = i.message;
  }
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

export async function createLeader(_p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = LeaderSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { data, error } = await auth.supabase.from("leaders").insert({
      full_name: d.full_name, title: d.title || null, bio: d.bio || null,
      image_url: d.image_url || null, email: d.email || null, phone: d.phone || null,
      sort_order: d.sort_order ?? 0, is_featured: d.is_featured === "on", status: d.status,
      created_by: auth.userId, updated_by: auth.userId,
      published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).select("id").single();
    if (error || !data) return { ok: false, message: "Could not create leader." };
    revalidatePath("/admin/leadership");
    revalidatePath("/about/leadership");
    redirect(`/admin/leadership/${data.id}`);
  } catch (e) { if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e; return { ok: false, message: "Could not create leader." }; }
}

export async function updateLeader(id: string, _p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = LeaderSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { error } = await auth.supabase.from("leaders").update({
      full_name: d.full_name, title: d.title || null, bio: d.bio || null,
      image_url: d.image_url || null, email: d.email || null, phone: d.phone || null,
      sort_order: d.sort_order ?? 0, is_featured: d.is_featured === "on", status: d.status,
      updated_by: auth.userId, published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) return { ok: false, message: "Could not update leader." };
    revalidatePath("/admin/leadership");
    revalidatePath(`/admin/leadership/${id}`);
    revalidatePath("/about/leadership");
    return { ok: true, message: "Leader updated.", id };
  } catch { return { ok: false, message: "Could not update leader." }; }
}

export async function deleteLeader(id: string): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("leaders").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete leader." };
    revalidatePath("/admin/leadership");
    revalidatePath("/about/leadership");
    return { ok: true, message: "Leader deleted." };
  } catch { return { ok: false, message: "Could not delete leader." }; }
}
