"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import { toPlainText, uniqueTestimonySlug } from "@/lib/testimonies";
import type { AdminActionState } from "./sermons";

const STATUS = ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as const;

const StatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS),
});

const NotesSchema = z.object({
  id: z.string().uuid(),
  internal_notes: z.string().trim().max(2000),
});

const EditSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  story: z.string().trim().min(40).max(8000),
  display_name: z.string().trim().max(120).optional().or(z.literal("")),
  anonymous: z.boolean(),
});

async function assertTestimonyManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", {
    permission_key: "testimonies.manage",
  });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  if (!isServiceRoleConfigured()) {
    return { ok: false as const, error: "Server configuration error." };
  }
  return {
    ok: true as const,
    userId: user.user.id,
    admin: createServiceRoleClient(),
  };
}

function revalidateTestimonyPaths(slug?: string | null) {
  revalidatePath("/admin/testimonies");
  revalidatePath("/testimonies");
  revalidatePath("/testimonies/share");
  if (slug) revalidatePath(`/testimonies/${slug}`);
  revalidatePath("/");
  revalidatePath("/prayer");
  revalidatePath("/sitemap.xml");
}

export async function setTestimonyStatus(
  id: string,
  status: string,
): Promise<AdminActionState> {
  const auth = await assertTestimonyManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = StatusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false, message: "Invalid status." };

  try {
    const { data: prior } = await auth.admin
      .from("testimonies")
      .select("id,status,slug,title,consent_to_publish,consent_at")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (!prior) return { ok: false, message: "Testimony not found." };

    if (parsed.data.status === "APPROVED") {
      if (!prior.consent_to_publish || !prior.consent_at) {
        return {
          ok: false,
          message: "Cannot approve a testimony without recorded publication consent.",
        };
      }
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: parsed.data.status,
      reviewed_by: auth.userId,
      reviewed_at: now,
    };

    if (parsed.data.status === "APPROVED") {
      patch.published_at = now;
      if (!prior.slug) {
        patch.slug = uniqueTestimonySlug(prior.title, prior.id);
      }
    }

    if (
      parsed.data.status === "ARCHIVED" ||
      parsed.data.status === "REJECTED" ||
      parsed.data.status === "PENDING"
    ) {
      // Clear publication timestamp so public policy (APPROVED + published_at)
      // cannot expose the story even if status were mishandled.
      patch.published_at = null;
    }

    const { error } = await auth.admin
      .from("testimonies")
      .update(patch)
      .eq("id", parsed.data.id);

    if (error) return { ok: false, message: "Could not update status." };

    await writeAuditLog({
      actorId: auth.userId,
      action: "testimony.status_change",
      entityType: "testimony",
      entityId: parsed.data.id,
      metadata: {
        from: prior.status,
        to: parsed.data.status,
        slug: (patch.slug as string | undefined) ?? prior.slug,
      },
      ipHash: getClientIpHash(),
    });

    revalidateTestimonyPaths(
      ((patch.slug as string | undefined) ?? prior.slug) as string | null,
    );
    return { ok: true, message: `Status set to ${parsed.data.status}.` };
  } catch {
    return { ok: false, message: "Could not update status." };
  }
}

export async function updateTestimonyNotes(
  id: string,
  internal_notes: string,
): Promise<AdminActionState> {
  const auth = await assertTestimonyManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = NotesSchema.safeParse({ id, internal_notes });
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  try {
    const { error } = await auth.admin
      .from("testimonies")
      .update({ internal_notes: parsed.data.internal_notes || null })
      .eq("id", parsed.data.id);
    if (error) return { ok: false, message: "Could not save notes." };

    await writeAuditLog({
      actorId: auth.userId,
      action: "testimony.notes_update",
      entityType: "testimony",
      entityId: parsed.data.id,
      metadata: { length: parsed.data.internal_notes.length },
      ipHash: getClientIpHash(),
    });

    revalidatePath("/admin/testimonies");
    return { ok: true, message: "Notes saved." };
  } catch {
    return { ok: false, message: "Could not save notes." };
  }
}

export async function updateTestimonyContent(input: {
  id: string;
  title: string;
  story: string;
  display_name: string;
  anonymous: boolean;
}): Promise<AdminActionState> {
  const auth = await assertTestimonyManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  const parsed = EditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid content." };

  const title = toPlainText(parsed.data.title);
  const story = toPlainText(parsed.data.story);
  const displayName = parsed.data.anonymous
    ? null
    : toPlainText(parsed.data.display_name ?? "") || null;

  try {
    const { data: prior } = await auth.admin
      .from("testimonies")
      .select("slug,status")
      .eq("id", parsed.data.id)
      .maybeSingle();

    const { error } = await auth.admin
      .from("testimonies")
      .update({
        title,
        story,
        display_name: displayName,
        anonymous: parsed.data.anonymous,
      })
      .eq("id", parsed.data.id);

    if (error) return { ok: false, message: "Could not update content." };

    await writeAuditLog({
      actorId: auth.userId,
      action: "testimony.content_update",
      entityType: "testimony",
      entityId: parsed.data.id,
      metadata: { title_length: title.length, story_length: story.length },
      ipHash: getClientIpHash(),
    });

    revalidateTestimonyPaths(prior?.slug ?? null);
    return { ok: true, message: "Content updated." };
  } catch {
    return { ok: false, message: "Could not update content." };
  }
}

export async function deleteTestimony(id: string): Promise<AdminActionState> {
  const auth = await assertTestimonyManager();
  if (!auth.ok) return { ok: false, message: auth.error };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Invalid id." };

  try {
    const { data: prior } = await auth.admin
      .from("testimonies")
      .select("slug")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.admin.from("testimonies").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete." };

    await writeAuditLog({
      actorId: auth.userId,
      action: "testimony.delete",
      entityType: "testimony",
      entityId: id,
      metadata: { slug: prior?.slug ?? null },
      ipHash: getClientIpHash(),
    });

    revalidateTestimonyPaths(prior?.slug ?? null);
    return { ok: true, message: "Testimony deleted." };
  } catch {
    return { ok: false, message: "Could not delete." };
  }
}
