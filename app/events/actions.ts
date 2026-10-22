"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";
import { consumeAsync } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";
import { eventRegistrationBlockReason } from "@/lib/event-registration";

const RegistrationSchema = z.object({
  event_id: z.string().uuid("Invalid event id."),
  full_name: z.string().trim().min(2, "Name is too short.").max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .max(254, "Email is too long.")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(5, "Phone is too short.")
    .max(40, "Phone is too long.")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000, "Notes are too long.").optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type RegistrationState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
};

export async function registerForEvent(
  _prev: RegistrationState | null,
  formData: FormData,
): Promise<RegistrationState> {
  const ipHash = getClientIpHash();
  const rate = await consumeAsync(`event-reg:${ipHash ?? "anon"}`, {
    capacity: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.ok) {
    const minutes = Math.ceil(rate.resetMs / 60000);
    return {
      ok: false,
      message: `Too many registrations. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const parsed = RegistrationSchema.safeParse({
    event_id: formData.get("event_id"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
    website: formData.get("website"),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      errors[key] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }

  if (parsed.data.website) {
    return { ok: true, message: "Thank you. Your registration has been received." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: false, message: "We couldn't save your registration. Please try again." };
  }

  try {
    const supabase = createServiceRoleClient();

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id,status,registration_required,starts_at,ends_at")
      .eq("id", parsed.data.event_id)
      .maybeSingle();
    if (eventErr) {
      return { ok: false, message: "We couldn't save your registration. Please try again." };
    }
    const blocked = eventRegistrationBlockReason(event);
    if (blocked) return { ok: false, message: blocked };

    // Capacity: deferred. A SELECT-count-then-INSERT is not race-safe.
    // registration_capacity remains unused until a lock/RPC exists.

    // Soft duplicate protection: same email+event within 24h.
    if (parsed.data.email) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", parsed.data.event_id)
        .eq("email", parsed.data.email)
        .gte("created_at", since)
        .limit(1)
        .maybeSingle();
      if (existing) {
        return {
          ok: true,
          message: "You are already registered for this event. We look forward to seeing you.",
        };
      }
    }

    const { error } = await supabase.from("event_registrations").insert({
      event_id: parsed.data.event_id,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
    });
    if (error) {
      return { ok: false, message: "We couldn't save your registration. Please try again." };
    }
    revalidatePath(`/events`);
    return { ok: true, message: "Thank you. Your registration has been received." };
  } catch {
    return { ok: false, message: "We couldn't save your registration. Please try again." };
  }
}
