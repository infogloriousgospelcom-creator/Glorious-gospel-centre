"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import {
  ModerateMembershipSchema,
  normalizeAdminNoteForRpc,
} from "@/lib/connect-group-membership-moderation-schema";
import type { AdminActionState } from "./sermons";

type ModerationAction = "approve" | "decline" | "remove";

const RPC_BY_ACTION: Record<ModerationAction, string> = {
  approve: "approve_connect_group_membership",
  decline: "decline_connect_group_membership",
  remove: "remove_connect_group_membership",
};

const AUDIT_BY_ACTION: Record<ModerationAction, string> = {
  approve: "connect_group_member.approve",
  decline: "connect_group_member.decline",
  remove: "connect_group_member.remove",
};

const SUCCESS_BY_ACTION: Record<ModerationAction, string> = {
  approve: "Membership approved.",
  decline: "Membership request declined.",
  remove: "Membership removed.",
};

async function assertMembersManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", {
    permission_key: "connect_groups.members.manage",
  });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, userId: user.user.id, supabase };
}

function mapModerationError(message: string, action: ModerationAction): string {
  const m = message.toLowerCase();
  if (m.includes("authentication required") || m.includes("permission denied")) {
    return "You do not have permission to moderate Connect Group memberships.";
  }
  if (m.includes("not found")) {
    return "That membership could not be found.";
  }
  if (m.includes("at capacity") || m.includes("full")) {
    return "This Connect Group is at capacity and cannot accept another active member.";
  }
  if (m.includes("admin note too long")) {
    return "Moderator note is too long.";
  }
  if (action === "approve" && m.includes("only pending")) {
    return "Only pending requests can be approved.";
  }
  if (action === "decline" && m.includes("only pending")) {
    return "Only pending requests can be declined.";
  }
  if (action === "remove" && m.includes("only active")) {
    return "Only active memberships can be removed.";
  }
  return "We couldn't update that membership. Please try again.";
}

async function revalidateMembershipPaths(
  supabase: ReturnType<typeof createClient>,
  membershipId: string,
) {
  const { data: row } = await supabase
    .from("connect_group_members")
    .select("connect_group_id")
    .eq("id", membershipId)
    .maybeSingle();

  if (row?.connect_group_id) {
    revalidatePath(`/admin/connect-groups/${row.connect_group_id}/members`);
    const { data: group } = await supabase
      .from("connect_groups")
      .select("slug")
      .eq("id", row.connect_group_id)
      .maybeSingle();
    if (group?.slug) {
      revalidatePath(`/connect/${group.slug}`);
    }
  }
  revalidatePath("/admin/connect-groups");
  revalidatePath("/connect");
  revalidatePath("/account");
}

async function moderateMembership(
  action: ModerationAction,
  membershipId: string,
  adminNote?: string | null,
): Promise<AdminActionState> {
  const auth = await assertMembersManager();
  if (!auth.ok) return { ok: false, message: auth.error };

  const parsed = ModerateMembershipSchema.safeParse({
    membership_id: membershipId,
    admin_note: adminNote ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid membership request." };
  }

  const noteArg = normalizeAdminNoteForRpc(parsed.data.admin_note);
  // Empty string from UI means "clear / set empty" → pass "" so RPC nullifies.
  // Undefined omission: we always pass string|null from form; "" clears.

  try {
    const { data: prior } = await auth.supabase
      .from("connect_group_members")
      .select("id,status,connect_group_id")
      .eq("id", parsed.data.membership_id)
      .maybeSingle();

    const { error } = await auth.supabase.rpc(RPC_BY_ACTION[action], {
      p_membership_id: parsed.data.membership_id,
      p_admin_note: noteArg,
    });

    if (error) {
      return { ok: false, message: mapModerationError(error.message, action) };
    }

    await writeAuditLog({
      actorId: auth.userId,
      action: AUDIT_BY_ACTION[action],
      entityType: "connect_group_member",
      entityId: parsed.data.membership_id,
      metadata: {
        from_status: prior?.status ?? null,
        connect_group_id: prior?.connect_group_id ?? null,
        has_admin_note: Boolean(noteArg && noteArg.length > 0),
      },
      ipHash: getClientIpHash(),
    });

    await revalidateMembershipPaths(auth.supabase, parsed.data.membership_id);
    return { ok: true, message: SUCCESS_BY_ACTION[action] };
  } catch {
    return { ok: false, message: "We couldn't update that membership. Please try again." };
  }
}

export async function approveConnectGroupMembership(
  membershipId: string,
  adminNote?: string,
): Promise<AdminActionState> {
  return moderateMembership("approve", membershipId, adminNote);
}

export async function declineConnectGroupMembership(
  membershipId: string,
  adminNote?: string,
): Promise<AdminActionState> {
  return moderateMembership("decline", membershipId, adminNote);
}

export async function removeConnectGroupMembership(
  membershipId: string,
  adminNote?: string,
): Promise<AdminActionState> {
  return moderateMembership("remove", membershipId, adminNote);
}
