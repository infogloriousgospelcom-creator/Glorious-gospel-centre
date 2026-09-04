"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;

const MinistrySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(2, "Name is required.").max(120),
  short_description: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(20000).optional().or(z.literal("")),
  hero_image: z.string().url().optional().or(z.literal("")),
  meeting_info: z.string().trim().max(500).optional().or(z.literal("")),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().trim().max(40).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
  status: z.enum(STATUS).default("DRAFT"),
});

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path[0]?.toString() ?? "form";
    if (!out[k]) out[k] = issue.message;
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

export async function createMinistry(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = MinistrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  try {
    const { data, error } = await auth.supabase
      .from("ministries")
      .insert({
        slug: d.slug,
        name: d.name,
        short_description: d.short_description || null,
        description: d.description || null,
        hero_image: d.hero_image || null,
        meeting_info: d.meeting_info || null,
        contact_email: d.contact_email || null,
        contact_phone: d.contact_phone || null,
        sort_order: d.sort_order ?? 0,
        status: d.status,
        created_by: auth.userId,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, message: "Could not create ministry. Slug may already exist." };
    }
    revalidatePath("/admin/ministries");
    revalidatePath("/ministries");
    redirect(`/admin/ministries/${data.id}`);
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { ok: false, message: "Could not create ministry." };
  }
}

export async function updateMinistry(
  id: string,
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = MinistrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  try {
    const { error } = await auth.supabase
      .from("ministries")
      .update({
        slug: d.slug,
        name: d.name,
        short_description: d.short_description || null,
        description: d.description || null,
        hero_image: d.hero_image || null,
        meeting_info: d.meeting_info || null,
        contact_email: d.contact_email || null,
        contact_phone: d.contact_phone || null,
        sort_order: d.sort_order ?? 0,
        status: d.status,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { ok: false, message: "Could not update ministry." };
    revalidatePath("/admin/ministries");
    revalidatePath(`/admin/ministries/${id}`);
    revalidatePath("/ministries");
    revalidatePath(`/ministries/${d.slug}`);
    return { ok: true, message: "Ministry updated.", id };
  } catch {
    return { ok: false, message: "Could not update ministry." };
  }
}

export async function deleteMinistry(id: string): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("ministries").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete ministry." };
    revalidatePath("/admin/ministries");
    revalidatePath("/ministries");
    return { ok: true, message: "Ministry deleted." };
  } catch {
    return { ok: false, message: "Could not delete ministry." };
  }
}
