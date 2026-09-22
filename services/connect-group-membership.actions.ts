"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { createClient } from "@/supabase/server";
import { getCurrentUser } from "@/services/auth";
import { consumeAsync } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";
import {
  JoinConnectGroupSchema,
  LeaveConnectGroupSchema,
  membershipJoinBlockedMessage,
} from "@/lib/connect-group-membership-schema";
import { isConnectGroupMemberStatus } from "@/lib/connect-group-members";

export type MembershipActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  status?: string;
};

function zodFieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = issue.path[0]?.toString() ?? "form";
    if (!errors[k]) errors[k] = issue.message;
  }
  return errors;
}

function emailHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23505" || (error.message ?? "").toLowerCase().includes("duplicate");
}

function mapDbJoinError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("not open for membership")) {
    return "This Connect Group is not currently accepting membership requests.";
  }
  if (m.includes("at capacity") || m.includes("full")) {
    return "This Connect Group is currently full.";
  }
  if (m.includes("only create pending")) {
    return "Membership requests must start as pending.";
  }
  if (m.includes("another profile")) {
    return "You can only request membership for your own account.";
  }
  return "We couldn't submit your request. Please try again.";
}

/**
 * Congregant join request → PENDING membership.
 * Identity and status come from the session / server — never from client authority.
 */
export async function requestConnectGroupJoinAction(
  _prev: MembershipActionState | null,
  formData: FormData,
): Promise<MembershipActionState> {
  const parsed = JoinConnectGroupSchema.safeParse({
    connect_group_id: formData.get("connect_group_id"),
    member_note: formData.get("member_note") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: zodFieldErrors(parsed.error),
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to join a Connect Group." };
  }
  if (!user.emailConfirmed) {
    return {
      ok: false,
      message: "Please verify your email address before joining a Connect Group.",
    };
  }

  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(
    `cg-join:${ipHash}:${emailHash(user.email)}:${parsed.data.connect_group_id}`,
    { capacity: 5, windowMs: 15 * 60 * 1000 },
  );
  if (!rate.ok) {
    return { ok: false, message: "Too many join attempts. Please try again later." };
  }

  try {
    const supabase = createClient();
    const groupId = parsed.data.connect_group_id;

    // Application pre-checks (DB triggers remain authoritative).
    const { data: group, error: groupErr } = await supabase
      .from("connect_groups")
      .select("id,status,published_at,slug,name")
      .eq("id", groupId)
      .maybeSingle();

    if (groupErr || !group) {
      return { ok: false, message: "That Connect Group could not be found." };
    }
    if (group.status !== "OPEN" || !group.published_at) {
      if (group.status === "FULL") {
        return { ok: false, message: "This Connect Group is currently full." };
      }
      return {
        ok: false,
        message: "This Connect Group is not currently accepting membership requests.",
      };
    }

    const { data: existing } = await supabase
      .from("connect_group_members")
      .select("id,status")
      .eq("connect_group_id", groupId)
      .eq("profile_id", user.userId)
      .maybeSingle();

    if (existing?.status && isConnectGroupMemberStatus(existing.status)) {
      return {
        ok: false,
        message: membershipJoinBlockedMessage(existing.status),
        status: existing.status,
      };
    }

    const note =
      parsed.data.member_note && parsed.data.member_note.trim().length > 0
        ? parsed.data.member_note.trim()
        : null;

    const { error: insertErr } = await supabase.from("connect_group_members").insert({
      connect_group_id: groupId,
      profile_id: user.userId,
      status: "PENDING",
      member_note: note,
    });

    if (insertErr) {
      if (isUniqueViolation(insertErr)) {
        const { data: again } = await supabase
          .from("connect_group_members")
          .select("status")
          .eq("connect_group_id", groupId)
          .eq("profile_id", user.userId)
          .maybeSingle();
        if (again?.status && isConnectGroupMemberStatus(again.status)) {
          return {
            ok: false,
            message: membershipJoinBlockedMessage(again.status),
            status: again.status,
          };
        }
        return { ok: false, message: membershipJoinBlockedMessage("PENDING") };
      }
      return { ok: false, message: mapDbJoinError(insertErr.message) };
    }

    if (group.slug) {
      revalidatePath(`/connect/${group.slug}`);
    }
    revalidatePath("/connect");
    revalidatePath("/account");

    return {
      ok: true,
      message: "Your request to join has been submitted and is pending review.",
      status: "PENDING",
    };
  } catch {
    return { ok: false, message: "We couldn't submit your request. Please try again." };
  }
}

/**
 * Congregant leave: ACTIVE → LEFT via leave_connect_group RPC.
 * PENDING withdrawal is not implemented in I-B3 (no CANCELLED status; history preserved).
 */
export async function leaveConnectGroupAction(
  _prev: MembershipActionState | null,
  formData: FormData,
): Promise<MembershipActionState> {
  const parsed = LeaveConnectGroupSchema.safeParse({
    membership_id: formData.get("membership_id"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: zodFieldErrors(parsed.error),
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to leave a Connect Group." };
  }

  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(
    `cg-leave:${ipHash}:${emailHash(user.email)}:${parsed.data.membership_id}`,
    { capacity: 8, windowMs: 15 * 60 * 1000 },
  );
  if (!rate.ok) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }

  try {
    const supabase = createClient();

    const { data: membership, error: loadErr } = await supabase
      .from("connect_group_members")
      .select("id,status,profile_id,connect_group_id")
      .eq("id", parsed.data.membership_id)
      .maybeSingle();

    if (loadErr || !membership) {
      return { ok: false, message: "That membership could not be found." };
    }
    if (membership.profile_id !== user.userId) {
      return { ok: false, message: "You can only leave your own Connect Group membership." };
    }
    if (membership.status === "LEFT") {
      return { ok: true, message: "You have already left this Connect Group.", status: "LEFT" };
    }
    if (membership.status !== "ACTIVE") {
      return {
        ok: false,
        message: "Only active memberships can be left from your account.",
        status: membership.status,
      };
    }

    const { error: rpcErr } = await supabase.rpc("leave_connect_group", {
      p_membership_id: parsed.data.membership_id,
    });

    if (rpcErr) {
      const m = rpcErr.message.toLowerCase();
      if (m.includes("already") || m.includes("left")) {
        return { ok: true, message: "You have already left this Connect Group.", status: "LEFT" };
      }
      if (m.includes("only active")) {
        return { ok: false, message: "Only active memberships can be left from your account." };
      }
      if (m.includes("another member")) {
        return { ok: false, message: "You can only leave your own Connect Group membership." };
      }
      return { ok: false, message: "We couldn't update your membership. Please try again." };
    }

    const { data: group } = await supabase
      .from("connect_groups")
      .select("slug")
      .eq("id", membership.connect_group_id)
      .maybeSingle();

    if (group?.slug) revalidatePath(`/connect/${group.slug}`);
    revalidatePath("/connect");
    revalidatePath("/account");

    return {
      ok: true,
      message: "You have left this Connect Group.",
      status: "LEFT",
    };
  } catch {
    return { ok: false, message: "We couldn't update your membership. Please try again." };
  }
}
