"use server";
import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";
const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
const PageSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be lowercase letters, numbers, and hyphens."),
  title: z.string().trim().min(2, "Title is required.").max(200),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  body: z.string().trim().max(200000).optional().or(z.literal("")),
  hero_image: z.string().url().optional().or(z.literal("")),
  seo_title: z.string().trim().max(200).optional().or(z.literal("")),
  seo_description: z.string().trim().max(500).optional().or(z.literal("")),
  seo_og_image: z.string().url().optional().or(z.literal("")),
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
export async function createPage(_p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = PageSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { data, error } = await auth.supabase.from("pages").insert({
      slug: d.slug, title: d.title, excerpt: d.excerpt || null, body: d.body || null,
      hero_image: d.hero_image || null, seo_title: d.seo_title || null,
      seo_description: d.seo_description || null, seo_og_image: d.seo_og_image || null,
      status: d.status, created_by: auth.userId, updated_by: auth.userId,
      published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).select("id").single();
    if (error || !data) return { ok: false, message: "Could not create page. Slug may exist." };
    revalidatePath("/admin/pages");
    revalidatePath(`/${d.slug}`);
    redirect(`/admin/pages/${data.id}`);
  } catch (e) { if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e; return { ok: false, message: "Could not create page." }; }
}
export async function updatePage(id: string, _p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = PageSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    const { error } = await auth.supabase.from("pages").update({
      slug: d.slug, title: d.title, excerpt: d.excerpt || null, body: d.body || null,
      hero_image: d.hero_image || null, seo_title: d.seo_title || null,
      seo_description: d.seo_description || null, seo_og_image: d.seo_og_image || null,
      status: d.status, updated_by: auth.userId, published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) return { ok: false, message: "Could not update page." };
    revalidatePath("/admin/pages"); revalidatePath(`/admin/pages/${id}`); revalidatePath(`/${d.slug}`);
    return { ok: true, message: "Page updated.", id };
  } catch { return { ok: false, message: "Could not update page." }; }
}
export async function deletePage(id: string): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("pages").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete page." };
    revalidatePath("/admin/pages");
    return { ok: true, message: "Page deleted." };
  } catch { return { ok: false, message: "Could not delete page." }; }
}
