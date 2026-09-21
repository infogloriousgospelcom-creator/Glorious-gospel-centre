"use server";

import "server-only";
import { z } from "zod";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";
import { consumeAsync } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";

const SUBMIT_SCHEMA = z.object({
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  request_text: z
    .string()
    .trim()
    .min(10, "Please share at least a sentence so we can pray meaningfully.")
    .max(4000, "Please keep your request under 4000 characters."),
  is_confidential: z.literal("on").optional().or(z.literal("")),
  website: z.string().max(0, "Spam detected.").optional().or(z.literal("")),
});

export type PrayerSubmitState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
};

export async function submitPrayerRequest(
  _prev: PrayerSubmitState | null,
  formData: FormData,
): Promise<PrayerSubmitState> {
  const ipHash = getClientIpHash();
  const rate = await consumeAsync(`prayer:${ipHash ?? "anon"}`, {
    capacity: 3,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.ok) {
    const minutes = Math.ceil(rate.resetMs / 60000);
    return {
      ok: false,
      message: `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const parsed = SUBMIT_SCHEMA.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString() ?? "form";
      if (!errors[k]) errors[k] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }

  const d = parsed.data;
  if (d.website) {
    return { ok: true, message: "Your request has been received." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: false, message: "We couldn't save your prayer request. Please try again." };
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("prayer_requests").insert({
      full_name: d.full_name || null,
      email: d.email || null,
      phone: d.phone || null,
      request_text: d.request_text,
      is_confidential: d.is_confidential === "on",
      ip_hash: ipHash,
    });
    if (error) {
      return { ok: false, message: "We couldn't save your prayer request. Please try again." };
    }
    return {
      ok: true,
      message: "Your prayer request has been received. Our prayer team will lift it up.",
    };
  } catch {
    return { ok: false, message: "We couldn't save your prayer request. Please try again." };
  }
}
