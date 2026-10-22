"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { createClient } from "@/supabase/server";
import { getCurrentUser } from "@/services/auth";
import { consumeAsync } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";
import { SubmitServeInterestSchema } from "@/lib/ministry-serve-interest-schema";
import { findOpenOwnServeInterest } from "@/services/ministry-serve-interest";

export type ServeInterestActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  duplicate?: boolean;
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

function mapDbError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email verification")) {
    return "Please verify your email address before expressing interest in serving.";
  }
  if (m.includes("another profile")) {
    return "You can only submit serve interest from your own account.";
  }
  if (m.includes("not available") || m.includes("ministry")) {
    return "That ministry is not currently available.";
  }
  if (m.includes("duplicate") || m.includes("unique") || m.includes("idx_serve_interests_open")) {
    return "You already have an open serve interest for this ministry.";
  }
  if (m.includes("member note too long")) {
    return "Please keep your note under 500 characters.";
  }
  return "We couldn't submit your interest. Please try again.";
}

/**
 * Verified congregant submits a serve interest.
 * profile_id and status are derived by the database — never trusted from the client.
 */
export async function submitServeInterestAction(
  _prev: ServeInterestActionState | null,
  formData: FormData,
): Promise<ServeInterestActionState> {
  const parsed = SubmitServeInterestSchema.safeParse({
    ministry_id: formData.get("ministry_id") ?? "",
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
    return { ok: false, message: "Please sign in to express interest in serving." };
  }
  if (!user.emailConfirmed) {
    return {
      ok: false,
      message: "Please verify your email address before expressing interest in serving.",
    };
  }

  const ministryId = parsed.data.ministry_id?.trim() || null;
  const memberNote = parsed.data.member_note?.trim() || null;

  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(
    `serve-interest:${ipHash}:${emailHash(user.email)}:${ministryId ?? "general"}`,
    { capacity: 5, windowMs: 15 * 60 * 1000 },
  );
  if (!rate.ok) {
    return { ok: false, message: "Too many submissions. Please try again later." };
  }

  try {
    const supabase = createClient();

    if (ministryId) {
      const { data: ministry, error: ministryErr } = await supabase
        .from("ministries")
        .select("id,status")
        .eq("id", ministryId)
        .maybeSingle();
      if (ministryErr || !ministry || ministry.status !== "PUBLISHED") {
        return { ok: false, message: "That ministry is not currently available." };
      }
    }

    const existing = await findOpenOwnServeInterest({ ministryId });
    if (existing) {
      return {
        ok: false,
        duplicate: true,
        message:
          "You already have an open serve interest for this area. You can see its status on your account.",
      };
    }

    const { error } = await supabase.from("ministry_serve_interests").insert({
      profile_id: user.userId,
      ministry_id: ministryId,
      status: "NEW",
      member_note: memberNote,
    });

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          duplicate: true,
          message:
            "You already have an open serve interest for this area. You can see its status on your account.",
        };
      }
      return { ok: false, message: mapDbError(error.message) };
    }

    revalidatePath("/serve");
    revalidatePath("/account");
    revalidatePath("/ministries");
    return {
      ok: true,
      message:
        "Thank you. The church has received your interest and will follow up. This is not an automatic placement.",
    };
  } catch {
    return { ok: false, message: "We couldn't submit your interest. Please try again." };
  }
}
