"use server";
import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { invalidateCache } from "@/lib/cache";
import { isAllowedCmsMediaUrl } from "@/lib/safe-url";
import type { AdminActionState } from "./sermons";

const BUCKET = "leader-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
const LeaderSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required.").max(120),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(20000).optional().or(z.literal("")),
  image_url: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isAllowedCmsMediaUrl(v), "Image URL must be HTTPS on an approved host."),
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

export async function uploadLeaderImage(
  _prev: AdminActionState | null,
  fd: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };

  const file = fd.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, message: "No file selected." };

  if (file.size > MAX_SIZE) {
    return { ok: false, message: "File is too large. Maximum size is 5 MB." };
  }

  const { sniffImageFile } = await import("@/lib/file-magic");
  const sniffed = await sniffImageFile(file);
  if (!sniffed) {
    return {
      ok: false,
      message: "Invalid file. Please upload a real JPG, PNG, or WEBP image.",
    };
  }

  const path = `leaders/${crypto.randomUUID()}.${sniffed.extension}`;

  const { error } = await auth.supabase.storage.from(BUCKET).upload(path, file, {
    contentType: sniffed.mime,
    upsert: false,
  });
  if (error) return { ok: false, message: `Upload failed: ${error.message}` };

  const { data: urlData } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, message: "Image uploaded.", id: urlData.publicUrl };
}

function extractStoragePath(imageUrl: string): string | null {
  const marker = "/storage/v1/object/public/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  const after = imageUrl.substring(idx + marker.length);
  const slashIdx = after.indexOf("/");
  if (slashIdx === -1) return null;
  return after.substring(slashIdx + 1);
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
    invalidateCache("featured-leaders");
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
    const { data: existing } = await auth.supabase.from("leaders").select("image_url").eq("id", id).maybeSingle();
    const { error } = await auth.supabase.from("leaders").update({
      full_name: d.full_name, title: d.title || null, bio: d.bio || null,
      image_url: d.image_url || null, email: d.email || null, phone: d.phone || null,
      sort_order: d.sort_order ?? 0, is_featured: d.is_featured === "on", status: d.status,
      updated_by: auth.userId, published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) return { ok: false, message: "Could not update leader." };

    if (existing?.image_url && d.image_url && existing.image_url !== d.image_url) {
      const oldPath = extractStoragePath(existing.image_url);
      if (oldPath) await auth.supabase.storage.from(BUCKET).remove([oldPath]);
    }

    revalidatePath("/admin/leadership");
    revalidatePath(`/admin/leadership/${id}`);
    revalidatePath("/about/leadership");
    invalidateCache("featured-leaders");
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
    invalidateCache("featured-leaders");
    return { ok: true, message: "Leader deleted." };
  } catch { return { ok: false, message: "Could not delete leader." }; }
}
