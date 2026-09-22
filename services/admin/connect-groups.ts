"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import {
  slugifyConnectGroupName,
  toPlainConnectText,
  uniqueConnectGroupSlug,
} from "@/lib/connect-groups";
import type { AdminActionState } from "./sermons";

const STATUS = ["DRAFT", "OPEN", "FULL", "CLOSED", "ARCHIVED"] as const;

const UpsertSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  short_description: z.string().trim().max(280).optional().or(z.literal("")),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  meeting_day: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === undefined ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 6), {
      message: "Invalid meeting day.",
    }),
  meeting_time: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{2}:\d{2}(:\d{2})?$/.test(v), "Time must be HH:MM."),
  meeting_frequency: z.string().trim().max(120).optional().or(z.literal("")),
  location_note: z.string().trim().max(280).optional().or(z.literal("")),
  capacity: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === undefined ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v > 0), {
      message: "Capacity must be a positive number.",
    }),
  leader_display_name: z.string().trim().max(120).optional().or(z.literal("")),
  ministry_id: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[0-9a-f-]{36}$/i.test(v), {
      message: "Invalid ministry.",
    }),
  status: z.enum(STATUS),
  sort_order: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === undefined ? 0 : Number(v)))
    .refine((v) => Number.isInteger(v), "Sort order must be an integer."),
});

async function assertConnectGroupsManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", {
    permission_key: "connect_groups.manage",
  });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, supabase, userId: user.user.id };
}

function revalidateConnectPaths(slug?: string | null) {
  revalidatePath("/admin/connect-groups");
  revalidatePath("/connect");
  revalidatePath("/");
  revalidatePath("/ministries");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/connect/${slug}`);
}

function publishedAtForStatus(status: string, prior: string | null): string | null {
  if (status === "DRAFT" || status === "ARCHIVED") return null;
  return prior ?? new Date().toISOString();
}

export async function createConnectGroup(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertConnectGroupsManager();
  if (!auth.ok) return { ok: false, message: auth.error };

  const parsed = UpsertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the form fields." };
  }

  const d = parsed.data;
  const name = toPlainConnectText(d.name);
  const id = crypto.randomUUID();
  const slug = toPlainConnectText(d.slug ?? "") || uniqueConnectGroupSlug(name, id);

  try {
    const { error } = await auth.supabase.from("connect_groups").insert({
      id,
      name,
      slug,
      short_description: toPlainConnectText(d.short_description ?? "") || null,
      description: toPlainConnectText(d.description ?? "") || null,
      meeting_day: d.meeting_day,
      meeting_time: d.meeting_time || null,
      meeting_frequency: toPlainConnectText(d.meeting_frequency ?? "") || null,
      location_note: toPlainConnectText(d.location_note ?? "") || null,
      capacity: d.capacity,
      leader_display_name: toPlainConnectText(d.leader_display_name ?? "") || null,
      ministry_id: d.ministry_id || null,
      status: d.status,
      sort_order: d.sort_order,
      published_at: publishedAtForStatus(d.status, null),
      created_by: auth.userId,
      updated_by: auth.userId,
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: "That slug is already in use." };
      }
      return { ok: false, message: "Could not create the group." };
    }

    await writeAuditLog({
      actorId: auth.userId,
      action: "connect_group.create",
      entityType: "connect_group",
      entityId: id,
      metadata: { slug, status: d.status },
      ipHash: getClientIpHash(),
    });

    revalidateConnectPaths(slug);
    return { ok: true, message: "Connect Group created." };
  } catch {
    return { ok: false, message: "Could not create the group." };
  }
}

export async function updateConnectGroup(
  id: string,
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertConnectGroupsManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };

  const parsed = UpsertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please correct the form fields." };
  }

  const d = parsed.data;
  const name = toPlainConnectText(d.name);
  const slug =
    toPlainConnectText(d.slug ?? "") ||
    slugifyConnectGroupName(name) ||
    uniqueConnectGroupSlug(name, id);

  try {
    const { data: prior } = await auth.supabase
      .from("connect_groups")
      .select("slug,published_at,status")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase
      .from("connect_groups")
      .update({
        name,
        slug,
        short_description: toPlainConnectText(d.short_description ?? "") || null,
        description: toPlainConnectText(d.description ?? "") || null,
        meeting_day: d.meeting_day,
        meeting_time: d.meeting_time || null,
        meeting_frequency: toPlainConnectText(d.meeting_frequency ?? "") || null,
        location_note: toPlainConnectText(d.location_note ?? "") || null,
        capacity: d.capacity,
        leader_display_name: toPlainConnectText(d.leader_display_name ?? "") || null,
        ministry_id: d.ministry_id || null,
        status: d.status,
        sort_order: d.sort_order,
        published_at: publishedAtForStatus(d.status, prior?.published_at ?? null),
        updated_by: auth.userId,
      })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: "That slug is already in use." };
      }
      return { ok: false, message: "Could not update the group." };
    }

    await writeAuditLog({
      actorId: auth.userId,
      action: "connect_group.update",
      entityType: "connect_group",
      entityId: id,
      metadata: { slug, status: d.status, from: prior?.status ?? null },
      ipHash: getClientIpHash(),
    });

    revalidateConnectPaths(prior?.slug ?? slug);
    revalidateConnectPaths(slug);
    return { ok: true, message: "Connect Group updated." };
  } catch {
    return { ok: false, message: "Could not update the group." };
  }
}

export async function deleteConnectGroup(id: string): Promise<AdminActionState> {
  const auth = await assertConnectGroupsManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };

  try {
    const { data: prior } = await auth.supabase
      .from("connect_groups")
      .select("slug")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase.from("connect_groups").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete the group." };

    await writeAuditLog({
      actorId: auth.userId,
      action: "connect_group.delete",
      entityType: "connect_group",
      entityId: id,
      metadata: { slug: prior?.slug ?? null },
      ipHash: getClientIpHash(),
    });

    revalidateConnectPaths(prior?.slug ?? null);
    return { ok: true, message: "Connect Group deleted." };
  } catch {
    return { ok: false, message: "Could not delete the group." };
  }
}
