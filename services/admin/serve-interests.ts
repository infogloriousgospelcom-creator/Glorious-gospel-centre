"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import { UpdateServeInterestSchema } from "@/lib/ministry-serve-interest-schema";
import type { AdminActionState } from "./sermons";

async function assertServeInterestManager() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false as const, error: "Not authenticated." };
  const { data: allowed } = await supabase.rpc("has_permission", {
    permission_key: "serve_interests.manage",
  });
  if (!allowed) return { ok: false as const, error: "Insufficient permissions." };
  return { ok: true as const, userId: user.user.id, supabase };
}

function mapUpdateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("authentication required") || m.includes("permission denied")) {
    return "You do not have permission to update serve interests.";
  }
  if (m.includes("not found")) {
    return "That serve interest could not be found.";
  }
  if (m.includes("staff note too long")) {
    return "Staff note is too long.";
  }
  return "We couldn't update that serve interest. Please try again.";
}

export async function updateServeInterestAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await assertServeInterestManager();
  if (!auth.ok) return { ok: false, message: auth.error };

  const parsed = UpdateServeInterestSchema.safeParse({
    interest_id: formData.get("interest_id"),
    status: formData.get("status"),
    staff_note: formData.get("staff_note") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Invalid update." };

  try {
    const { data: prior } = await auth.supabase
      .from("ministry_serve_interests")
      .select("id,status,ministry_id")
      .eq("id", parsed.data.interest_id)
      .maybeSingle();

    const { error } = await auth.supabase.rpc("update_ministry_serve_interest", {
      p_interest_id: parsed.data.interest_id,
      p_status: parsed.data.status,
      p_staff_note: parsed.data.staff_note ?? "",
    });
    if (error) return { ok: false, message: mapUpdateError(error.message) };

    await writeAuditLog({
      actorId: auth.userId,
      action: "serve_interest.status_change",
      entityType: "ministry_serve_interest",
      entityId: parsed.data.interest_id,
      metadata: {
        from: prior?.status ?? null,
        to: parsed.data.status,
        ministry_id: prior?.ministry_id ?? null,
      },
      ipHash: getClientIpHash(),
    });

    revalidatePath("/admin/serve-interests");
    revalidatePath(`/admin/serve-interests/${parsed.data.interest_id}`);
    return { ok: true, message: "Serve interest updated." };
  } catch {
    return { ok: false, message: "We couldn't update that serve interest. Please try again." };
  }
}
