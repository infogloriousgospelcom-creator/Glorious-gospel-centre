"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import type { AdminActionState } from "./sermons";

const STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;

const EventSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Slug is too short.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be lowercase letters, numbers, and hyphens."),
  title: z.string().trim().min(2, "Title is required.").max(200),
  short_description: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(20000).optional().or(z.literal("")),
  poster_url: z.string().url("Poster must be a URL.").optional().or(z.literal("")),
  starts_at: z
    .string()
    .trim()
    .min(1, "Start date is required.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: "Start date is invalid.",
    }),
  ends_at: z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), {
      message: "End date is invalid.",
    })
    .optional()
    .or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  speaker: z.string().trim().max(120).optional().or(z.literal("")),
  registration_required: z.literal("on").optional().or(z.literal("")),
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

function toIso(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function uniqueSlug(base: string): string {
  return base
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function createEvent(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = EventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  const slug = uniqueSlug(d.slug);
  if (!slug) return { ok: false, message: "Slug must contain at least one letter or number." };
  try {
    const { data, error } = await auth.supabase
      .from("events")
      .insert({
        slug,
        title: d.title,
        short_description: d.short_description || null,
        description: d.description || null,
        poster_url: d.poster_url || null,
        starts_at: toIso(d.starts_at) ?? new Date().toISOString(),
        ends_at: toIso(d.ends_at),
        location: d.location || null,
        speaker: d.speaker || null,
        registration_required: d.registration_required === "on",
        status: d.status,
        created_by: auth.userId,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, message: "Could not create event. Slug may already exist." };
    }
    revalidatePath("/admin/events");
    revalidatePath("/events");
    redirect(`/admin/events/${data.id}`);
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { ok: false, message: "Could not create event." };
  }
}

export async function updateEvent(
  id: string,
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  const parsed = EventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: flattenZod(parsed.error) };
  }
  const d = parsed.data;
  const slug = uniqueSlug(d.slug);
  try {
    const { error } = await auth.supabase
      .from("events")
      .update({
        slug,
        title: d.title,
        short_description: d.short_description || null,
        description: d.description || null,
        poster_url: d.poster_url || null,
        starts_at: toIso(d.starts_at) ?? new Date().toISOString(),
        ends_at: toIso(d.ends_at),
        location: d.location || null,
        speaker: d.speaker || null,
        registration_required: d.registration_required === "on",
        status: d.status,
        updated_by: auth.userId,
        published_at: d.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { ok: false, message: "Could not update event." };
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);
    return { ok: true, message: "Event updated.", id };
  } catch {
    return { ok: false, message: "Could not update event." };
  }
}

export async function deleteEvent(id: string): Promise<AdminActionState> {
  const auth = await assertContentManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };
  try {
    const { error } = await auth.supabase.from("events").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete event." };
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { ok: true, message: "Event deleted." };
  } catch {
    return { ok: false, message: "Could not delete event." };
  }
}
