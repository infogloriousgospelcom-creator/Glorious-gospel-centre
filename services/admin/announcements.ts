"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;

const AnnouncementSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(200),
  body: z.string().trim().min(2, "Body is required.").max(20000),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
  is_pinned: z.literal("on").optional().or(z.literal("")),
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

function normalizeDateTime(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function createAnnouncement(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = AnnouncementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  try {
    const { data, error } = await auth.supabase
      .from("announcements")
      .insert({
        title: d.title,
        body: d.body,
        starts_at: normalizeDateTime(d.starts_at),
        ends_at: normalizeDateTime(d.ends_at),
        is_pinned: d.is_pinned === "on",
        status: d.status,
        created_by: auth.userId,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, message: "Could not create announcement." };
    }
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    redirect(`/admin/announcements/${data.id}`);
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { ok: false, message: "Could not create announcement." };
  }
}

export async function updateAnnouncement(
  id: string,
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = AnnouncementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  try {
    const { error } = await auth.supabase
      .from("announcements")
      .update({
        title: d.title,
        body: d.body,
        starts_at: normalizeDateTime(d.starts_at),
        ends_at: normalizeDateTime(d.ends_at),
        is_pinned: d.is_pinned === "on",
        status: d.status,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { ok: false, message: "Could not update announcement." };
    revalidatePath("/admin/announcements");
    revalidatePath(`/admin/announcements/${id}`);
    revalidatePath("/");
    return { ok: true, message: "Announcement updated.", id };
  } catch {
    return { ok: false, message: "Could not update announcement." };
  }
}

export async function deleteAnnouncement(id: string): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("announcements").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete announcement." };
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { ok: true, message: "Announcement deleted." };
  } catch {
    return { ok: false, message: "Could not delete announcement." };
  }
}
