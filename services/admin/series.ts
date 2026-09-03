"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;

const SeriesWriteSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Slug is too short.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be lowercase letters, numbers, and hyphens."),
  title: z.string().trim().min(2, "Title is required.").max(200),
  description: z.string().trim().max(20000).optional().or(z.literal("")),
  hero_image: z.string().url("Hero image must be a URL.").optional().or(z.literal("")),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
  status: z.enum(STATUS).default("DRAFT"),
});

async function assertContentManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "content.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path[0]?.toString() ?? "form";
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

export async function createSeries(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = SeriesWriteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  try {
    const { data, error } = await auth.supabase
      .from("sermon_series")
      .insert({
        slug: d.slug,
        title: d.title,
        description: d.description || null,
        hero_image: d.hero_image || null,
        start_date: d.start_date || null,
        end_date: d.end_date || null,
        sort_order: d.sort_order ?? 0,
        status: d.status,
        created_by: auth.userId,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, message: "Could not create series. Slug may already exist." };
    revalidatePath("/sermons");
    return { ok: true, message: "Series created.", id: data.id };
  } catch {
    return { ok: false, message: "Could not create series." };
  }
}

export async function updateSeries(
  id: string,
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = SeriesWriteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  try {
    const { error } = await auth.supabase
      .from("sermon_series")
      .update({
        slug: d.slug,
        title: d.title,
        description: d.description || null,
        hero_image: d.hero_image || null,
        start_date: d.start_date || null,
        end_date: d.end_date || null,
        sort_order: d.sort_order ?? 0,
        status: d.status,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { ok: false, message: "Could not update series." };
    revalidatePath("/sermons");
    revalidatePath(`/sermons/series/${d.slug}`);
    return { ok: true, message: "Series updated.", id };
  } catch {
    return { ok: false, message: "Could not update series." };
  }
}

/**
 * Delete a sermon series.
 * Safe: ON DELETE SET NULL on sermons.series_id means sermons are NOT deleted
 * (they are merely detached from the series).
 */
export async function deleteSeries(id: string): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("sermon_series").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete series." };
    revalidatePath("/sermons");
    return { ok: true, message: "Series deleted. Sermons in the series were preserved and detached." };
  } catch {
    return { ok: false, message: "Could not delete series." };
  }
}
