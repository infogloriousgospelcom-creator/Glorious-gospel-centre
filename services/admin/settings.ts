"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";

const SettingsSchema = z.object({
  church_name: z.string().trim().min(1, "Church name is required.").max(200),
  tagline: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  office_hours: z.string().trim().max(200).optional().or(z.literal("")),
  google_maps_url: z.string().url().optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  mpesa_paybill: z.string().trim().max(40).optional().or(z.literal("")),
  mpesa_till: z.string().trim().max(40).optional().or(z.literal("")),
  bank_instructions: z.string().trim().max(2000).optional().or(z.literal("")),
  seo_default_title: z.string().trim().max(200).optional().or(z.literal("")),
  seo_default_description: z.string().trim().max(500).optional().or(z.literal("")),
  seo_default_og_image: z.string().url().optional().or(z.literal("")),
});

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) { const k = i.path[0]?.toString() ?? "form"; if (!out[k]) out[k] = i.message; }
  return out;
}
async function assertSettingsManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", { permission_key: "settings.manage" });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

export async function updateSiteSettings(_p: AdminActionState | null, fd: FormData): Promise<AdminActionState> {
  const auth = await assertSettingsManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = SettingsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  const d = parsed.data;
  try {
    // site_settings uses a regular uuid PK; read the existing row (singleton)
    // and update it. If no row exists, insert with a generated id.
    const { data: existing } = await auth.supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    const payload = {
      church_name: d.church_name,
      tagline: d.tagline || null,
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
      office_hours: d.office_hours || null,
      google_maps_url: d.google_maps_url || null,
      whatsapp: d.whatsapp || null,
      mpesa_paybill: d.mpesa_paybill || null,
      mpesa_till: d.mpesa_till || null,
      bank_instructions: d.bank_instructions || null,
      seo_default_title: d.seo_default_title || null,
      seo_default_description: d.seo_default_description || null,
      seo_default_og_image: d.seo_default_og_image || null,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    };

    let err: { message: string } | null = null;
    if (existing?.id) {
      const res = await auth.supabase.from("site_settings").update(payload).eq("id", existing.id);
      err = res.error;
    } else {
      const res = await auth.supabase.from("site_settings").insert({ ...payload, id: crypto.randomUUID() });
      err = res.error;
    }
    if (err) return { ok: false, message: "Could not save settings." };
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/contact");
    revalidatePath("/give");
    return { ok: true, message: "Settings saved." };
  } catch { return { ok: false, message: "Could not save settings." }; }
}
