"use server";
import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";
const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
const AlbumSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be lowercase letters, numbers, and hyphens."),
  title: z.string().trim().min(2, "Title is required.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  cover_image: z.string().url().optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
  status: z.enum(STATUS).default("DRAFT"),
});
function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) { const k = i.path[0]?.toString() ?? "form"; if (!out[k]) out[k] = i.message; }
  return out;
}
async function assertMediaManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "media.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

export async function createAlbum(_p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertMediaManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = AlbumSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { data, error } = await auth.supabase.from("gallery_albums").insert({
      slug: d.slug, title: d.title, description: d.description || null,
      cover_image: d.cover_image || null, category: d.category || null,
      event_date: d.event_date || null, sort_order: d.sort_order ?? 0, status: d.status,
      created_by: auth.userId, updated_by: auth.userId,
      published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).select("id").single();
    if (error || !data) return { ok: false, message: "Could not create album." };
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    redirect(`/admin/gallery/${data.id}`);
  } catch (e) { if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e; return { ok: false, message: "Could not create album." }; }
}
export async function updateAlbum(id: string, _p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertMediaManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = AlbumSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { error } = await auth.supabase.from("gallery_albums").update({
      slug: d.slug, title: d.title, description: d.description || null,
      cover_image: d.cover_image || null, category: d.category || null,
      event_date: d.event_date || null, sort_order: d.sort_order ?? 0, status: d.status,
      updated_by: auth.userId, published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) return { ok: false, message: "Could not update album." };
    revalidatePath("/admin/gallery"); revalidatePath(`/admin/gallery/${id}`); revalidatePath("/gallery"); revalidatePath(`/gallery/${d.slug}`);
    return { ok: true, message: "Album updated.", id };
  } catch { return { ok: false, message: "Could not update album." }; }
}
export async function deleteAlbum(id: string): Promise<AdminActionState> {
  const auth = await assertMediaManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("gallery_albums").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete album." };
    revalidatePath("/admin/gallery"); revalidatePath("/gallery");
    return { ok: true, message: "Album deleted. Photos in this album were also removed." };
  } catch { return { ok: false, message: "Could not delete album." }; }
}

const ItemSchema = z.object({
  album_id: z.string().uuid(),
  storage_path: z.string().trim().min(2, "Storage path is required.").max(500),
  caption: z.string().trim().max(500).optional().or(z.literal("")),
  alt_text: z.string().trim().max(200).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).max(100000).optional(),
});
export async function addGalleryItem(_p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertMediaManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = ItemSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { error } = await auth.supabase.from("gallery_items").insert({
      album_id: d.album_id, storage_path: d.storage_path,
      caption: d.caption || null, alt_text: d.alt_text || null,
      sort_order: d.sort_order ?? 0, uploaded_by: auth.userId,
    });
    if (error) return { ok: false, message: "Could not add photo." };
    revalidatePath(`/admin/gallery/${d.album_id}`);
    revalidatePath(`/gallery/${d.album_id}`);
    return { ok: true, message: "Photo added." };
  } catch { return { ok: false, message: "Could not add photo." }; }
}
export async function removeGalleryItem(itemId: string, albumId: string): Promise<AdminActionState> {
  const auth = await assertMediaManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("gallery_items").delete().eq("id", itemId);
    if (error) return { ok: false, message: "Could not remove photo." };
    revalidatePath(`/admin/gallery/${albumId}`);
    return { ok: true, message: "Photo removed." };
  } catch { return { ok: false, message: "Could not remove photo." }; }
}
