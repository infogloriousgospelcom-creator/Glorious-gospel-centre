"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";

export type MarkNotificationState = {
  ok: boolean;
  message: string;
};

/**
 * Mark own notification read via mark_member_notification_read RPC.
 * Ownership enforced in DB with auth.uid() — no client recipient_id.
 */
export async function markMemberNotificationReadAction(
  _prev: MarkNotificationState,
  formData: FormData,
): Promise<MarkNotificationState> {
  const id = String(formData.get("notification_id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, message: "That notification could not be updated." };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return { ok: false, message: "Please sign in to continue." };
    }

    const { data, error } = await supabase.rpc("mark_member_notification_read", {
      p_notification_id: id,
    });

    if (error) {
      return { ok: false, message: "We couldn't update that notification. Please try again." };
    }

    if (data === false) {
      return { ok: false, message: "That notification could not be found." };
    }

    revalidatePath("/account");
    return { ok: true, message: "Marked as read." };
  } catch {
    return { ok: false, message: "We couldn't update that notification. Please try again." };
  }
}
