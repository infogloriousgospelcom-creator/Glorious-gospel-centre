"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;

const SermonWriteSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Slug is too short.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be lowercase letters, numbers, and hyphens."),
  title: z.string().trim().min(2, "Title is required.").max(200),
  description: z.string().trim().max(20000).optional().or(z.literal("")),
  speaker: z.string().trim().max(120).optional().or(z.literal("")),
  preached_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."),
  scripture: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  thumbnail_url: z.string().url("Thumbnail must be a URL.").optional().or(z.literal("")),
  video_url: z.string().url("Video must be a URL.").optional().or(z.literal("")),
  audio_url: z.string().url("Audio must be a URL.").optional().or(z.literal("")),
  livestream_url: z.string().url("Livestream must be a URL.").optional().or(z.literal("")),
  duration_seconds: z.coerce.number().int().min(0).max(60 * 60 * 12).optional(),
  series_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(STATUS).default("DRAFT"),
});

export type AdminActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  id?: string;
};

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

export async function createSermon(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = SermonWriteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  try {
    const { data, error } = await auth.supabase
      .from("sermons")
      .insert({
        slug: d.slug,
        title: d.title,
        description: d.description || null,
        speaker: d.speaker || null,
        preached_on: d.preached_on,
        scripture: d.scripture || null,
        category: d.category || null,
        thumbnail_url: d.thumbnail_url || null,
        video_url: d.video_url || null,
        audio_url: d.audio_url || null,
        livestream_url: d.livestream_url || null,
        duration_seconds: d.duration_seconds ?? null,
        series_id: d.series_id || null,
        status: d.status,
        created_by: auth.userId,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, message: "Could not create sermon. Check for duplicate slug or invalid data." };
    }
    revalidatePath("/sermons");
    return { ok: true, message: "Sermon created.", id: data.id };
  } catch {
    return { ok: false, message: "Could not create sermon." };
  }
}

export async function updateSermon(
  id: string,
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = SermonWriteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  try {
    const { error } = await auth.supabase
      .from("sermons")
      .update({
        slug: d.slug,
        title: d.title,
        description: d.description || null,
        speaker: d.speaker || null,
        preached_on: d.preached_on,
        scripture: d.scripture || null,
        category: d.category || null,
        thumbnail_url: d.thumbnail_url || null,
        video_url: d.video_url || null,
        audio_url: d.audio_url || null,
        livestream_url: d.livestream_url || null,
        duration_seconds: d.duration_seconds ?? null,
        series_id: d.series_id || null,
        status: d.status,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { ok: false, message: "Could not update sermon." };
    revalidatePath("/sermons");
    revalidatePath(`/sermons/${d.slug}`);
    return { ok: true, message: "Sermon updated.", id };
  } catch {
    return { ok: false, message: "Could not update sermon." };
  }
}

export async function deleteSermon(id: string): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("sermons").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete sermon." };
    revalidatePath("/sermons");
    return { ok: true, message: "Sermon deleted." };
  } catch {
    return { ok: false, message: "Could not delete sermon." };
  }
}
